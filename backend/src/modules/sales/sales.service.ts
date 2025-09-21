import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { SalesStats, ChartPeriod, SalesChartDataPoint } from '../../types/supabase.types';
import { SupabaseClient } from '@supabase/supabase-js';

interface PedidoValorRow {
  valor: string | number;
  created_at?: string;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getSalesStats(period: ChartPeriod = 'day'): Promise<SalesStats> {
    try {
      this.logger.log(`🔍 NOVO CONTROLLER - Buscando estatísticas de vendas para período: ${period}`);
      
      if (!this.supabaseService.isConnected()) {
        this.logger.warn('⚠️ Supabase não conectado - usando dados mock');
        return this.getMockSalesStats(period);
      }

      const supabase = this.supabaseService.getClient();
      const now = new Date();
      
      // Buscar todos os dados em paralelo com timezone brasileiro (UTC-3)
      const [
        totalRevenue, 
        todayRevenue, 
        weekRevenue, 
        monthRevenue, 
        totalOrders,
        todayOrders,
        chartData
      ] = await Promise.all([
        this.getTotalRevenue(supabase),
        this.getTodayRevenue(supabase),
        this.getWeekRevenue(supabase),
        this.getMonthRevenue(supabase),
        this.getTotalOrders(supabase),
        this.getTodayOrders(supabase),
        this.getSalesChartData(supabase, period)
      ]);

      const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      this.logger.log(`✅ Dados carregados: Total R$ ${totalRevenue.toFixed(2)}, ${totalOrders} pedidos`);

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
        _source: 'NEW_SUPABASE_CONTROLLER' // Identificador único
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar estatísticas de vendas:', error);
      return this.getMockSalesStats(period);
    }
  }

  private async getTotalRevenue(supabase: SupabaseClient): Promise<number> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .not('valor', 'is', null);
    
    if (error) throw error;
    
    return data?.reduce((total: number, item: PedidoValorRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private async getTodayRevenue(supabase: SupabaseClient): Promise<number> {
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
    
    return data?.reduce((total: number, item: PedidoValorRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private async getTodayOrders(supabase: SupabaseClient): Promise<number> {
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

  private getBrazilianDate(): string {
    // Criar data no timezone brasileiro (UTC-3)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
    return brazilTime.toISOString().split('T')[0];
  }

  private async getWeekRevenue(supabase: SupabaseClient): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .gte('created_at', weekAgo.toISOString())
      .not('valor', 'is', null);
    
    if (error) throw error;
    
    return data?.reduce((total: number, item: PedidoValorRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private async getMonthRevenue(supabase: SupabaseClient): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('valor')
      .gte('created_at', monthAgo.toISOString())
      .not('valor', 'is', null);
    
    if (error) throw error;
    
    return data?.reduce((total: number, item: PedidoValorRow) => {
      const value = parseFloat(String(item.valor)) || 0;
      return total + value;
    }, 0) || 0;
  }

  private async getTotalOrders(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  private async getSalesChartData(supabase: SupabaseClient, period: ChartPeriod): Promise<SalesChartDataPoint[]> {
    this.logger.log(`📊 Gerando dados do gráfico para período: ${period}`);
    
    const now = new Date();
    let intervals: SalesChartDataPoint[] = [];
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

      case 'week':
        // Últimas 12 semanas
        intervals = Array.from({ length: 12 }, (_, i) => {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * (11 - i)));
          return {
            name: `Sem ${12 - i}`,
            value: 0,
            isCurrentPeriod: i === 11
          };
        });
        queryStartDate = new Date(now);
        queryStartDate.setDate(queryStartDate.getDate() - (12 * 7));
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

      case 'year':
        // Últimos 5 anos
        intervals = Array.from({ length: 5 }, (_, i) => {
          const year = now.getFullYear() - (4 - i);
          return {
            name: year.toString(),
            value: 0,
            isCurrentPeriod: i === 4
          };
        });
        queryStartDate = new Date(now.getFullYear() - 5, 0, 1);
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
      this.logger.error('❌ Erro ao buscar dados do gráfico:', error);
      return intervals;
    }

    if (!data || data.length === 0) {
      this.logger.warn('⚠️ Nenhum dado encontrado para o período');
      return intervals;
    }

    // Agrupar dados conforme o período
    const salesMap = new Map<string, number>();
    
    data.forEach((row: PedidoValorRow) => {
      const date = new Date(row.created_at!);
      const value = parseFloat(String(row.valor)) || 0;
      let key: string;

      switch (period) {
        case 'day':
          key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          break;
        case 'week':
          // Calcular qual semana do ano
          const weekNumber = this.getWeekNumber(date);
          key = `Sem ${weekNumber}`;
          break;
        case 'month':
          key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          break;
        case 'year':
          key = date.getFullYear().toString();
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

    this.logger.log(`✅ Gráfico gerado com ${intervals.length} pontos de dados`);
    return intervals;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getMockSalesStats(period: ChartPeriod): SalesStats {
    const now = new Date();
    const mockChart: SalesChartDataPoint[] = [];
    
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
      lastUpdated: now.toISOString()
    };
  }
}
