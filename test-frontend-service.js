#!/usr/bin/env node

/**
 * TESTE DO SERVIÇO DE MENSAGENS DO FRONTEND
 * 
 * Simula o comportamento do MessagesService para verificar se está funcionando
 */

// Simular o MessagesService
class MessagesService {
  static async getMessageStats(period = 'day') {
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
        _source: 'LOCAL_API_MEMORY'
      };
    } catch (error) {
      console.error('❌ [MessagesService] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  static generateChartData(messages, period) {
    console.log('📊 [MessagesService] Gerando dados do gráfico para período:', period);
    console.log('📊 [MessagesService] Total de mensagens para processar:', messages.length);
    
    const now = new Date();
    let intervals = [];

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
    const messagesMap = new Map();
    
    messages.forEach((row) => {
      const date = new Date(row.timestamp);
      const count = row.contador || 1;
      let key;

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

  static getDaysSinceStart(sessionStart) {
    if (!sessionStart) return 1;
    
    const start = new Date(sessionStart);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  }
}

// Executar teste
async function testService() {
  console.log('🧪 [TEST] Testando MessagesService...\n');
  
  try {
    const stats = await MessagesService.getMessageStats('day');
    console.log('\n✅ [TEST] Serviço funcionando! Estatísticas recebidas:');
    console.log('📊 Total de mensagens:', stats.totalMessages);
    console.log('📊 Mensagens hoje:', stats.todayMessages);
    console.log('📊 Mensagens da semana:', stats.thisWeekMessages);
    console.log('📊 Média por dia:', stats.avgMessagesPerDay);
    console.log('📊 Pontos no gráfico:', stats.chart.length);
    console.log('📊 Dados do gráfico com valores > 0:', stats.chart.filter(p => p.value > 0).length);
    
    if (stats.chart.filter(p => p.value > 0).length > 0) {
      console.log('\n📈 [TEST] Pontos do gráfico com dados:');
      stats.chart.filter(p => p.value > 0).forEach(point => {
        console.log(`   ${point.name}: ${point.value} mensagens`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ [TEST] Erro no serviço:', error.message);
  }
}

testService();
