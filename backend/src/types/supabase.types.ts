// Interfaces para o banco de dados Supabase

export interface Pedido {
  id: number;
  nome_cliente: string;
  pedido: string;
  observacoes?: string;
  valor: number;
  tipo_pagamento: string;
  endereco: string;
  created_at: string;
}

export interface CustomerStats {
  total: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  chart: ChartDataPoint[];
  period: string;
  lastUpdated: string;
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  todayRevenue: number;
  todayOrders: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  chart: SalesChartDataPoint[];
  period: string;
  lastUpdated: string;
  _source?: string; // Identificador para debug
}

export interface ChartDataPoint {
  name: string; // Data formatada (DD/MM ou MM/YYYY)
  value: number; // Novos clientes
  total?: number; // Total acumulado (opcional)
  isCurrentPeriod?: boolean;
}

export interface SalesChartDataPoint {
  name: string;
  value: number; // Revenue principal
  revenue?: number; // Alias para compatibilidade
  orders?: number;
  avgTicket?: number;
  isCurrentPeriod?: boolean;
}

export type ChartPeriod = 'day' | 'week' | 'month' | 'year';

// DTOs para requests
export interface GetStatsQuery {
  period?: ChartPeriod;
  startDate?: string;
  endDate?: string;
}
