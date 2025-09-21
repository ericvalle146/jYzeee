import { Controller, Post, Get, Body, Logger, BadRequestException } from '@nestjs/common';
import { PrinterService, PrintReceipt, PrinterConfig } from './printer.service';

@Controller('printer')
export class PrinterController {
  private readonly logger = new Logger(PrinterController.name);

  constructor(private readonly printerService: PrinterService) {}

  @Get('detect')
  async detectPrinters() {
    try {
      const printers = await this.printerService.detectPrinters();
      return { success: true, printers };
    } catch (error) {
      this.logger.error('Erro ao detectar impressoras:', error);
      return { success: false, error: error.message };
    }
  }

  @Get('status')
  async checkStatus() {
    try {
      const status = await this.printerService.checkStatus();
      return { success: true, ...status };
    } catch (error) {
      this.logger.error('Erro ao verificar status:', error);
      return { success: false, connected: false };
    }
  }

  @Post('print-order')
  async printOrder(@Body() body: { receipt: PrintReceipt; config?: PrinterConfig }) {
    try {
      const { receipt, config } = body;
      
      if (!receipt) {
        return { success: false, error: 'Dados do recibo não fornecidos' };
      }

      const result = await this.printerService.printReceipt(receipt, config);
      
      if (result) {
        this.logger.log(`Pedido #${receipt.order.id} impresso com sucesso`);
        return { success: true, message: 'Pedido impresso com sucesso' };
      } else {
        return { success: false, error: 'Falha na impressão' };
      }
    } catch (error) {
      this.logger.error('Erro ao imprimir pedido:', error);
      return { success: false, error: error.message };
    }
  }

  @Post('print')
  async printOrderSimple(@Body() body: { printerId: string; orderData: any; printText?: string; layout?: string }) {
    try {
      const { printerId, orderData, printText, layout } = body;
      
      if (!printerId || !orderData) {
        return { success: false, error: 'PrinterId e orderData são obrigatórios' };
      }

      // Log da requisição para debug
      this.logger.log(`🖨️ BACKEND: Recebendo impressão com layout personalizado:`);
      this.logger.log(`PrinterId: ${printerId}, OrderId: ${orderData.id}`);
      this.logger.log(`Layout type: ${layout || 'padrão'}`);
      this.logger.log(`Custom printText presente: ${!!printText}`);
      this.logger.log(`📋 DADOS REAIS DO PEDIDO RECEBIDOS:`);
      this.logger.log(`  - ID: ${orderData.id}`);
      this.logger.log(`  - Cliente: ${orderData.nome_cliente}`);
      this.logger.log(`  - Endereço: ${orderData.endereco || orderData.endereço || '(vazio)'}`);
      this.logger.log(`  - Pedido: ${orderData.pedido}`);
      this.logger.log(`  - Valor: ${orderData.valor}`);
      this.logger.log(`  - Pagamento: ${orderData.tipo_pagamento}`);
      this.logger.log(`  - Observações: ${orderData.observacoes || orderData.observações || '(vazio)'}`);
      this.logger.log(`  - Status: ${orderData.status}`);
      this.logger.log(`  - Data: ${orderData.created_at}`);
      if (printText) {
        this.logger.log(`📄 TEXTO PERSONALIZADO RECEBIDO (primeiras 200 chars):`);
        this.logger.log(printText.substring(0, 200) + (printText.length > 200 ? '...' : ''));
      }

      // Buscar configuração da impressora baseada no printerId
      const printerIdStr = String(printerId); // Converter para string
      let devicePath: string;
      
      // Mapear printerId para o dispositivo correto
      if (printerIdStr.includes('usblp') || printerIdStr.includes('LP1')) {
        devicePath = '/dev/usb/lp1';
      } else if (printerIdStr === '2' || printerIdStr.includes('USB-ESCPOS')) {
        devicePath = '/dev/usb/lp1'; // Usar dispositivo padrão
      } else {
        devicePath = '/dev/usb/lp1'; // Fallback para dispositivo padrão
      }
      
      const config: PrinterConfig = {
        encoding: 'utf8',
        width: 48,
        devicePath: devicePath
      };

      this.logger.log(`Configuração da impressora: ${JSON.stringify(config)}`);

      // Se tem printText personalizado, usa impressão customizada
      if (printText) {
        this.logger.log(`🔥 USANDO LAYOUT PERSONALIZADO PARA IMPRESSÃO!`);
        const result = await this.printerService.printCustomText(printText, config);
        
        if (result) {
          this.logger.log(`✅ Pedido #${orderData.id} impresso com LAYOUT PERSONALIZADO na impressora ${printerId}`);
          return { success: true, message: 'Pedido impresso com layout personalizado!' };
        } else {
          return { success: false, error: 'Falha na impressão customizada' };
        }
      } else {
        // Fallback para método padrão
        this.logger.log(`📄 Usando layout padrão (sem customização)`);
        
        // Converter orderData para formato PrintReceipt
        const receipt: PrintReceipt = {
          order: orderData,
          timestamp: new Date().toISOString(),
          receiptNumber: `${orderData.id}-${Date.now()}`,
          company: {
            name: 'SellHub - Sistema de Vendas',
            address: 'Rua das Vendas, 123 - Centro',
            phone: '(11) 99999-9999',
          }
        };

        const result = await this.printerService.printReceipt(receipt, config);
        
        if (result) {
          this.logger.log(`Pedido #${orderData.id} impresso com sucesso na impressora ${printerId}`);
          return { success: true, message: 'Pedido impresso com sucesso' };
        } else {
          return { success: false, error: 'Falha na impressão' };
        }
      }
    } catch (error) {
      this.logger.error('Erro ao imprimir pedido:', error);
      return { success: false, error: error.message };
    }
  }

    @Get('system-info')
  async getSystemInfo() {
    try {
      const systemInfo = await this.printerService.getSystemInfo();
      return systemInfo;
    } catch (error) {
      this.logger.error('Erro ao obter informações do sistema:', error);
      throw new BadRequestException('Falha ao obter informações do sistema');
    }
  }

  @Post('test')
  async testPrint(@Body() body: { config?: any }) {
    try {
      const { config } = body;
      const success = await this.printerService.testPrint(config);
      return { success };
    } catch (error) {
      this.logger.error('Erro no teste de impressão:', error);
      throw new BadRequestException('Falha no teste de impressão');
    }
  }
}
