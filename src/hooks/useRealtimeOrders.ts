import { useState, useEffect, useCallback } from 'react';

// Tipos para TypeScript
interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: Record<string, unknown>;
  special_instructions?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: 'draft' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  payment_method?: string;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  confirmed_at?: string;
  estimated_delivery?: string;
  items?: OrderItem[];
  customer?: Customer;
}

interface UseRealtimeOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  stats: {
    draft: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivering: number;
    delivered: number;
    total_revenue: number;
  };
  // Ações
  addItem: (orderId: string, item: Omit<OrderItem, 'id' | 'total_price'>) => Promise<void>;
  updateItem: (orderId: string, itemId: string, updates: Partial<OrderItem>) => Promise<void>;
  removeItem: (orderId: string, itemId: string) => Promise<void>;
  confirmOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

import { supabase } from '@/config/supabase';

// PADRONIZAÇÃO DE DOMÍNIO - PRODUÇÃO
const API_URL = 'https://api.jyze.space';

export const useRealtimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // BUSCAR PEDIDOS
  // ================================
  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          customer:customers(id, name, phone, address)
        `)
        .in('status', ['draft', 'confirmed', 'preparing', 'ready', 'delivering'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (err) {
      console.error('❌ Erro ao buscar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [supabase]);

  // ================================
  // AÇÕES DE PEDIDOS
  // ================================
  const addItem = useCallback(async (orderId: string, item: Omit<OrderItem, 'id' | 'total_price'>) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (!response.ok) throw new Error('Erro ao adicionar item');

      // O Supabase atualizará automaticamente via subscription
    } catch (err) {
      console.error('❌ Erro ao adicionar item:', err);
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (orderId: string, itemId: string, updates: Partial<OrderItem>) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Erro ao atualizar item');
    } catch (err) {
      console.error('❌ Erro ao atualizar item:', err);
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (orderId: string, itemId: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao remover item');
    } catch (err) {
      console.error('❌ Erro ao remover item:', err);
      throw err;
    }
  }, []);

  const confirmOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/confirm`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Erro ao confirmar pedido');
    } catch (err) {
      console.error('❌ Erro ao confirmar pedido:', err);
      throw err;
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
      throw err;
    }
  }, []);

  // ================================
  // SETUP INICIAL E SUBSCRIPTIONS
  // ================================
  useEffect(() => {
    // Buscar pedidos iniciais
    fetchOrders(true);

    // Setup subscriptions em tempo real
    const setupSubscriptions = () => {
      // Subscription para mudanças em pedidos
      const ordersSubscription = supabase
        .channel('orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('🔄 Mudança em pedidos:', payload);
            fetchOrders(false); // Refresh sem loading
          }
        )
        .subscribe();

      // Subscription para mudanças em itens
      const itemsSubscription = supabase
        .channel('order_items')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'order_items' },
          (payload) => {
            console.log('🔄 Mudança em itens:', payload);
            fetchOrders(false); // Refresh sem loading
          }
        )
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
        itemsSubscription.unsubscribe();
      };
    };

    const cleanup = setupSubscriptions();

    // Cleanup on unmount
    return cleanup;
  }, [supabase, fetchOrders]);

  // ================================
  // ESTATÍSTICAS CALCULADAS
  // ================================
  const stats = {
    draft: orders.filter(o => o.status === 'draft').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    total_revenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  };

  return {
    orders,
    loading,
    error,
    stats,
    addItem,
    updateItem,
    removeItem,
    confirmOrder,
    updateOrderStatus,
    refreshOrders: () => fetchOrders(true)
  };
};

// ================================
// HOOK PARA ANÁLISE DE MENSAGENS
// ================================
interface UseAIAnalysisReturn {
  analyzeMessage: (customerPhone: string, message: string) => Promise<{
    intent: string;
    confidence: number;
    response: string;
    action_result?: unknown;
    current_order?: Order;
  }>;
  loading: boolean;
}

export const useAIAnalysis = (): UseAIAnalysisReturn => {
  const [loading, setLoading] = useState(false);

  const analyzeMessage = useCallback(async (customerPhone: string, message: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/analyze-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: customerPhone,
          message
        })
      });

      if (!response.ok) throw new Error('Erro na análise da mensagem');

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Erro na análise da IA:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzeMessage,
    loading
  };
};
