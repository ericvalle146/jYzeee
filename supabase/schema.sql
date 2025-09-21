-- ================================
-- SISTEMA DE PEDIDOS COM IA
-- Schema Supabase Completo
-- ================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. TABELA DE CLIENTES
-- ================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  delivery_notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_order_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 2. TABELA DE PRODUTOS/CARDÁPIO
-- ================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- minutos
  ingredients TEXT[],
  allergens TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 3. TABELA DE PEDIDOS
-- ================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Status do pedido
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
  
  -- Valores
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Pagamento
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Entrega
  delivery_address TEXT,
  delivery_neighborhood VARCHAR(255),
  delivery_notes TEXT,
  estimated_delivery TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Observações e contexto
  notes TEXT,
  ai_context JSONB, -- Contexto da conversa com IA
  conversation_id VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  
  -- Índices para performance
  INDEX idx_orders_status (status),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_phone (customer_phone),
  INDEX idx_orders_created (created_at DESC)
);

-- ================================
-- 4. TABELA DE ITENS DO PEDIDO
-- ================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Dados do produto (snapshot)
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100),
  
  -- Quantidade e preços
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Customizações
  customizations JSONB, -- Ex: {"size": "Large", "extras": ["cheese", "bacon"]}
  special_instructions TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_order_items_order (order_id)
);

-- ================================
-- 5. TABELA DE CONVERSAS/MENSAGENS
-- ================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Mensagem
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'document', 'location')),
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('customer', 'bot', 'human')),
  
  -- Contexto da IA
  ai_analysis JSONB, -- Resultado da análise da IA
  ai_confidence DECIMAL(3,2), -- Confiança da IA (0.00 a 1.00)
  ai_intent VARCHAR(100), -- Intent detectado pela IA
  
  -- WhatsApp específico
  whatsapp_message_id VARCHAR(100),
  whatsapp_conversation_id VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_conversations_customer (customer_id),
  INDEX idx_conversations_order (order_id),
  INDEX idx_conversations_created (created_at DESC)
);

-- ================================
-- 6. TABELA DE LOG DE MUDANÇAS
-- ================================
CREATE TABLE IF NOT EXISTS order_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Tipo de mudança
  action VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- Dados da mudança
  old_data JSONB,
  new_data JSONB,
  
  -- Autor da mudança
  changed_by VARCHAR(20) DEFAULT 'ai' CHECK (changed_by IN ('ai', 'human', 'system')),
  user_id VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_order_changes_order (order_id),
  INDEX idx_order_changes_created (created_at DESC)
);

-- ================================
-- 7. TRIGGERS PARA ATUALIZAÇÕES AUTOMÁTICAS
-- ================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar total do pedido
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) + delivery_fee - discount
        FROM order_items 
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    subtotal = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM order_items 
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger para recalcular total quando itens mudam
CREATE TRIGGER update_order_total_on_items 
    AFTER INSERT OR UPDATE OR DELETE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- ================================
-- 8. POLÍTICAS RLS (Row Level Security)
-- ================================

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_changes ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura (todos podem ler por enquanto)
CREATE POLICY "Permitir leitura para todos" ON customers FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para todos" ON orders FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para todos" ON order_items FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para todos" ON conversations FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para todos" ON order_changes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para todos" ON products FOR SELECT USING (true);

-- Políticas para escrita (todos podem escrever por enquanto)
CREATE POLICY "Permitir escrita para todos" ON customers FOR ALL USING (true);
CREATE POLICY "Permitir escrita para todos" ON orders FOR ALL USING (true);
CREATE POLICY "Permitir escrita para todos" ON order_items FOR ALL USING (true);
CREATE POLICY "Permitir escrita para todos" ON conversations FOR ALL USING (true);
CREATE POLICY "Permitir escrita para todos" ON order_changes FOR ALL USING (true);
CREATE POLICY "Permitir escrita para todos" ON products FOR ALL USING (true);

