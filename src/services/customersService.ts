/**
 * SERVIÇO DE ANÁLISE DE CLIENTES
 * 
 * Conecta diretamente com o Supabase para buscar dados de clientes
 * Mostra número real de clientes baseado na contagem de registros da tabela pedidos
 * Usa configuração do .env para máxima compatibilidade
 */

import { supabase, SUPABASE_CONFIG } from '@/config/supabase';
import { ChartPeriod, CustomerStats } from '@/types/analytics';

interface PedidoRow {
  valor: string | number;
  created_at: string;
}

export class CustomersService {
  
  /**
   * Busca estatísticas de clientes diretamente do Supabase
   * OBJETIVO: Mostrar número real de clientes baseado na contagem total de registros da tabela pedidos
   */
  static async getCustomerStats(period: ChartPeriod = 'week'): Promise<CustomerStats> {
    try {
      console.log('🔍 [CustomersService] Buscando estatísticas de clientes para período:', period);
      console.log('🔧 [CustomersService] Config Supabase:', {
        url: SUPABASE_CONFIG.url,
        keyConfigured: !!SUPABASE_CONFIG.anonKey,
        isConfigured: SUPABASE_CONFIG.isConfigured
      });
      
      if (!SUPABASE_CONFIG.isConfigured) {
        console.warn('⚠️ [CustomersService] Supabase não configurado - usando dados mock');
        return this.getMockCustomerStats(period);
      }

      const now = new Date();
      
      // Testar conexão primeiro
      console.log('🧪 [CustomersService] Testando conexão com tabela pedidos...');
      const testQuery = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true });
      
      if (testQuery.error) {
        console.error('❌ [CustomersService] Erro no teste de conexão:', testQuery.error);
        console.log('🔄 [CustomersService] Tentando fallback via Backend API...');
        return await this.getCustomerStatsFromBackend(period);
      }
      
      console.log('✅ [CustomersService] Conexão OK, total de registros:', testQuery.count);
      console.log('✅ [CustomersService] Usando contagem de registros como número de clientes...');
      
      // MODIFICAÇÃO PRINCIPAL: Usar contagem total de registros como número de clientes
      // Seguindo exatamente o padrão do SalesService
      const [
        totalCustomers, // Contagem total de registros = número de clientes
        todayCustomers,
        weekCustomers, 
        monthCustomers,
        totalRevenue,
        chartData
      ] = await Promise.all([
        this.getTotalCustomers(), // Contagem total de registros
        this.getTodayCustomers(), // Registros de hoje
        this.getWeekCustomers(),  // Registros da semana
        this.getMonthCustomers(), // Registros do mês
        this.getTotalRevenue(),   // Receita total (para compatibilidade)
        this.getCustomerChartData(period)
      ]);

      const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      console.log('✅ [CustomersService] Dados carregados:', { 
        totalCustomers: totalCustomers,
        todayCustomers: todayCustomers, 
        totalRevenue: totalRevenue,
        chartPoints: chartData.length 
      });

