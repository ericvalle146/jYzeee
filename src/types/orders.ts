// Tipos para o sistema de pedidos - Estrutura real da tabela Supabase 'pedidos'

// Estrutura real da tabela 'pedidos' no Supabase
export interface Order {
  id: number;
  nome_cliente: string;
  endereco?: string;
  endereço?: string; // Campo do banco
  pedido: string;
  observacoes?: string;
  observações?: string; // Campo do banco
  valor: number;
  tipo_pagamento: string;
  created_at: string;
  impresso: boolean;
}

// Validação INTELIGENTE - campos obrigatórios: nome_cliente, pedido
// Valor é opcional (pode ser null para pedidos sem preço definido)
export function isOrderComplete(order: Order): boolean {
  console.log('🔍 Validando pedido:', {
    id: order.id,
    nome_cliente: order.nome_cliente,
    pedido: order.pedido,
    valor: order.valor,
    tipo_pagamento: order.tipo_pagamento
  });

  const hasNomeCliente = order.nome_cliente && order.nome_cliente.trim() !== '';
  const hasPedido = order.pedido && order.pedido.trim() !== '';
  
  // Valor pode ser null/undefined para pedidos sem preço definido
  const hasValor = order.valor === null || order.valor === undefined || order.valor > 0;
  
  const result = hasNomeCliente && hasPedido && hasValor;
  
  console.log('✅ Resultado validação:', {
    hasNomeCliente,
    hasPedido, 
    hasValor,
    isComplete: result
  });
  
  return result;
}

// Interface para compatibilidade com código existente
export interface OrderItem {
  id: string;
  order_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  special_instructions?: string;
}

export interface Customer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface OrderStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;      // Pedidos em andamento
  deliveredOrders: number;    // Pedidos entregues
  totalRevenue: number;
  lastUpdated?: string;
}

export interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  stats: OrderStats;
  refreshOrders: () => Promise<void>;
  // Operações de escrita
  createOrder: (orderData: CreateOrderData) => Promise<Order>;
  updateOrder: (orderId: number, orderData: Partial<Order>) => Promise<Order>;
}

export interface CreateOrderData {
  nome_cliente: string;
  pedido: string;              // Descrição dos itens do pedido
  observacoes?: string;
  valor: number;
  tipo_pagamento: string;
  endereco: string;
  impresso?: boolean;          // Status de impressão (padrão: false)
}
