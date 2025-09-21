import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { OrdersService } from './modules/orders/orders.service';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() orderData: {
    nome_cliente: string;
    pedido: string;
    observações?: string;
    valor: number;
    tipo_pagamento: string;
    endereço: string;
  }) {
    this.logger.log('📡 POST /orders - Criando pedido');
    try {
      const result = await this.ordersService.createOrder(orderData);
      return {
        status: 'success',
        data: result
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar pedido:', error);
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  @Get()
  async getOrders() {
    this.logger.log('📡 GET /orders');
    const orders = await this.ordersService.getAllOrders();
    
    return {
      status: 'success',
      data: orders,
      total: orders.length
    };
  }

  @Get('stats')
  async getStats() {
    this.logger.log('📡 GET /orders/stats');
    const orders = await this.ordersService.getAllOrders();
    const today = new Date().toDateString();
    
    return {
      status: 'success',
      data: {
        totalOrders: orders.length,
        todayOrders: orders.filter(o => new Date(o.created_at).toDateString() === today).length,
        pendingOrders: orders.filter(o => !o.impresso).length,
        printedOrders: orders.filter(o => o.impresso).length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.valor || 0), 0),
        lastUpdated: new Date().toISOString()
      }
    };
  }

  @Post(':id/print')
  async printOrder(@Param('id') id: string) {
    this.logger.log(`📡 POST /orders/${id}/print`);
    return this.ordersService.printOrder(parseInt(id));
  }

  @Post(':id/print-status')
  async updatePrintStatus(@Param('id') id: string, @Body() body: { impresso: boolean }) {
    this.logger.log(`📡 POST /orders/${id}/print-status`);
    return this.ordersService.updatePrintStatus(parseInt(id), body.impresso);
  }

  @Post('auto-print/toggle')
  async toggleAutoPrint() {
    this.logger.log('📡 POST /orders/auto-print/toggle');
    return this.ordersService.toggleAutoPrint();
  }

  @Get('auto-print/status')
  async getAutoPrintStatus() {
    this.logger.log('📡 GET /orders/auto-print/status');
    return this.ordersService.getAutoPrintStatus();
  }
}
