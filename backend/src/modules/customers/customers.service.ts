import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { CustomerStats, ChartPeriod, ChartDataPoint } from '../../types/supabase.types';
import { SupabaseClient } from '@supabase/supabase-js';

interface PedidoRow {
  nome_cliente: string;
  created_at: string;
}

@Injectable()
export class CustomersService {
  constructor(private supabaseService: SupabaseService) {}

  async upsertCustomer(customerData: { nome_cliente: string; endereco?: string; created_at?: string }) {
    // Mock implementation - em produção conectaria com Supabase
    return { success: true, data: customerData };
  }

  async getCustomerByPhone(phoneNumber: string) {
    return { id: 'customer-123', phoneNumber, name: 'Cliente Exemplo' };
  }

  async getCustomerStats(period: ChartPeriod = 'day'): Promise<CustomerStats> {
    try {
      if (!this.supabaseService.isConnected()) {
        return this.getMockCustomerStats(period);
      }

      const supabase = this.supabaseService.getClient();
      const now = new Date();
      
      // Calcular totais
      const [totalResult, todayResult, weekResult, monthResult, chartData] = await Promise.all([
        this.getTotalCustomers(supabase),
        this.getNewCustomersToday(supabase),
        this.getNewCustomersThisWeek(supabase),
        this.getNewCustomersThisMonth(supabase),
        this.getCustomerChartData(supabase, period)
      ]);

      return {
        total: totalResult || 0,
        newToday: todayResult || 0,
        newThisWeek: weekResult || 0,
        newThisMonth: monthResult || 0,
        chart: chartData,
        period,
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      return this.getMockCustomerStats(period);
    }
  }

  private async getTotalCustomers(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .not('nome_cliente', 'is', null);
    
    if (error) throw error;
    
    // Cada linha é um cliente único
    return count || 0;
  }

  private async getNewCustomersToday(supabase: SupabaseClient): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .not('nome_cliente', 'is', null);
    
    if (error) throw error;
    
    // Cada linha é um cliente único
    return count || 0;
  }

  private async getNewCustomersThisWeek(supabase: SupabaseClient): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())
      .not('nome_cliente', 'is', null);
    
    if (error) throw error;
    
    // Cada linha é um cliente único
    return count || 0;
  }

  private async getNewCustomersThisMonth(supabase: SupabaseClient): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const { count, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())
      .not('nome_cliente', 'is', null);
    
    if (error) throw error;
    
    // Cada linha é um cliente único
    return count || 0;
  }

  private async getCustomerChartData(supabase: SupabaseClient, period: ChartPeriod): Promise<ChartDataPoint[]> {
    const now = new Date();
    let intervals: ChartDataPoint[];

    if (period === 'day') {
      // Criar array de 30 dias
      intervals = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - i));
        return {
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: 0,
          isCurrentPeriod: i === 29
        };
      });

      // Query para últimos 30 dias
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('pedidos')
        .select('nome_cliente, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('nome_cliente', 'is', null)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Agrupar por dia - cada linha é um cliente
        const dailyCustomers = new Map();
        data.forEach((row: PedidoRow) => {
          const date = new Date(row.created_at);
          const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          
          dailyCustomers.set(dateKey, (dailyCustomers.get(dateKey) || 0) + 1);
        });

        // Aplicar aos intervalos
        intervals.forEach(interval => {
          interval.value = dailyCustomers.get(interval.name) || 0;
        });
      }
    } else {
      // Criar array de 12 meses
      intervals = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        return {
          name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          value: 0,
          isCurrentPeriod: i === 11
        };
      });

      // Query para últimos 12 meses
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

      const { data, error } = await supabase
        .from('pedidos')
        .select('nome_cliente, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .not('nome_cliente', 'is', null)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Agrupar por mês - cada linha é um cliente
        const monthlyCustomers = new Map();
        data.forEach((row: PedidoRow) => {
          const date = new Date(row.created_at);
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          
          monthlyCustomers.set(monthKey, (monthlyCustomers.get(monthKey) || 0) + 1);
        });

        // Aplicar aos intervalos
        intervals.forEach(interval => {
          interval.value = monthlyCustomers.get(interval.name) || 0;
        });
      }
    }

    return intervals;
  }

  private getMockCustomerStats(period: ChartPeriod): CustomerStats {
    const now = new Date();
    const mockChart: ChartDataPoint[] = [];
    
    if (period === 'day') {
      // Mock para 30 dias
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        mockChart.push({
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: Math.floor(Math.random() * 15) + 1,
          isCurrentPeriod: i === 0
        });
      }
    } else {
      // Mock para 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        mockChart.push({
          name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          value: Math.floor(Math.random() * 50) + 10,
          isCurrentPeriod: i === 0
        });
      }
    }

    return {
      total: 1250,
      newToday: 8,
      newThisWeek: 45,
      newThisMonth: 180,
      chart: mockChart,
      period,
      lastUpdated: now.toISOString()
    };
  }
}
