import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { DollarSign, TrendingUp, ShoppingCart, BarChart3 } from "lucide-react";
import { useSalesStats } from "@/hooks/useSalesStats";
import { ChartPeriod } from "@/types/analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export const SalesAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<ChartPeriod>('day');
  const { stats, isLoading, error, refresh } = useSalesStats(period);

  // Função para transformar dados para escala uniforme de vendas
  const transformSalesDataForUniformScale = (data: any[]) => {
    const ranges = [0, 500, 1000, 2000, 5000];
    return data.map(item => {
      const value = item.value || 0;
      let transformedValue = 0;
      
      if (value <= 500) {
        transformedValue = (value / 500) * 25; // 0-500 → 0-25
      } else if (value <= 1000) {
        transformedValue = 25 + ((value - 500) / 500) * 25; // 500-1000 → 25-50
      } else if (value <= 2000) {
        transformedValue = 50 + ((value - 1000) / 1000) * 25; // 1000-2000 → 50-75
      } else {
        transformedValue = 75 + ((value - 2000) / 3000) * 25; // 2000-5000 → 75-100
      }
      
      return { ...item, value: transformedValue, originalValue: value };
    });
  };

  const periodOptions = [
    { value: 'day' as ChartPeriod, label: 'Últimos 30 dias', icon: '📅' },
    { value: 'month' as ChartPeriod, label: 'Últimos 12 meses', icon: '📈' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-80 bg-gray-300 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar estatísticas de vendas: {error}</p>
            <button 
              onClick={refresh}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão de Atualização */}
      <div className="flex justify-end items-center py-4">
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200"
          disabled={isLoading}
        >
          <span className={`text-base ${isLoading ? 'animate-spin' : ''}`}>
            🔄
          </span>
          <span className="font-medium">Atualizar</span>
        </button>
      </div>

      {/* Métricas de Vendas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
        />
        <MetricCard
          title="Vendas Hoje"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Vendas Semanal"
          value={formatCurrency(stats?.thisWeekRevenue || 0)}
          icon={BarChart3}
        />
        <MetricCard
          title="Vendas Mensais"
          value={formatCurrency(stats?.thisMonthRevenue || 0)}
          icon={ShoppingCart}
        />
      </div>

      {/* Gráfico de Receita */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receita de Vendas</CardTitle>
              <CardDescription>
                Evolução da receita ao longo do tempo
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPeriod('day')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  period === 'day' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                30 Dias
              </button>
              <button 
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  period === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                12 Meses
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={transformSalesDataForUniformScale(stats?.chart || [])} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                type="number"
                tickFormatter={(value) => {
                  const tickMap: { [key: number]: string } = {
                    0: '0',
                    25: '500',
                    50: '1000',
                    75: '2000',
                    100: '5000'
                  };
                  return tickMap[value] || '';
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(value: number, name: string, props: any) => {
                  const originalValue = props.payload?.originalValue || value;
                  return [formatCurrency(originalValue), 'Receita'];
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalOrders ? formatCurrency((stats?.totalRevenue || 0) / stats.totalOrders) : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Valor médio por pedido
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
