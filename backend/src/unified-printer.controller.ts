import { Controller, Get, Post, Body, Param, Logger, Req } from '@nestjs/common';
import { Request } from 'express';
import { UnifiedPrinterService, SystemPrinter, PrintResult } from './unified-printer.service';

@Controller('printer')
export class UnifiedPrinterController {
  private readonly logger = new Logger(UnifiedPrinterController.name);

  constructor(private readonly printerService: UnifiedPrinterService) {}

  /**
   * 🔍 DETECTAR TODAS AS IMPRESSORAS
   */
  @Get('detect')
  async detectPrinters(): Promise<{success: boolean, printers: SystemPrinter[], message: string}> {
    this.logger.log('📡 GET /printer/detect - Detectando todas as impressoras');
    
    try {
      const printers = await this.printerService.detectAllPrinters();
      
      return {
        success: true,
        printers,
        message: `${printers.length} impressora(s) detectada(s)`
      };
    } catch (error) {
      this.logger.error('❌ Erro na detecção:', error);
      return {
        success: false,
        printers: [],
        message: 'Erro ao detectar impressoras'
      };
    }
  }

  /**
   * ⚡ ATIVAR IMPRESSORA
   */
  @Post('activate/:printerId')
  async activatePrinter(@Param('printerId') printerId: string): Promise<PrintResult> {
    this.logger.log(`📡 POST /printer/activate/${printerId}`);
    return await this.printerService.activatePrinter(printerId);
  }

  /**
   * 🖨️ IMPRIMIR PEDIDO
   */
  @Post('print')
  async printOrder(
    @Body() requestData: {
      printerId: string;
      orderData: any;
      printText: string;
    },
    @Req() req: Request
  ): Promise<PrintResult> {
    this.logger.log(`📡 POST /printer/print - Pedido #${requestData.orderData?.id || 'N/A'} na impressora ${requestData.printerId}`);
    
    try {
      if (!requestData.printerId || !requestData.orderData || !requestData.printText) {
        return {
          success: false,
          message: 'Dados incompletos para impressão',
          error: 'printerId, orderData e printText são obrigatórios'
        };
      }

      // Capturar IP do cliente
      const clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      req.ip;

      this.logger.log(`🌐 IP do cliente: ${clientIP}`);

      return await this.printerService.printOrder(
        requestData.printerId,
        requestData.orderData,
        requestData.printText,
        clientIP as string
      );

    } catch (error) {
      this.logger.error('❌ Erro na impressão:', error);
      return {
        success: false,
        message: 'Erro interno na impressão',
        error: error.message
      };
    }
  }

  /**
   * 🧪 TESTE DE IMPRESSÃO
   */
  @Post('test/:printerId')
  async testPrint(@Param('printerId') printerId: string): Promise<PrintResult> {
    this.logger.log(`📡 POST /printer/test/${printerId}`);
    return await this.printerService.testPrint(printerId);
  }

  /**
   * 📊 STATUS GERAL DO SISTEMA
   */
  @Get('status')
  async getStatus(): Promise<{
    success: boolean;
    totalPrinters: number;
    activePrinters: number;
    defaultPrinter?: string;
    systemInfo: any;
  }> {
    this.logger.log('📡 GET /printer/status');
    
    try {
      const printers = await this.printerService.detectAllPrinters();
      const activePrinters = printers.filter(p => p.status === 'online').length;
      const defaultPrinter = printers.find(p => p.isDefault)?.name;

      return {
        success: true,
        totalPrinters: printers.length,
        activePrinters,
        defaultPrinter,
        systemInfo: {
          platform: process.platform,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error('❌ Erro ao obter status:', error);
      return {
        success: false,
        totalPrinters: 0,
        activePrinters: 0,
        systemInfo: {
          platform: process.platform,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      };
    }
  }
}

