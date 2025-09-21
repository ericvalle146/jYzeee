import { Injectable } from '@nestjs/common';

interface WhatsAppMessage {
  msg: {
    msg_texto: string;
    id_mensagem: string;
    timestamp: string;
    type_msg: string;
    numero: string;
    base: string;
    instance: string;
    fromMe?: boolean;
  };
}

interface MessageCounter {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  hourlyData: { hour: string; count: number }[];
  dailyData: { day: string; count: number }[];
}

@Injectable()
export class MessagesService {
  private messageCounter: MessageCounter = {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    hourlyData: Array.from({ length: 24 }, (_, i) => ({ 
      hour: i.toString().padStart(2, '0'), 
      count: 0 
    })),
    dailyData: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        day: date.toISOString().split('T')[0],
        count: 0
      };
    }).reverse()
  };

  async processMessage(messageData: WhatsAppMessage) {
    try {
      
      // Conta a mensagem automaticamente quando processada
      await this.countMessage(messageData);
      
      return {
        processed: true,
        messageId: messageData.msg.id_mensagem,
        customerId: messageData.msg.numero,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async countMessage(messageData: any) {
    try {
      
      // Só conta mensagens de clientes (não do bot)
      // Verifica se é uma mensagem do bot (flexível para diferentes estruturas)
      const isFromBot = messageData.msg?.fromMe || messageData.fromMe || false;
      if (isFromBot) {
        return { counted: false, reason: 'Message from bot' };
      }

      // Incrementa contadores
      this.messageCounter.total++;
      
      const now = new Date();
      // SEMPRE conta na hora atual para garantir que o gráfico suba
      const currentHour = now.getHours();
      
      // Incrementa contador da hora atual (IGUAL AO TOTAL)
      if (currentHour >= 0 && currentHour < 24) {
        this.messageCounter.hourlyData[currentHour].count++;
      }
      
      // Usa timestamp flexível ou data atual como fallback
      const messageTimestamp = messageData.msg?.timestamp || messageData.timestamp || now.getTime();
      const messageDate = new Date(messageTimestamp);
      
      // Para debug - sempre conta como mensagem de hoje se não há timestamp específico
      const effectiveDate = messageData.msg?.timestamp || messageData.timestamp ? messageDate : now;
      
      // Conta mensagens de hoje
      if (this.isSameDay(effectiveDate, now)) {
        this.messageCounter.today++;
      }
      
      // Conta mensagens desta semana
      if (this.isSameWeek(effectiveDate, now)) {
        this.messageCounter.thisWeek++;
      }
      
      // Conta mensagens deste mês
      if (this.isSameMonth(effectiveDate, now)) {
        this.messageCounter.thisMonth++;
      }
      
      // Atualiza dados diários - usa data atual se não há timestamp específico
      const dayKey = effectiveDate.toISOString().split('T')[0];
      const dayIndex = this.messageCounter.dailyData.findIndex(d => d.day === dayKey);
      
      // Se não encontrou o dia, adiciona o dia atual
      if (dayIndex === -1) {
        this.messageCounter.dailyData.push({
          day: dayKey,
          count: 1
        });
        // Remove dias muito antigos (manter apenas últimos 90 dias)
        if (this.messageCounter.dailyData.length > 90) {
          this.messageCounter.dailyData = this.messageCounter.dailyData.slice(-90);
        }
      } else {
        this.messageCounter.dailyData[dayIndex].count++;
      }

      
      return {
        counted: true,
        total: this.messageCounter.total,
        today: this.messageCounter.today,
        messageId: messageData.msg?.id_mensagem || messageData.messageId || `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async getMessageStats(period: string = 'day') {
    try {
      
      let data;
      const now = new Date();
      
      switch (period) {
        case 'day': {
          // Diário: mostra apenas hoje dividido por horas (24 pontos)
          const currentHour = now.getHours();
          data = this.messageCounter.hourlyData.map((h, index) => ({
            name: `${h.hour}:00`,
            value: h.count, // Usar valor real sem forçar mínimo
            isCurrentHour: index === currentHour
          })).slice(0, currentHour + 1); // Só mostra até a hora atual
          break;
        }
          
        case 'month': {
          // Mensal: mostra todos os dias do mês atual
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          
          data = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayData = this.messageCounter.dailyData.find(d => d.day === dayKey);
            
            return {
              name: day <= 10 || day % 5 === 0 || day === daysInMonth || day === new Date().getDate() ? day.toString() : '',
              value: dayData?.count || 0, // Usar valor real
              fullName: `Dia ${day}`
            };
          });
          break;
        }
          
        case 'year': {
          // Anual: mostra todos os meses do ano atual
          const currentYear = now.getFullYear();
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                             'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          
          data = monthNames.map((monthName, index) => {
            // Soma todas as mensagens do mês
            const monthCount = this.messageCounter.dailyData
              .filter(d => {
                const date = new Date(d.day);
                return date.getMonth() === index && date.getFullYear() === currentYear;
              })
              .reduce((sum, d) => sum + d.count, 0);
            
            return {
              name: monthName,
              value: monthCount, // Usar valor real
              fullName: monthName
            };
          });
          break;
        }
          
        default: {
          // Default: últimos 7 dias
          data = this.messageCounter.dailyData.slice(-7).map(d => ({
            name: new Date(d.day).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
            value: d.count // Usar valor real
          }));
        }
      }
      
      return {
        total: this.messageCounter.total,
        today: this.messageCounter.today,
        thisWeek: this.messageCounter.thisWeek,
        thisMonth: this.messageCounter.thisMonth,
        chart: data,
        period,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isSameWeek(date1: Date, date2: Date): boolean {
    const oneWeekAgo = new Date(date2);
    oneWeekAgo.setDate(date2.getDate() - 7);
    return date1 >= oneWeekAgo && date1 <= date2;
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  }

  async syncMessage(messageData: { messageId: string; content: Record<string, unknown> }) {
    try {
      
      // Aqui será implementada a lógica de sincronização com o banco
      return {
        synced: true,
        messageId: messageData.messageId || 'unknown',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async getMessagesByCustomer(customerId: string) {
    try {
      
      // Aqui será implementada a busca no banco de dados
      // Por enquanto, retorna dados simulados
      return [
        {
          id: '1',
          content: 'Mensagem de exemplo',
          timestamp: new Date().toISOString(),
          type: 'text',
        },
      ];
    } catch (error) {
      throw error;
    }
  }
}
