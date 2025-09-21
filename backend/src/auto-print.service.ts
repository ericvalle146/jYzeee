import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UnifiedPrinterService } from './unified-printer.service';
import { OrdersService } from './modules/orders/orders.service';

@Injectable()
export class AutoPrintService implements OnModuleInit {
  private readonly logger = new Logger(AutoPrintService.name);
  private isEnabled = false;
  private lastProcessedId = 0;
  private printedOrders = new Set<number>();
  private intervalId: NodeJS.Timeout;
  
  constructor(
    private readonly unifiedPrinterService: UnifiedPrinterService,
    private readonly ordersService: OrdersService,
  ) {}

  onModuleInit() {
    this.logger.log('🤖 AutoPrint Service iniciado');
    this.startAutoprint();
  }

  private startAutoprint() {
    this.intervalId = setInterval(async () => {
      if (this.isEnabled) {
        await this.checkForNewOrders();
      }
    }, 5000); // Verificar a cada 5 segundos

    this.logger.log('🔄 Auto-impressão monitoramento iniciado (5s)');
  }

  private async checkForNewOrders() {
    try {
      // Buscar pedidos
      const orders = await this.ordersService.getAllOrders();

      // Filtrar novos pedidos
      const newOrders = orders.filter(order => 
        order.id > this.lastProcessedId && 
        order.status !== 'cancelled'
      );

      if (newOrders.length > 0) {
        this.logger.log(`🤖 Novos pedidos detectados: ${newOrders.map(o => o.id).join(', ')}`);
        
        for (const order of newOrders) {
          await this.printNewOrder(order);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar novos pedidos: ${error.message}`);
    }
  }

  private async printNewOrder(order: any) {
    try {
      this.logger.log(`🖨️ Auto-imprimindo pedido #${order.id}`);
      
      // Detectar impressoras e usar a primeira disponível
      const printers = await this.unifiedPrinterService.detectAllPrinters();
      const activePrinter = printers.find(p => p.status === 'online') || printers[0];
      
      if (!activePrinter) {
        this.logger.error(`❌ Nenhuma impressora disponível para pedido #${order.id}`);
        return;
      }

      // Gerar texto de impressão
      const printText = this.generatePrintText(order);
      
      const result = await this.unifiedPrinterService.printOrder(activePrinter.id, order, printText);
      
      if (result.success) {
        this.printedOrders.add(order.id);
        this.lastProcessedId = Math.max(this.lastProcessedId, order.id);
        
        // Marcar como impresso no banco de dados
        await this.ordersService.updatePrintStatus(order.id, true);
        
        this.logger.log(`✅ Pedido #${order.id} auto-impresso com sucesso`);
      } else {
        this.logger.error(`❌ Falha na auto-impressão do pedido #${order.id}: ${result.message}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao auto-imprimir pedido #${order.id}: ${error.message}`);
    }
  }

  private generatePrintText(order: any): string {
    const lines = [];
    
    lines.push('JYZE DELIVERY - AUTO PRINT');
    lines.push('================================');
    lines.push(`PEDIDO #${order.id}`);
    lines.push(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push(`Cliente: ${order.nome_cliente || 'Não informado'}`);
    if (order.endereco) lines.push(`Endereço: ${order.endereco}`);
    lines.push('');
    lines.push(`Pedido: ${order.pedido || 'Não informado'}`);
    if (order.observacoes) lines.push(`Obs: ${order.observacoes}`);
    lines.push('');
    if (order.tipo_pagamento) lines.push(`Pagamento: ${order.tipo_pagamento}`);
    lines.push(`TOTAL: R$ ${order.valor || '0,00'}`);
    lines.push('');
    lines.push('================================');
    
    return lines.join('\n');
  }

  enableAutoprint(): { success: boolean; message: string } {
    this.isEnabled = true;
    this.logger.log('🤖 Auto-impressão ATIVADA');
    return {
      success: true,
      message: 'Auto-impressão ativada'
    };
  }

  disableAutoprint(): { success: boolean; message: string } {
    this.isEnabled = false;
    this.logger.log('⏸️ Auto-impressão DESATIVADA');
    return {
      success: true,
      message: 'Auto-impressão desativada'
    };
  }

  getStatus(): any {
    return {
      enabled: this.isEnabled,
      lastProcessedId: this.lastProcessedId,
      printedOrdersCount: this.printedOrders.size,
      service: 'AutoPrint Monitor',
      timestamp: new Date().toISOString()
    };
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('🛑 Auto-impressão monitor parado');
    }
  }
}
