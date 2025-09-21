import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { Users, TrendingUp, UserPlus, Activity } from "lucide-react";
import { useCustomerStats } from "@/hooks/useCustomerStats";
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

export const CustomerAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<ChartPeriod>('day');
  const { stats, isLoading, error, refresh } = useCustomerStats(period);

  // DEBUG: Log para verificar dados recebidos
  React.useEffect(() => {
    console.log('🔍 [CustomerAnalytics] Dados recebidos:', stats);
    console.log('🔍 [CustomerAnalytics] Chart data:', stats?.chart);
    console.log('🔍 [CustomerAnalytics] Chart data length:', stats?.chart?.length);
    console.log('🔍 [CustomerAnalytics] isLoading:', isLoading);
    console.log('🔍 [CustomerAnalytics] error:', error);
    
    // Log detalhado dos primeiros pontos do gráfico
    if (stats?.chart && stats.chart.length > 0) {
      console.log('🔍 [CustomerAnalytics] Primeiros 3 pontos do gráfico:', stats.chart.slice(0, 3));
    }
  }, [stats, isLoading, error]);

  // Função para criar escala uniforme
  const createUniformScale = () => {
    const ranges = [0, 10, 20, 50, 100];
    const uniformTicks = ranges.map((_, index) => index * 25); // 0, 25, 50, 75, 100
    return { ranges, uniformTicks };
  };

  // Transformar dados para escala uniforme
  const transformDataForUniformScale = (data: any[]) => {
    if (!data || data.length === 0) {
      console.log('🔍 [CustomerAnalytics] Dados vazios para transformação');
      return [];
    }
    
    console.log('🔍 [CustomerAnalytics] Transformando dados:', data);
    
    return data.map(item => {
      // Usar 'customers' que é a propriedade correta dos dados do gráfico
      const value = item.customers || 0;
      let transformedValue = 0;
      
      if (value <= 10) {
        transformedValue = (value / 10) * 25; // 0-10 -> 0-25
      } else if (value <= 20) {
        transformedValue = 25 + ((value - 10) / 10) * 25; // 10-20 -> 25-50
      } else if (value <= 50) {
        transformedValue = 50 + ((value - 20) / 30) * 25; // 20-50 -> 50-75
      } else {
        transformedValue = 75 + ((value - 50) / 50) * 25; // 50-100 -> 75-100
      }
      
      return { 
        ...item, 
        value: transformedValue, 
        originalValue: value,
        name: item.name || item.date // Garantir que tem o nome para o eixo X
      };
    });
  };

  const periodOptions = [
    { value: 'day' as ChartPeriod, label: 'Últimos 30 dias', icon: '📅' },
    { value: 'month' as ChartPeriod, label: 'Últimos 12 meses', icon: '📈' }
  ];

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
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
            <p>Erro ao carregar estatísticas de clientes: {error}</p>
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

      {/* Métricas de Pedidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Pedidos"
          value={formatNumber(stats?.totalCustomers || 0)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Novos Hoje"
          value={formatNumber(stats?.newCustomers || 0)}
          icon={UserPlus}
        />
        <MetricCard
          title="Pedidos Semanais"
          value={formatNumber(stats?.activeCustomers || 0)}
          icon={Activity}
        />
        <MetricCard
          title="Pedidos Mensais"
          value={formatNumber(stats?.pendingOrders || 0)}
          icon={Users}
        />
      </div>

      {/* Gráfico de Pedidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evolução de Pedidos</CardTitle>
              <CardDescription>
                Crescimento dos pedidos ao longo do tempo
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
            <AreaChart 
              data={transformDataForUniformScale(stats?.chart || [])} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
                    25: '10',
                    50: '20',
                    75: '50',
                    100: '100'
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
                  return [formatNumber(originalValue), 'Pedidos'];
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#customerGradient)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAnalytics;