      return {
        totalCustomers,
        newCustomers: todayCustomers,
        activeCustomers: weekCustomers,
        totalOrders: totalCustomers, // Mesmo valor - cada registro = 1 cliente
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        printedOrders: 0,
        pendingOrders: monthCustomers, // Pedidos do último mês
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        growth: 0,
        chart: chartData,
        period,
        lastUpdated: now.toISOString(),
        _source: 'FRONTEND_SUPABASE_DIRECT'
      };
    } catch (error) {
      console.error('❌ [CustomersService] Erro ao buscar estatísticas:', error);
      console.error('❌ [CustomersService] Detalhes do erro:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      
      // Tentar fallback via Backend antes de falhar
      console.log('🔄 [CustomersService] Erro no Supabase direto, tentando Backend API...');
      try {
        return await this.getCustomerStatsFromBackend(period);
      } catch (backendError) {
        console.error('❌ [CustomersService] Backend também falhou:', backendError);
        console.warn('⚠️ [CustomersService] Retornando dados mock como último recurso');
        return this.getMockCustomerStats(period);
      }
    }
  }

  /**
   * MODIFICAÇÃO PRINCIPAL: Contar registros totais da tabela pedidos
   * Seguindo exatamente o padrão do SalesService.getTotalOrders()
   */
  private static async getTotalCustomers(): Promise<number> {
    console.log('👥 [CustomersService] Buscando total de registros na tabela pedidos...');
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ [CustomersService] Erro ao buscar total de registros:', error);
      throw error;
    }
    
    console.log('✅ [CustomersService] Total de registros (clientes):', count);
    return count || 0;
  }

  private static async getTodayCustomers(): Promise<number> {
    const today = this.getBrazilianDate();
    const todayStart = `${today}T00:00:00-03:00`;
    const todayEnd = `${today}T23:59:59-03:00`;
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);
    
    if (error) throw error;
    
    console.log('✅ [CustomersService] Registros (clientes) hoje:', count);
    return count || 0;
  }

  private static async getWeekCustomers(): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());
    
    if (error) throw error;
    
    console.log('✅ [CustomersService] Registros (clientes) últimos 7 dias:', count);
    return count || 0;
  }

  private static async getMonthCustomers(): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());
    
    if (error) throw error;
    
    console.log('✅ [CustomersService] Registros (clientes) último mês:', count);
    return count || 0;
  }

  private static async getTotalRevenue(): Promise<number> {
    console.log('💰 [CustomersService] Buscando receita total...');
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .not('valor', 'is', null);
    
    if (error) {
      console.error('❌ [CustomersService] Erro ao buscar receita total:', error);
      throw error;
    }
    
    const total = data?.reduce((total: number, item: PedidoRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
    
    console.log('✅ [CustomersService] Receita total:', total, `(${data?.length} pedidos)`);
    return total;
  }

  private static getBrazilianDate(): string {
    // Criar data no timezone brasileiro (UTC-3)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
    return brazilTime.toISOString().split('T')[0];
  }

  private static async getCustomerChartData(period: ChartPeriod): Promise<any[]> {
    console.log('📊 [CustomersService] Gerando dados do gráfico para período:', period);
    
    const now = new Date();
    let intervals: any[] = [];
    let queryStartDate: Date;

    switch (period) {
      case 'day':
        // Últimos 30 dias - seguindo padrão do SalesService
        intervals = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (29 - i));
          return {
            name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            customers: 0,
            revenue: 0,
            orders: 0,
            isCurrentPeriod: i === 29
          };
        });
        queryStartDate = new Date(now);
        queryStartDate.setDate(queryStartDate.getDate() - 30);
        break;

      case 'month':
        // Últimos 12 meses - seguindo padrão do SalesService
        intervals = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return {
            name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            date: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            customers: 0,
            revenue: 0,
            orders: 0,
            isCurrentPeriod: i === 11
          };
        });
        queryStartDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;

      default:
        return [];
    }

    // Buscar dados do Supabase
    const { data, error } = await supabase
      .from('pedidos')
      .select('created_at, valor')
      .gte('created_at', queryStartDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [CustomersService] Erro ao buscar dados do gráfico:', error);
      return intervals;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [CustomersService] Nenhum dado encontrado para o período');
      return intervals;
    }

    // Agrupar dados conforme o período - CADA REGISTRO = 1 CLIENTE
    // Seguindo exatamente o padrão do SalesService
    const dataMap = new Map<string, number>();
    
    data.forEach((row: PedidoRow) => {
      const date = new Date(row.created_at);
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

      // CADA REGISTRO = 1 CLIENTE (seguindo especificação)
      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    // Aplicar dados aos intervalos - seguindo padrão do SalesService
    intervals.forEach(interval => {
      interval.customers = dataMap.get(interval.name) || 0;
    });

    console.log('✅ [CustomersService] Gráfico gerado com', intervals.length, 'pontos de dados');
    return intervals;
  }

  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private static async getCustomerStatsFromBackend(period: 'day' | 'week' | 'month' = 'day') {
    console.log(`🔄 [CustomersService] Buscando dados via Backend API para período: ${period}`);
    
    try {
      const response = await fetch(`http://localhost:3002/api/customers/stats?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Backend API retornou erro: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [CustomersService] Dados obtidos via Backend API:', data);
      
      return {
        ...data,
        _source: 'BACKEND_API'
      };
    } catch (error) {
      console.error('❌ [CustomersService] Erro ao acessar Backend API:', error);
      throw error;
    }
  }

  private static getMockCustomerStats(period: ChartPeriod): CustomerStats {
    const now = new Date();
    
    console.log('⚠️ [CustomersService] Usando dados mock - Supabase não configurado');
    
    return {
      totalCustomers: 150, // Número fictício de registros
      newCustomers: 12,
      activeCustomers: 89,
      totalOrders: 150, // Mesmo valor que totalCustomers
      totalRevenue: 15750.50,
      printedOrders: 0,
      pendingOrders: 150, // Mesmo valor que totalCustomers
      averageOrderValue: 105.00,
      growth: 0,
      chart: [],
      period,
      lastUpdated: now.toISOString(),
      _source: 'MOCK_DATA'
    };
  }
}