-- ================================
-- 9. FUNÇÕES AUXILIARES
-- ================================

-- Função para gerar número do pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    sequence_num INTEGER;
    order_num TEXT;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Buscar próximo número sequencial do dia
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    order_num := 'PED-' || today_date || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 10. DADOS INICIAIS (SEED)
-- ================================

-- Produtos de exemplo
INSERT INTO products (name, description, category, price, available) VALUES
('Pizza Margherita (P)', 'Massa fina, molho de tomate, mussarela e manjericão', 'Pizza', 24.90, true),
('Pizza Margherita (M)', 'Massa fina, molho de tomate, mussarela e manjericão', 'Pizza', 32.90, true),
('Pizza Margherita (G)', 'Massa fina, molho de tomate, mussarela e manjericão', 'Pizza', 39.90, true),
('Hambúrguer Especial', 'Pão brioche, carne 180g, queijo, alface, tomate', 'Hambúrguer', 28.50, true),
('Batata Frita (P)', 'Batatas fritas crocantes', 'Acompanhamento', 12.90, true),
('Batata Frita (G)', 'Batatas fritas crocantes', 'Acompanhamento', 18.90, true),
('Coca-Cola Lata', 'Refrigerante 350ml', 'Bebida', 5.50, true),
('Coca-Cola 2L', 'Refrigerante 2 litros', 'Bebida', 12.90, true),
('Açaí 300ml', 'Açaí natural', 'Açaí', 15.90, true),
('Açaí 500ml', 'Açaí natural', 'Açaí', 22.90, true),
('Salada Caesar', 'Alface romana, croutons, parmesão, molho caesar', 'Salada', 24.90, true),
('Suco Natural de Laranja', 'Suco natural 300ml', 'Bebida', 8.90, true);

-- Clientes de exemplo
INSERT INTO customers (phone, name, address, neighborhood, city, state) VALUES
('+5511999999999', 'João Silva', 'Rua das Flores, 123', 'Centro', 'São Paulo', 'SP'),
('+5511888888888', 'Maria Santos', 'Av. Paulista, 1000', 'Bela Vista', 'São Paulo', 'SP'),
('+5511777777777', 'Carlos Oliveira', 'Rua Augusta, 500', 'Consolação', 'São Paulo', 'SP'),
('+5511666666666', 'Ana Costa', 'Rua Consolação, 250', 'Centro', 'São Paulo', 'SP');

-- ================================
-- 11. VIEWS ÚTEIS
-- ================================

-- View para pedidos com detalhes completos
CREATE OR REPLACE VIEW orders_detailed AS
SELECT 
    o.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.address as customer_address,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', oi.id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price,
                'customizations', oi.customizations,
                'special_instructions', oi.special_instructions
            )
        ) FILTER (WHERE oi.id IS NOT NULL), 
        '[]'::json
    ) as items
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.name, c.phone, c.address;

-- View para estatísticas de pedidos
CREATE OR REPLACE VIEW order_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_orders,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================

COMMENT ON TABLE customers IS 'Clientes do sistema com informações de contato e entrega';
COMMENT ON TABLE products IS 'Cardápio de produtos disponíveis';
COMMENT ON TABLE orders IS 'Pedidos do sistema com status e informações de pagamento/entrega';
COMMENT ON TABLE order_items IS 'Itens individuais de cada pedido';
COMMENT ON TABLE conversations IS 'Histórico de conversas para contexto da IA';
COMMENT ON TABLE order_changes IS 'Log de todas as mudanças nos pedidos para auditoria';

COMMENT ON COLUMN orders.ai_context IS 'Contexto da conversa com IA para melhor compreensão';
COMMENT ON COLUMN conversations.ai_analysis IS 'Resultado da análise da IA sobre a mensagem';
COMMENT ON COLUMN conversations.ai_confidence IS 'Nível de confiança da IA na análise (0-1)';
