import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, OrderStats, isOrderComplete } from '../types/orders';
import { supabase } from '@/config/supabase';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  stats: OrderStats;
  refreshData: () => void;
  updateOrder: (orderId: number, orderData: Partial<Order>) => Promise<Order>;
  updatePrintStatus: (orderId: number, impresso: boolean) => Promise<Order>;
}

// Configurar API URL
// PADRONIZAÇÃO DE PORTA - SEMPRE 3001
const API_URL = 'https://api.jyze.space';

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    lastUpdated: new Date().toISOString()
  });

  // Ref para controlar o refresh automático em background
  const backgroundRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Mapear campos do banco para o frontend (resolver problema dos acentos)
  const mapOrderFields = (backendOrder: any): Order => {
    return {
      id: backendOrder.id,
      nome_cliente: backendOrder.nome_cliente,
      endereço: backendOrder.endereço || backendOrder.endereco || '', // MANTER endereço com acento
      endereco: backendOrder.endereço || backendOrder.endereco || '', // Fallback sem acento
      pedido: backendOrder.pedido,
      observações: backendOrder.observações || backendOrder.observacoes || '', // MANTER observações com acento
      observacoes: backendOrder.observações || backendOrder.observacoes || '', // Fallback sem acento
      valor: backendOrder.valor,
      tipo_pagamento: backendOrder.tipo_pagamento,
      created_at: backendOrder.created_at,
      impresso: backendOrder.impresso
    };
  };

  // Buscar pedidos via API (MOSTRAR APENAS PEDIDOS COMPLETOS na interface)
  const fetchOrdersFromAPI = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const backendOrders = data.data || [];
        
        // 🔄 MAPEAR CAMPOS DO BACKEND PARA O FRONTEND
        const mappedOrders = backendOrders.map(mapOrderFields);
        
        // ✅ FILTRAR APENAS PEDIDOS COMPLETOS PARA A INTERFACE
        const completeOrders = mappedOrders.filter(isOrderComplete);
        
        // 🎯 INTERFACE SÓ MOSTRA PEDIDOS COMPLETOS
        setOrders(completeOrders);
      } else {
        setError(data.message || 'Erro ao buscar pedidos');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar pedidos via API:', err);
      setError('Erro de conexão com a API');
    }
  }, []);

  // Buscar estatísticas via API
  const fetchStatsFromAPI = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/orders/stats`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas via API:', err);
    }
  }, []);

  // Buscar dados iniciais com logs detalhados
  const fetchInitialData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      console.log('🔄 [Data] Carregamento inicial dos dados...');
      setLoading(true);
    }
    setError(null);

    try {
      console.log('📡 [Data] Buscando pedidos e estatísticas...');
      
      const startTime = Date.now();
      await Promise.all([
        fetchOrdersFromAPI(),
        fetchStatsFromAPI()
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [Data] Dados carregados com sucesso em ${duration}ms`);
      
    } catch (err) {
      console.error('❌ [Data] Erro ao buscar dados iniciais:', err);
      setError('Erro ao carregar dados - verifique a conexão');
    } finally {
      if (isInitial) {
        setLoading(false);
        console.log('🏁 [Data] Carregamento inicial finalizado');
      }
    }
  }, [fetchOrdersFromAPI, fetchStatsFromAPI]);

  // Refresh manual
  const refreshOrders = useCallback(async () => {
    await fetchInitialData(true);
  }, [fetchInitialData]);

  // Configurar subscription em tempo real do Supabase com retry logic robusto
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    let ordersSubscription: any = null;
    let interval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;

    // Buscar dados iniciais
    fetchInitialData(true);

    const connectRealtime = () => {
      console.log(`🔄 [WebSocket] Tentativa de conexão ${retryCount + 1}/${maxRetries}`);
      
      // Limpar subscription anterior se existir
      if (ordersSubscription) {
        ordersSubscription.unsubscribe();
      }

      ordersSubscription = supabase
        .channel(`pedidos-realtime-${Date.now()}`) // Canal único para evitar conflitos
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos'
          },
          (payload) => {
            // Atualizar dados sem loading
            fetchInitialData(false);
            // Reset retry count em caso de sucesso
            retryCount = 0;
          }
        )
        .on('system', {}, (payload) => {
          if (payload.status === 'SUBSCRIBED') {
            retryCount = 0; // Reset counter on successful connection
          } else if (payload.status === 'CHANNEL_ERROR' || payload.status === 'CLOSED') {
            if (retryCount === 0) {
              console.warn('⚠️ [WebSocket] Conexão perdida, tentando reconectar...');
            }
            attemptReconnect();
          }
        })
        .subscribe((status, err) => {
          if (err) {
            if (retryCount === 0) {
              console.warn('⚠️ [WebSocket] Erro na conexão, tentando reconectar...');
            }
            attemptReconnect();
          } else if (status === 'SUBSCRIBED') {
            if (retryCount > 0) {
              console.log('✅ [WebSocket] Reconectado com sucesso');
            }
            retryCount = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            if (retryCount === 0) {
              console.warn('⚠️ [WebSocket] Canal fechado, tentando reconectar...');
            }
            attemptReconnect();
          }
        });
    };

    const attemptReconnect = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 60000); // Exponential backoff, max 60s
        
        if (retryCount <= 3) {
          console.log(`⏳ [WebSocket] Tentando reconectar em ${delay/1000}s (tentativa ${retryCount}/${maxRetries})`);
        }
        
        reconnectTimeout = setTimeout(() => {
          // Limpar canal anterior antes de tentar reconectar
          if (realtimeChannel) {
            realtimeChannel.unsubscribe();
          }
          connectRealtime();
        }, delay);
      } else {
        console.warn('🚨 [WebSocket] Máximo de tentativas atingido. Usando apenas polling.');
        console.log('📡 [Fallback] Continuando com polling a cada 5 segundos...');
      }
    };

    // Conectar inicialmente
    connectRealtime();

    // Polling como fallback (intervalo maior para não sobrecarregar)
    interval = setInterval(() => {
      fetchInitialData(false);
    }, 5000); // 5 segundos - mais conservador

    // Cleanup
    return () => {
      console.log('🧹 [Cleanup] Limpando conexões...');
      if (ordersSubscription) {
        ordersSubscription.unsubscribe();
      }
      if (interval) {
        clearInterval(interval);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [fetchInitialData]);

  // Sistema de refresh automático em background para impressão automática
  useEffect(() => {
    console.log('🔄 BACKGROUND: Iniciando refresh automático a cada 5 segundos');
    
    // Função de refresh silencioso (não mostra loading)
    const backgroundRefresh = async () => {
      try {
        console.log('📡 BACKGROUND: Fazendo refresh silencioso...');
        await fetchInitialData(false); // false = não mostrar loading
      } catch (error) {
        console.error('❌ BACKGROUND: Erro no refresh automático:', error);
      }
    };

    // Iniciar refresh automático
    backgroundRefreshRef.current = setInterval(backgroundRefresh, 5000); // A cada 5 segundos

    // Cleanup
    return () => {
      if (backgroundRefreshRef.current) {
        console.log('🛑 BACKGROUND: Parando refresh automático');
        clearInterval(backgroundRefreshRef.current);
        backgroundRefreshRef.current = null;
      }
    };
  }, []); // Executar apenas uma vez na inicialização

  const refreshData = () => {
    fetchInitialData(true);
  };

  return {
    orders,
    loading,
    error,
    stats,
    refreshData,
    updateOrder: async (orderId: number, orderData: Partial<Order>) => {
      try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar pedido');
        }

        const updatedOrder = await response.json();
        
        // Atualizar dados após mudança
        fetchInitialData(false);
        
        return updatedOrder;
      } catch (error) {
        console.error('❌ Erro ao atualizar pedido:', error);
        throw error;
      }
    },
    updatePrintStatus: async (orderId: number, impresso: boolean) => {
      try {
        console.log(`🔄 Atualizando status de impressão: Pedido #${orderId} -> impresso: ${impresso}`);
        const response = await fetch(`${API_URL}/orders/${orderId}/print-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ impresso }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar status de impressão');
        }

        const updatedOrder = await response.json();
        
        // Atualizar dados após mudança
        fetchInitialData(false);
        
        return updatedOrder;
      } catch (error) {
        console.error('❌ Erro ao atualizar status de impressão:', error);
        throw error;
      }
    }
  };
};
