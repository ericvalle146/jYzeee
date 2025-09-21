/**
 * SERVIÇO DE ANÁLISE DE MENSAGENS
 * 
 * Conecta com API local para buscar dados de mensagens armazenados em memória
 * Dados são perdidos quando o servidor é reiniciado
 */

import { ChartPeriod, MessageStats, ChartDataPoint } from '@/types/analytics';

interface MessageRow {
  contador: number;
  timestamp: string;
  id: string;
}

export class MessagesService {
  
  /**
   * Busca estatísticas de mensagens da API local (armazenamento em memória)
   */
  static async getMessageStats(period: ChartPeriod = 'day'): Promise<MessageStats> {
    try {
      console.log('🔍 [MessagesService] Buscando estatísticas de mensagens para período:', period);
      console.log('💾 [MessagesService] Usando API local com armazenamento em memória');
      
      const now = new Date();
      
      // Buscar dados da API local em paralelo
      const timestamp = Date.now();
      const [statsResponse, messagesResponse] = await Promise.all([
        fetch(`https://api.jyze.space/messages/stats?period=${period}&t=${timestamp}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        }),
        fetch(`https://api.jyze.space/messages?period=${period}&t=${timestamp}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        })
      ]);

      if (!statsResponse.ok || !messagesResponse.ok) {
        throw new Error(`API Error: Stats ${statsResponse.status}, Messages ${messagesResponse.status}`);
      }

      const statsData = await statsResponse.json();
      const messagesData = await messagesResponse.json();

      console.log('✅ [MessagesService] Dados recebidos da API:', { 
        stats: statsData.data,
        messagesCount: messagesData.data?.length || 0
      });

      // Gerar dados do gráfico
      const chartData = this.generateChartData(messagesData.data || [], period);
      
      // Calcular métricas
      const totalMessages = statsData.data?.totalMessages || 0;
      const todayMessages = statsData.data?.todayMessages || 0;
      const weekMessages = statsData.data?.weekMessages || 0;
      const avgMessagesPerDay = totalMessages > 0 ? Math.round((totalMessages / Math.max(1, this.getDaysSinceStart(statsData.data?.sessionStart))) * 100) / 100 : 0;

      return {
        totalMessages,
        todayMessages,
        thisWeekMessages: weekMessages,
        thisMonthMessages: totalMessages, // Para armazenamento em memória, é o mesmo que total
        avgMessagesPerDay,
        chart: chartData,
        period,
        lastUpdated: now.toISOString(),
        _source: 'LOCAL_API_MEMORY' // Identificador único
      };
    } catch (error) {
      console.error('❌ [MessagesService] Erro ao buscar estatísticas:', error);
      
      // Em caso de erro, retornar dados vazios mas válidos
      console.warn('⚠️ [MessagesService] Retornando dados vazios devido ao erro');
      return this.getEmptyMessageStats(period);
    }
  }

  private static generateChartData(messages: MessageRow[], period: ChartPeriod): ChartDataPoint[] {
    console.log('📊 [MessagesService] Gerando dados do gráfico para período:', period);
    console.log('📊 [MessagesService] Total de mensagens para processar:', messages.length);
    
    const now = new Date();
    let intervals: ChartDataPoint[] = [];

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
        break;

      default:
        throw new Error(`Período não suportado: ${period}`);
    }

    // Agrupar mensagens conforme o período
    const messagesMap = new Map<string, number>();
    
    messages.forEach((row: MessageRow) => {
      const date = new Date(row.timestamp);
      const count = row.contador || 1; // Sempre 1 conforme especificação
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

      messagesMap.set(key, (messagesMap.get(key) || 0) + count);
    });

    // Aplicar dados aos intervalos
    intervals.forEach(interval => {
      interval.value = messagesMap.get(interval.name) || 0;
    });

    console.log('✅ [MessagesService] Gráfico gerado com', intervals.length, 'pontos de dados');
    return intervals;
  }

  private static getDaysSinceStart(sessionStart: string | null): number {
    if (!sessionStart) return 1;
    
    const start = new Date(sessionStart);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  }

  private static getEmptyMessageStats(period: ChartPeriod): MessageStats {
    const now = new Date();
    return {
      totalMessages: 0,
      todayMessages: 0,
      thisWeekMessages: 0,
      thisMonthMessages: 0,
      avgMessagesPerDay: 0,
      chart: this.generateChartData([], period),
      period,
      lastUpdated: now.toISOString(),
      _source: 'EMPTY_FALLBACK'
    };
  }

  private static getMockMessageStats(period: ChartPeriod): MessageStats {
    const now = new Date();
    const mockChart: ChartDataPoint[] = [];
    
    if (period === 'day') {
      // Mock para 30 dias
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        mockChart.push({
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: Math.floor(Math.random() * 50 + 10),
          isCurrentPeriod: i === 0
        });
      }
    } else {
      // Mock para 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        mockChart.push({
          name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          value: Math.floor(Math.random() * 1500 + 800),
          isCurrentPeriod: i === 0
        });
      }
    }

    return {
      totalMessages: 2450,
      todayMessages: 45,
      thisWeekMessages: 320,
      thisMonthMessages: 1250,
      avgMessagesPerDay: 81.6,
      chart: mockChart,
      period,
      lastUpdated: now.toISOString(),
      _source: 'MOCK_DATA'
    };
  }
}
