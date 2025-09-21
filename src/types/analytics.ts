export type ChartPeriod = 'day' | 'week' | 'month' | 'year';

export interface ChartDataPoint {
  name: string;
  value: number;
  isCurrentPeriod?: boolean;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  printedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  growth: number;
  chart: ChartDataPoint[];
  period: ChartPeriod;
  lastUpdated: string;
}

export interface SalesStats {
  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  totalOrders: number;
  todayOrders: number;
  avgTicket: number;
  chart: ChartDataPoint[];
  period: ChartPeriod;
  lastUpdated: string;
}

export interface MessageStats {
  totalMessages: number;
  todayMessages: number;
  thisWeekMessages: number;
  thisMonthMessages: number;
  avgMessagesPerDay: number;
  chart: ChartDataPoint[];
  period: ChartPeriod;
  lastUpdated: string;
}
