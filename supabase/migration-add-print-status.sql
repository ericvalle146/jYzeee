-- ================================
-- MIGRAÇÃO: ADICIONAR CAMPO DE STATUS DE IMPRESSÃO
-- Adicionando campo 'impresso' à tabela de pedidos
-- ================================

-- Adicionar campo 'impresso' à tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS impresso BOOLEAN DEFAULT FALSE;

-- Comentário para documentação
COMMENT ON COLUMN pedidos.impresso IS 'Status de impressão do pedido (true = já imprimido, false = não imprimido)';

-- Criar índice para performance de consultas de filtro
CREATE INDEX IF NOT EXISTS idx_pedidos_impresso ON pedidos(impresso);

-- ================================
-- DADOS DE MIGRAÇÃO (OPCIONAL)
-- Se você quiser marcar pedidos antigos como "não impressos"
-- ou definir uma lógica específica, descomente abaixo:
-- ================================

-- Opção 1: Marcar todos os pedidos existentes como não impressos
-- UPDATE pedidos SET impresso = FALSE WHERE impresso IS NULL;

-- Opção 2: Marcar pedidos entregues como impressos e outros como não impressos
-- UPDATE pedidos SET impresso = TRUE WHERE status = 'entregue';
-- UPDATE pedidos SET impresso = FALSE WHERE status != 'entregue';

-- ================================
-- VERIFICAÇÃO DA MIGRAÇÃO
-- ================================

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND column_name = 'impresso';

-- Verificar alguns registros
SELECT id, nome_cliente, status, impresso, created_at 
FROM pedidos 
ORDER BY created_at DESC 
LIMIT 5;
