import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { MessageSquare, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { useMessageStats } from "@/hooks/useMessageStats";
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

export const MessageAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<ChartPeriod>('day');
  const { stats, isLoading, error, refresh } = useMessageStats(period);

  // Função para transformar dados para escala uniforme de mensagens
  const transformMessagesDataForUniformScale = (data: any[]) => {
    const ranges = [0, 50, 100, 200, 500, 1000];
    return data.map(item => {
      const value = item.value || 0;
      let transformedValue = 0;
      
      if (value <= 50) {
        transformedValue = (value / 50) * 20; // 0-50 → 0-20
      } else if (value <= 100) {
        transformedValue = 20 + ((value - 50) / 50) * 20; // 50-100 → 20-40
      } else if (value <= 200) {
        transformedValue = 40 + ((value - 100) / 100) * 20; // 100-200 → 40-60
      } else if (value <= 500) {
        transformedValue = 60 + ((value - 200) / 300) * 20; // 200-500 → 60-80
      } else {
        transformedValue = 80 + ((value - 500) / 500) * 20; // 500-1000 → 80-100
      }
      
      return { ...item, value: transformedValue, originalValue: value };
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
            <p>Erro ao carregar estatísticas de mensagens: {error}</p>
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

      {/* Métricas de Mensagens */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Mensagens"
          value={formatNumber(stats?.totalMessages || 0)}
          icon={MessageSquare}
        />
        <MetricCard
          title="Mensagens Hoje"
          value={formatNumber(stats?.todayMessages || 0)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Mensagens Semanal"
          value={formatNumber(stats?.thisWeekMessages || 0)}
          icon={BarChart3}
        />
        <MetricCard
          title="Média Diária"
          value={formatNumber(Math.round(stats?.avgMessagesPerDay || 0))}
          icon={Activity}
        />
      </div>

      {/* Gráfico de Mensagens */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análise de Mensagens</CardTitle>
              <CardDescription>
                Evolução das mensagens recebidas ao longo do tempo
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
            <AreaChart data={transformMessagesDataForUniformScale(stats?.chart || [])} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
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
                ticks={[0, 20, 40, 60, 80, 100]}
                type="number"
                tickFormatter={(value) => {
                  const tickMap: { [key: number]: string } = {
                    0: '0',
                    20: '50',
                    40: '100',
                    60: '200',
                    80: '500',
                    100: '1000'
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
                  return [formatNumber(originalValue), 'Mensagens'];
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#messagesGradient)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
