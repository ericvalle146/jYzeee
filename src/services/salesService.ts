/**
 * SERVIÇO DE ANÁLISE DE VENDAS
 * 
 * Conecta diretamente com o Supabase para buscar dados de vendas
 * Usa configuração do .env para máxima compatibilidade
 */

import { supabase, SUPABASE_CONFIG } from '@/config/supabase';
import { ChartPeriod, SalesStats, ChartDataPoint } from '@/types/analytics';

interface PedidoRow {
  valor: string | number;
  created_at: string;
}

export class SalesService {
  
  /**
   * Busca estatísticas de vendas diretamente do Supabase
   */
  static async getSalesStats(period: ChartPeriod = 'day'): Promise<SalesStats> {
    try {
      console.log('🔍 [SalesService] Buscando estatísticas de vendas para período:', period);
      console.log('🔧 [SalesService] Config Supabase:', {
        url: SUPABASE_CONFIG.url,
        keyConfigured: !!SUPABASE_CONFIG.anonKey,
        isConfigured: SUPABASE_CONFIG.isConfigured
      });
      
      if (!SUPABASE_CONFIG.isConfigured) {
        console.warn('⚠️ [SalesService] Supabase não configurado - usando dados mock');
        return this.getMockSalesStats(period);
      }

      const now = new Date();
      
      // Testar conexão primeiro
      console.log('🧪 [SalesService] Testando conexão com tabela pedidos...');
      const testQuery = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true });
      
      if (testQuery.error) {
        console.error('❌ [SalesService] Erro no teste de conexão:', testQuery.error);
        console.log('🔄 [SalesService] Tentando fallback via Backend API...');
        return await this.getSalesStatsFromBackend(period);
      }
      
      console.log('✅ [SalesService] Conexão OK, total de registros:', testQuery.count);
      console.log('✅ [SalesService] Buscando dados detalhados...');
      
      // Buscar todos os dados em paralelo
      const [
        totalRevenue, 
        todayRevenue, 
        weekRevenue, 
        monthRevenue, 
        totalOrders,
        todayOrders,
        chartData
      ] = await Promise.all([
        this.getTotalRevenue(),
        this.getTodayRevenue(),
        this.getWeekRevenue(),
        this.getMonthRevenue(),
        this.getTotalOrders(),
        this.getTodayOrders(),
        this.getSalesChartData(period)
      ]);

