import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, TrendingUp, Activity, Users, MessageSquare, Target, BarChart3, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { useMessageStats } from "@/hooks/useMessageStats";
import CustomerAnalytics from "@/components/CustomerAnalytics";
import { SalesAnalytics } from "@/components/SalesAnalytics";
import { MessageAnalytics } from "@/components/MessageAnalytics";

import { getApiUrl } from "@/config/api";
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

const Dashboard: React.FC = () => {
  const { stats, isLoading: loading, error, refresh: refreshStats } = useMessageStats();
  
  // Estados para navegação estilo trading
  const [viewportStart, setViewportStart] = useState(0);
  const [viewportEnd, setViewportEnd] = useState(19);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);



  // Mouse handlers para arrastar
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !chartRef.current) return;
    
    const deltaX = e.clientX - dragStart;
    const chartWidth = chartRef.current.offsetWidth;
    const dataLength = stats?.chart?.length || 24;
    const viewportWidth = viewportEnd - viewportStart + 1;
    
    // Calcular movimento baseado no delta
    const moveAmount = Math.round(-(deltaX / chartWidth) * viewportWidth * 0.5);
    
    if (Math.abs(moveAmount) > 0) {
      const newStart = Math.max(0, viewportStart + moveAmount);
      const newEnd = Math.min(dataLength - 1, newStart + viewportWidth - 1);
      
      if (newStart !== viewportStart) {
        setViewportStart(newStart);
        setViewportEnd(newEnd);
        setDragStart(e.clientX);
      }
    }
  }, [isDragging, dragStart, viewportStart, viewportEnd, stats?.chart?.length]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners globais
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const reactEvent = {
          clientX: mouseEvent.clientX,
          preventDefault: () => mouseEvent.preventDefault()
        } as React.MouseEvent;
        handleMouseMove(reactEvent);
      };
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const viewportWidth = viewportEnd - viewportStart + 1;
    if (viewportWidth > 5) {
      const newWidth = Math.max(5, Math.floor(viewportWidth * 0.7));
      const center = Math.floor((viewportStart + viewportEnd) / 2);
      const newStart = Math.max(0, center - Math.floor(newWidth / 2));
      const newEnd = Math.min((stats?.chart?.length || 24) - 1, newStart + newWidth - 1);
      setViewportStart(newStart);
      setViewportEnd(newEnd);
    }
  }, [viewportStart, viewportEnd, stats?.chart?.length]);

  const handleZoomOut = useCallback(() => {
    const dataLength = stats?.chart?.length || 24;
    const viewportWidth = viewportEnd - viewportStart + 1;
    const maxWidth = Math.min(dataLength, 24);
    
    if (viewportWidth < maxWidth) {
      const newWidth = Math.min(maxWidth, Math.floor(viewportWidth * 1.4));
      const center = Math.floor((viewportStart + viewportEnd) / 2);
      const newStart = Math.max(0, center - Math.floor(newWidth / 2));
      const newEnd = Math.min(dataLength - 1, newStart + newWidth - 1);
      setViewportStart(newStart);
      setViewportEnd(newEnd);
    }
  }, [viewportStart, viewportEnd, stats?.chart?.length]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar dashboard: {error}</p>
              <button 
                onClick={refreshStats}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular dados visíveis baseado no viewport
  const visibleData = stats?.chart?.slice(viewportStart, viewportEnd + 1) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent mt-12">
            Dashboard Analytics
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Acompanhe em tempo real o desempenho completo do seu negócio com insights detalhados e métricas avançadas
          </p>
        </div>


        {/* Seção 2: Análise de Pedidos */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
               Análise de Pedidos
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Performance e evolução dos seus pedidos
            </p>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
            <CustomerAnalytics />
          </div>
        </section>

        {/* Divisor */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <div className="w-3 h-3 rounded-full bg-slate-300"></div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        </div>

        {/* Seção 3: Análise de Mensagens */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              Análise de Mensagens
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Contagem e evolução de mensagens recebidas em tempo real
            </p>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
            <MessageAnalytics />
          </div>
        </section>

        {/* Divisor */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <div className="w-3 h-3 rounded-full bg-slate-300"></div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        </div>

        {/* Seção 4: Análise de Vendas */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-600" />
              Análise de Vendas
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Performance financeira e resultados de receita
            </p>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
            <SalesAnalytics />
          </div>
        </section>

        {/* Footer da página */}
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Dados atualizados em tempo real
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-600">
            Dashboard Analytics • Powered by JYZE.AI
          </p>
        </div>
      </div>

      {/* CSS para animações e design moderno */}
      <style>{`
        .trading-chart {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 16px;
          overflow: hidden;
        }
        .trading-chart.dragging {
          transition: none;
        }
        .trading-chart:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
        }
        
        /* Animações suaves para os cards */
        .metric-card {
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -3px rgb(0 0 0 / 0.1);
        }
        
        /* Efeito glassmorphism */
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        
        /* Gradientes personalizados */
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Animação de fade-in */
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
