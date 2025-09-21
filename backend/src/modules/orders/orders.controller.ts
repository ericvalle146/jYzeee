import { Controller, Get, Post, Put, Delete, Query, Param, Body, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ================================
  // APENAS LEITURA - ENDPOINTS
  // ================================

  @Get()
  async getAllOrders(@Query('status') status?: string) {
    try {
      const orders = await this.ordersService.getAllOrders(status);
      return {
        status: 'success',
        data: orders,
        count: orders.length
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: []
      };
    }
  }

  @Get('realtime')
  async getRealtimeOrders() {
    try {
      const orders = await this.ordersService.getRealtimeOrders();
      return {
        status: 'success',
        data: orders,
        count: orders.length
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: []
      };
    }
  }

  @Get('stats')
  async getOrderStats() {
    try {
      const stats = await this.ordersService.getOrderStats();
      return {
        status: 'success',
        data: stats
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: {
          totalOrders: 0,
          todayOrders: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          totalRevenue: 0,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  }

  @Get(':id')
  async getOrderById(@Param('id') id: number) {
    try {
      const order = await this.ordersService.getOrderById(id);
      if (!order) {
        return {
          status: 'error',
          message: 'Pedido não encontrado',
          data: null
        };
      }
      return {
        status: 'success',
        data: order
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }

  // ================================
  // ENDPOINTS DE ESCRITA PARA TABELA 'pedidos'
  // ================================

  @Post()
  async createOrder(@Body() orderData: {
    nome_cliente: string;
    pedido: string;
    observações?: string; // Campo correto com cedilha
    valor: number;
    tipo_pagamento: string;
    endereço: string; // Campo correto com cedilha
  }) {
    try {
      const order = await this.ordersService.createOrder(orderData);
      return {
        status: 'success',
        message: 'Pedido criado com sucesso',
        data: order
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: number,
    @Body() body: { status: string }
  ) {
    try {
      const order = await this.ordersService.updateOrderStatus(id, body.status);
      return {
        status: 'success',
        message: 'Status atualizado com sucesso',
        data: order
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }

  @Patch(':id/print-status')
  async updatePrintStatus(
    @Param('id') id: number,
    @Body() body: { impresso: boolean }
  ) {
    try {
      const order = await this.ordersService.updatePrintStatus(id, body.impresso);
      return {
        status: 'success',
        message: 'Status de impressão atualizado com sucesso',
        data: order
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }
}
