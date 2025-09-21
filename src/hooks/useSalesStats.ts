import { useState, useEffect, useCallback } from 'react';
import { ChartPeriod, SalesStats } from '../types/analytics';
import { SalesService } from '../services/salesService';

export function useSalesStats(period: ChartPeriod = 'day') {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 [SALES STATS] Buscando dados via Supabase direto para período:', period);
      
      // Usar o novo serviço que conecta diretamente com Supabase
      const data = await SalesService.getSalesStats(period);
      
      console.log('✅ [SALES STATS] Dados recebidos do Supabase:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ [SALES STATS] Erro ao buscar estatísticas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas de vendas');
      
      // Em caso de erro, tentar fallback via API backend
      try {
        console.log('🔄 [SALES STATS] Tentando fallback via backend...');
        const timestamp = Date.now();
        const url = `http://localhost:3002/sales/stats?period=${period}&t=${timestamp}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
        });

        if (response.ok) {
          const backendData = await response.json();
          console.log('✅ [SALES STATS] Fallback backend funcionou:', backendData);
          setStats(backendData);
          setError(null);
        } else {
          throw new Error(`Backend HTTP error! status: ${response.status}`);
        }
      } catch (backendErr) {
        console.error('❌ [SALES STATS] Fallback backend também falhou:', backendErr);
        setStats(null);
      }
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
