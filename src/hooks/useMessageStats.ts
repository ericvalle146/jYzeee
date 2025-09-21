import { useState, useEffect, useCallback } from 'react';
import { ChartPeriod, MessageStats } from '../types/analytics';
import { MessagesService } from '../services/messagesService';

export function useMessageStats(period: ChartPeriod = 'day') {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 [MESSAGE STATS] Buscando dados via Supabase direto para período:', period);
      
      // Usar o novo serviço que conecta diretamente com Supabase
      const data = await MessagesService.getMessageStats(period);
      
      console.log('✅ [MESSAGE STATS] Dados recebidos do Supabase:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ [MESSAGE STATS] Erro ao buscar estatísticas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas de mensagens');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, isLoading]);

  const refresh = () => {
    fetchStats();
  };

  return { stats, isLoading, error, refresh };
}