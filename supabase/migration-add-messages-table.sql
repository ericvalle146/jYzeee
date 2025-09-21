-- ================================
-- MIGRAÇÃO: TABELA DE ANÁLISE DE MENSAGENS
-- Criada para sistema de contagem de mensagens em tempo real
-- ================================

-- Criar tabela para análise de mensagens
CREATE TABLE IF NOT EXISTS message_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contador INTEGER NOT NULL DEFAULT 1 CHECK (contador = 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_message_analytics_created (created_at DESC)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE message_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura e escrita (todos podem acessar por enquanto)
CREATE POLICY "Permitir leitura para todos" ON message_analytics FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON message_analytics FOR ALL USING (true);

-- View para estatísticas de mensagens por período
CREATE OR REPLACE VIEW message_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_messages,
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as messages_per_hour
FROM message_analytics
GROUP BY DATE(created_at), DATE_TRUNC('hour', created_at)
ORDER BY date DESC, hour DESC;

-- Comentários para documentação
COMMENT ON TABLE message_analytics IS 'Tabela para análise de mensagens recebidas via API com timestamp automático';
COMMENT ON COLUMN message_analytics.contador IS 'Sempre 1 - usado para contagem de mensagens individuais';
COMMENT ON COLUMN message_analytics.created_at IS 'Timestamp automático da recepção da mensagem';
