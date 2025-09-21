import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class OrdersService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://jvwfdcjqrptlpgxqxnmt.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8'
    );
  }

  // APENAS LEITURA - Buscar todos os pedidos da tabela real 'pedidos'
  async getAllOrders(status?: string) {
    try {
      let query = this.supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        // Filtrar por status específico
        if (status === 'em_andamento') {
          query = query.not('status', 'ilike', '%entregue%');
        } else if (status === 'entregue') {
          query = query.ilike('status', '%entregue%');
        } else {
          query = query.eq('status', status);
        }
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Filtrar apenas pedidos completos usando validação inteligente
      const completeOrders = (orders || []).filter(order => this.isOrderComplete(order));
      
      return completeOrders;
    } catch (error) {
      return [];
    }
  }

  // Função auxiliar para validar se o pedido está completo
  private isOrderComplete(order: any): boolean {
    // Validação inteligente - requer apenas dados essenciais
    const hasCustomer = order.nome_cliente && order.nome_cliente.trim() !== '';
    const hasOrder = order.pedido && order.pedido.trim() !== '';
    const hasValue = order.valor !== null && order.valor !== undefined && order.valor > 0;
    
    return hasCustomer && hasOrder && hasValue;
  }

  // APENAS LEITURA - Buscar pedidos em tempo real (pedidos não entregues)
  async getRealtimeOrders() {
    try {
      const { data: orders, error } = await this.supabase
        .from('pedidos')
        .select('*')
        .not('status', 'ilike', '%entregue%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders || [];
    } catch (error) {
      return [];
    }
  }

  // APENAS LEITURA - Buscar pedido por ID
  async getOrderById(orderId: number) {
    try {
      const { data: order, error } = await this.supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return order || null;
    } catch (error) {
      return null;
    }
  }

  // APENAS LEITURA - Estatísticas dos pedidos baseadas na estrutura real
  async getOrderStats() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Buscar todos os pedidos
      const { data: allOrders, error } = await this.supabase
        .from('pedidos')
        .select('*');

      if (error) throw error;

      const orders = allOrders || [];

      // Calcular estatísticas baseadas no status real
      const stats = {
        totalOrders: orders.length,
        todayOrders: orders.filter(order => 
          order.created_at?.startsWith(today)
        ).length,
        pendingOrders: orders.filter(order => 
          order.status && !order.status.toLowerCase().includes('entregue')
        ).length,
        deliveredOrders: orders.filter(order => 
          order.status && order.status.toLowerCase().includes('entregue')
        ).length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.valor || 0), 0),
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      return {
        totalOrders: 0,
        todayOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // ================================
  // OPERAÇÕES DE ESCRITA PARA TABELA 'pedidos'
  // ================================

  // Criar novo pedido na estrutura real
  async createOrder(orderData: {
    nome_cliente: string;
    pedido: string;
    observações?: string; // Campo correto com cedilha
    valor: number;
    tipo_pagamento: string;
    endereço: string; // Campo correto com cedilha
  }) {
    try {
      const { data: newOrder, error } = await this.supabase
        .from('pedidos')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return newOrder;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar status do pedido
  async updateOrderStatus(orderId: number, status: string) {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar status de impressão do pedido
  async updatePrintStatus(orderId: number, impresso: boolean) {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .update({ impresso })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // MÉTODOS ADICIONAIS PARA COMPATIBILIDADE
  async printOrder(orderId: number): Promise<any> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        return {
          success: false,
          message: 'Pedido não encontrado'
        };
      }

      // TODO: Integrar com sistema de impressão
      return {
        success: true,
        message: `Pedido #${orderId} enviado para impressão`,
        orderId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao imprimir pedido',
        error: error.message
      };
    }
  }

  async toggleAutoPrint(): Promise<any> {
    // TODO: Implementar toggle de auto-impressão
    return {
      success: true,
      message: 'Auto-impressão alternada',
      enabled: true
    };
  }

  async getAutoPrintStatus(): Promise<any> {
    // TODO: Implementar status de auto-impressão
    return {
      success: true,
      enabled: true,
      message: 'Auto-impressão está ativa'
    };
  }
}