      const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      console.log('✅ [SalesService] Dados carregados:', { 
        totalRevenue, 
        totalOrders, 
        todayRevenue, 
        todayOrders,
        chartPoints: chartData.length 
      });

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        thisWeekRevenue: Math.round(weekRevenue * 100) / 100,
        thisMonthRevenue: Math.round(monthRevenue * 100) / 100,
        totalOrders,
        todayOrders,
        avgTicket: Math.round(avgTicket * 100) / 100,
        chart: chartData,
        period,
        lastUpdated: now.toISOString(),
        _source: 'FRONTEND_SUPABASE_DIRECT' // Identificador único
      };
    } catch (error) {
      console.error('❌ [SalesService] Erro ao buscar estatísticas:', error);
      console.error('❌ [SalesService] Detalhes do erro:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      
      // Tentar fallback via Backend antes de falhar
      console.log('🔄 [SalesService] Erro no Supabase direto, tentando Backend API...');
      try {
        return await this.getSalesStatsFromBackend(period);
      } catch (backendError) {
        console.error('❌ [SalesService] Backend também falhou:', backendError);
        console.warn('⚠️ [SalesService] Retornando dados mock como último recurso');
        return this.getMockSalesStats(period);
      }
    }
  }

  private static async getTotalRevenue(): Promise<number> {
    console.log('📊 [SalesService] Buscando receita total...');
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .not('valor', 'is', null);
    
    if (error) {
      console.error('❌ [SalesService] Erro ao buscar receita total:', error);
      throw error;
    }
    
    const total = data?.reduce((total: number, item: PedidoRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
    
    console.log('✅ [SalesService] Receita total:', total, `(${data?.length} pedidos)`);
    return total;
  }

  private static async getTodayRevenue(): Promise<number> {
    const today = this.getBrazilianDate();
    const todayStart = `${today}T00:00:00-03:00`;
    const todayEnd = `${today}T23:59:59-03:00`;
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
      .not('valor', 'is', null);
    
    if (error) throw error;
    
    return data?.reduce((total: number, item: PedidoRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private static async getTodayOrders(): Promise<number> {
    const today = this.getBrazilianDate();
    const todayStart = `${today}T00:00:00-03:00`;
    const todayEnd = `${today}T23:59:59-03:00`;
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);
    
    if (error) throw error;
    return count || 0;
  }

  private static getBrazilianDate(): string {
    // Criar data no timezone brasileiro (UTC-3)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
    return brazilTime.toISOString().split('T')[0];
  }

  private static async getWeekRevenue(): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .gte('created_at', weekAgo.toISOString())
      .not('valor', 'is', null);
    
    if (error) throw error;
    
    return data?.reduce((total: number, item: PedidoRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private static async getMonthRevenue(): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .gte('created_at', monthAgo.toISOString())
      .not('valor', 'is', null);
    
    if (error) throw error;
    
    return data?.reduce((total: number, item: PedidoRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private static async getTotalOrders(): Promise<number> {
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  private static async getSalesChartData(period: ChartPeriod): Promise<ChartDataPoint[]> {
    console.log('📊 [SalesService] Gerando dados do gráfico para período:', period);
    
    const now = new Date();
    let intervals: ChartDataPoint[] = [];
    let queryStartDate: Date;

    switch (period) {
      case 'day':
        // Últimos 30 dias
        intervals = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (29 - i));
          return {
            name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: 0,
            isCurrentPeriod: i === 29
          };
        });
        queryStartDate = new Date(now);
        queryStartDate.setDate(queryStartDate.getDate() - 30);
        break;

      case 'month':
        // Últimos 12 meses
        intervals = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return {
            name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            value: 0,
            isCurrentPeriod: i === 11
          };
        });
        queryStartDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;

      default:
        throw new Error(`Período não suportado: ${period}`);
    }

    // Buscar dados do Supabase
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor, created_at')
      .gte('created_at', queryStartDate.toISOString())
      .not('valor', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [SalesService] Erro ao buscar dados do gráfico:', error);
      return intervals;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [SalesService] Nenhum dado encontrado para o período');
      return intervals;
    }

    // Agrupar dados conforme o período
    const salesMap = new Map<string, number>();
    
    data.forEach((row: PedidoRow) => {
      const date = new Date(row.created_at);
      const value = parseFloat(String(row.valor)) || 0;
      let key: string;

      switch (period) {
        case 'day':
          key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          break;
        case 'month':
          key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          break;
        default:
          key = 'unknown';
      }

      salesMap.set(key, (salesMap.get(key) || 0) + value);
    });

    // Aplicar dados aos intervalos
    intervals.forEach(interval => {
      interval.value = Math.round((salesMap.get(interval.name) || 0) * 100) / 100;
    });

    console.log('✅ [SalesService] Gráfico gerado com', intervals.length, 'pontos de dados');
    return intervals;
  }

  private static async getSalesStatsFromBackend(period: 'day' | 'week' | 'month' = 'day') {
    console.log(`🔄 [SalesService] Buscando dados via Backend API para período: ${period}`);
    
    try {
      const response = await fetch(`https://api.jyze.space/sales/stats?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Backend API retornou erro: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [SalesService] Dados obtidos via Backend API:', data);
      
      return {
        ...data,
        _source: 'BACKEND_API'
      };
    } catch (error) {
      console.error('❌ [SalesService] Erro ao acessar Backend API:', error);
      throw error;
    }
  }

  private static getMockSalesStats(period: ChartPeriod): SalesStats {
    const now = new Date();
    const mockChart: ChartDataPoint[] = [];
    
    if (period === 'day') {
      // Mock para 30 dias
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        mockChart.push({
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: Math.round((Math.random() * 2000 + 500) * 100) / 100,
          isCurrentPeriod: i === 0
        });
      }
    } else {
      // Mock para 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        mockChart.push({
          name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          value: Math.round((Math.random() * 25000 + 15000) * 100) / 100,
          isCurrentPeriod: i === 0
        });
      }
    }

    return {
      totalRevenue: 485750.50,
      todayRevenue: 3250.75,
      thisWeekRevenue: 18500.25,
      thisMonthRevenue: 75300.80,
      totalOrders: 2450,
      todayOrders: 12,
      avgTicket: 198.27,
      chart: mockChart,
      period,
      lastUpdated: now.toISOString(),
      _source: 'MOCK_DATA'
    };
  }
}
