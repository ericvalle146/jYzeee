import { useState, useEffect, useCallback } from 'react';
import { ChartPeriod, CustomerStats } from '../types/analytics';
import { CustomersService } from '../services/customersService';

export function useCustomerStats(period: ChartPeriod = 'day') {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 [CUSTOMER STATS] Buscando dados via Supabase direto para período:', period);
      
      // Usar o novo serviço que conecta diretamente com Supabase
      const data = await CustomersService.getCustomerStats(period);
      
      console.log('✅ [CUSTOMER STATS] Dados recebidos do Supabase:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ [CUSTOMER STATS] Erro ao buscar estatísticas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas de clientes');
      
      // Em caso de erro, tentar fallback via API backend (se existir)
      try {
        console.log('🔄 [CUSTOMER STATS] Tentando fallback via backend...');
        const timestamp = Date.now();
        const url = `https://api.jyze.space/api/customers/stats?period=${period}&t=${timestamp}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
        });

        if (response.ok) {
          const backendData = await response.json();
          console.log('✅ [CUSTOMER STATS] Fallback backend funcionou:', backendData);
          setStats(backendData);
          setError(null);
        } else {
          throw new Error(`Backend HTTP error! status: ${response.status}`);
        }
      } catch (backendErr) {
        console.error('❌ [CUSTOMER STATS] Fallback backend também falhou:', backendErr);
        setStats(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = () => {
    fetchStats();
  };

  return { stats, isLoading, error, refresh };
}
