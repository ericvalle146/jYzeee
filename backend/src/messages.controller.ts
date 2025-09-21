import { Controller, Get, Post, Query, Body, HttpException, HttpStatus } from '@nestjs/common';

interface MessageCountPayload {
  contador: string;
}

interface MessageRecord {
  contador: number;
  timestamp: string;
  id: string;
}

interface ChatMessagePayload {
  resposta: string;
}

@Controller('messages')
export class MessagesController {
  // Armazenamento em memória - dados perdidos ao reiniciar servidor
  private readonly mensagensMemoria: MessageRecord[] = [];
  // Armazenamento para mensagens do chat
  private readonly chatMessages: Array<{id: string, resposta: string, timestamp: string}> = [];
  
  constructor() {
  }

  @Post('count')
  async receiveMessageCount(@Body() payload: MessageCountPayload) {
    try {

      // Validar payload
      if (!payload || payload.contador !== '1') {
        throw new HttpException(
          {
            status: 'error',
            message: 'Payload inválido. Esperado: {"contador": "1"}',
            received: payload
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Criar registro em memória
      const novoRegistro: MessageRecord = {
        contador: 1, // Sempre 1 conforme especificação
        timestamp: new Date().toISOString(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Armazenar em memória
      this.mensagensMemoria.push(novoRegistro);


      return {
        status: 'success',
        message: 'Mensagem recebida e armazenada com sucesso',
        data: {
          id: novoRegistro.id,
          contador: novoRegistro.contador,
          timestamp: novoRegistro.timestamp,
          totalMessages: this.mensagensMemoria.length
        }
      };

    } catch (error) {
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'error',
          message: 'Erro interno do servidor',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('chat/send-message')
  async sendChatMessage(@Body() payload: ChatMessagePayload) {
    try {
      // console.log('💬 [MessagesController] Recebendo mensagem para chat:', payload);

      // Validar payload
      if (!payload || !payload.resposta || typeof payload.resposta !== 'string') {
        // console.error('❌ [MessagesController] Payload inválido para chat:', payload);
        throw new HttpException(
          {
            status: 'error',
            message: 'Payload inválido. Esperado: {"resposta": "texto da mensagem"}',
            received: payload
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Criar registro da mensagem
      const novaMensagem = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resposta: payload.resposta,
        timestamp: new Date().toISOString()
      };

      // Armazenar mensagem
      this.chatMessages.push(novaMensagem);

      // console.log('✅ [MessagesController] Mensagem do chat armazenada:', novaMensagem);
      // console.log(`📊 [MessagesController] Total de mensagens do chat: ${this.chatMessages.length}`);

      return {
        status: 'success',
        message: 'Mensagem enviada para o chat com sucesso',
        data: {
          id: novaMensagem.id,
          resposta: novaMensagem.resposta,
          timestamp: novaMensagem.timestamp
        }
      };

    } catch (error) {
      // console.error('❌ [MessagesController] Erro ao enviar mensagem para chat:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'error',
          message: 'Erro interno do servidor',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('chat/messages')
  async getChatMessages() {
    try {
      // console.log(`📋 [MessagesController] Buscando mensagens do chat. Total: ${this.chatMessages.length}`);

      return {
        status: 'success',
        data: this.chatMessages,
        meta: {
          total: this.chatMessages.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      // console.error('❌ [MessagesController] Erro ao buscar mensagens do chat:', error);
      
      return {
        status: 'error',
        data: [],
        error: error.message
      };
    }
  }

  @Get('stats')
  async getStats(@Query('period') period: string = 'day') {
    try {
      // console.log(`📊 [MessagesController] Buscando estatísticas para período: ${period}`);
      // console.log(`💾 [MessagesController] Total de mensagens na memória: ${this.mensagensMemoria.length}`);

      const now = new Date();
      let startDate: Date;

      // Definir data de início baseada no período
      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7 * 12);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }

      // Filtrar mensagens do período
      const mensagensPeriodo = this.mensagensMemoria.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= startDate;
      });

      // Calcular estatísticas
      const hoje = new Date().toDateString();
      const mensagensHoje = this.mensagensMemoria.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate.toDateString() === hoje;
      }).length;

      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      const mensagensSemana = this.mensagensMemoria.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= semanaAtras;
      }).length;

      return {
        status: 'success',
        data: {
          totalMessages: this.mensagensMemoria.length,
          todayMessages: mensagensHoje,
          weekMessages: mensagensSemana,
          period: period,
          timestamp: new Date().toISOString(),
          sessionStart: this.mensagensMemoria.length > 0 ? this.mensagensMemoria[0].timestamp : null,
          lastMessage: this.mensagensMemoria.length > 0 ? this.mensagensMemoria[this.mensagensMemoria.length - 1].timestamp : null
        }
      };

    } catch (error) {
      // console.error('❌ [MessagesController] Erro ao buscar estatísticas:', error);
      
      return {
        status: 'error',
        data: {
          totalMessages: 0,
          todayMessages: 0,
          weekMessages: 0,
          period: period,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      };
    }
  }

  @Get()
  async getAllMessages(@Query('period') period: string = 'day') {
    try {
      // console.log(`📋 [MessagesController] Buscando todas as mensagens para período: ${period}`);

      const now = new Date();
      let startDate: Date;

      // Definir data de início baseada no período
      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }

      // Filtrar mensagens do período
      const mensagensPeriodo = this.mensagensMemoria.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= startDate;
      });

      // console.log(`✅ [MessagesController] Retornando ${mensagensPeriodo.length} mensagens do período`);

      return {
        status: 'success',
        data: mensagensPeriodo,
        meta: {
          total: this.mensagensMemoria.length,
          filtered: mensagensPeriodo.length,
          period: period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        }
      };

    } catch (error) {
      // console.error('❌ [MessagesController] Erro ao buscar mensagens:', error);
      
      return {
        status: 'error',
        data: [],
        error: error.message
      };
    }
  }
}
