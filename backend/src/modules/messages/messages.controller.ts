import { Controller, Post, Get, Body, Param, HttpStatus, HttpException, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';

export interface WhatsAppMessage {
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

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('receive')
  async receiveMessage(@Body() messageData: WhatsAppMessage) {
    try {
      
      const result = await this.messagesService.processMessage(messageData);
      
      return {
        status: 'success',
        message: 'Mensagem processada com sucesso',
        data: result,
      };
    } catch (error) {
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('count')
  async countMessage(@Body() messageData: any) {
    try {
      
      const result = await this.messagesService.countMessage(messageData);
      
      return {
        status: 'success',
        message: 'Mensagem contada com sucesso',
        data: result,
      };
    } catch (error) {
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  async getMessageStats(@Query('period') period: string = 'day') {
    try {
      const stats = await this.messagesService.getMessageStats(period);
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new HttpException('Erro ao buscar estatísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('sync')
  async syncMessage(@Body() messageData: { messageId: string; content: Record<string, unknown> }) {
    try {
      const result = await this.messagesService.syncMessage(messageData);
      return {
        status: 'success',
        message: 'Mensagem sincronizada com sucesso',
        data: result,
      };
    } catch (error) {
      throw new HttpException('Erro ao sincronizar mensagem', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':customerId')
  async getMessagesByCustomer(@Param('customerId') customerId: string) {
    try {
      const messages = await this.messagesService.getMessagesByCustomer(customerId);
      return {
        status: 'success',
        data: messages,
      };
    } catch (error) {
      throw new HttpException('Erro ao buscar mensagens', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
