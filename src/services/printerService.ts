import { getApiUrl } from '@/config/api';
import { Order } from '../types/orders';
import { PrintLayoutConfig } from '../types/printer';
import { printLayoutService } from './printLayoutService';

interface PrinterDevice {
  name: string;
  vendorId?: number;
  productId?: number;
  manufacturer?: string;
  path?: string;
  platform?: string;
  interface?: string;
  serialNumber?: string;
}

interface PrinterStatus {
  connected: boolean;
  model?: string;
  status?: string;
  platform?: string;
  count?: number;
}

export interface PrinterConfig {
  encoding?: string;
  width?: number;
  charset?: string;
  characterSet?: string;
  vendorId?: number;
  productId?: number;
  devicePath?: string;
}

export interface PrintReceipt {
  order: Order;
  timestamp: string;
  receiptNumber: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    cnpj?: string;
  };
}

class PrinterService {
  private config: PrinterConfig = {
    encoding: 'cp860',
    width: 48,
    characterSet: 'pc860',
  };

  private company = {
    name: 'SellHub - Sistema de Vendas',
    address: 'Rua das Vendas, 123 - Centro',
    phone: '(11) 99999-9999',
  };

  /**
   * Detecta impressoras disponíveis
   */
  async detectPrinters(): Promise<any[]> {
    try {
      // A rota da impressora está em /printer, não em /api/printer
      const response = await fetch('https://api.jyze.space/printer/detect', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao detectar impressoras');
      }

      const data = await response.json();
      
      // A API retorna { success: true, printers: [...] }
      // Mas o frontend espera apenas o array de impressoras
      if (data.success && Array.isArray(data.printers)) {
        return data.printers;
      } else if (Array.isArray(data)) {
        // Fallback se a API retornar diretamente o array
        return data;
      } else {
        console.warn('Formato inesperado da resposta da API:', data);
        return [];
      }
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
      throw error;
    }
  }

  /**
   * Configura a impressora
   */
  setConfig(config: Partial<PrinterConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Imprime um pedido com layout configurado
   */
  async printOrder(printerId: string, orderData: any, customLayout?: PrintLayoutConfig): Promise<void> {
    try {
      console.log('🖨️ Enviando para impressão:', { printerId, orderData });
      
      let printText: string;
      
      // Se tem customLayoutText (vem do SimplePrintLayoutEditor), usa ele
      if (orderData.customLayoutText) {
        printText = orderData.customLayoutText;
        console.log('📄 Usando layout personalizado simples:', printText);
      } else {
        // Usar layout customizado complexo ou o padrão
        const layout = customLayout || printLayoutService.getDefaultLayout();
        
        // Gerar texto formatado usando o layout
        printText = printLayoutService.generatePrintText(orderData, layout, {
          store_name: this.company.name,
          store_address: this.company.address,
          store_phone: this.company.phone,
          footer_message: 'Obrigado pela preferência!'
        });
        console.log('📄 Usando layout complexo/padrão:', printText);
      }
      
      console.log('📄 FRONTEND: Texto final gerado para envio:', printText);
      
      const response = await fetch('https://api.jyze.space/printer/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerId,
          orderData,
          printText, // ⭐ ENVIANDO O TEXTO PERSONALIZADO!
          layout: orderData.customLayoutText ? 'custom-simple' : (customLayout?.name || 'default')
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Falha ao imprimir pedido: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Response result:', result);
      
      if (!result.success) {
        const errorMessage = result.error || result.message || 'Falha ao imprimir';
        
        // Detectar diferentes tipos de erro e dar mensagens mais claras
        if (errorMessage.includes('ENODEV') || errorMessage.includes('no such device')) {
          throw new Error('🔌 Impressora desligada ou desconectada! Verifique se está ligada e conectada via USB.');
        } else if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
          throw new Error('🔒 Sem permissão para acessar a impressora. Verifique as configurações do sistema.');
        } else if (errorMessage.includes('EBUSY') || errorMessage.includes('device busy')) {
          throw new Error('⏳ Impressora ocupada! Aguarde um momento e tente novamente.');
        } else if (errorMessage.includes('timeout')) {
          throw new Error('⏰ Tempo limite excedido. Verifique a conexão da impressora.');
        } else if (errorMessage.includes('Falha ao inicializar')) {
          throw new Error('⚙️ Falha ao inicializar impressora. Verifique se está ligada e configurada corretamente.');
        } else {
          throw new Error(`❌ Erro na impressão: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao imprimir pedido:', error);
      
      // Se for um erro de rede (backend offline)
      if (error.message.includes('fetch')) {
        throw new Error('🌐 Servidor de impressão offline! Verifique se o backend está rodando.');
      }
      
      throw error;
    }
  }

  /**
   * Testa a impressora (imprime página de teste)
   */
  async testPrint(config?: PrinterConfig): Promise<boolean> {
    try {
      const testConfig = { ...this.config, ...config };
      
      const response = await fetch('https://api.jyze.space/printer/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: testConfig
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Test print failed:', error);
      return false;
    }
  }

  async getSystemInfo(): Promise<any> {
    try {
      const response = await fetch('https://api.jyze.space/printer/system-info');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get system info:', error);
      return null;
    }
  }

  /**
   * Verifica status da impressora
   */
  async checkPrinterStatus(): Promise<PrinterStatus> {
    try {
      const response = await fetch('https://api.jyze.space/printer/status');
      if (!response.ok) {
        throw new Error('Falha ao verificar status da impressora');
      }
      const status: PrinterStatus = await response.json();
      return status;
    } catch (error) {
      console.error('[Printer] Erro ao verificar status:', error);
      return { 
        connected: false, 
        status: 'Erro na comunicação',
        platform: 'Desconhecido',
        count: 0
      };
    }
  }

  /**
   * Formata texto para impressão (preview)
   */
  formatOrderForPreview(order: Order): string {
    const lines: string[] = [];
    const width = this.config.width || 48;
    const line = '='.repeat(width);
    
    // Cabeçalho
    lines.push(line);
    lines.push(this.centerText(this.company.name, width));
    lines.push(this.centerText(this.company.address, width));
    lines.push(this.centerText(this.company.phone, width));
    lines.push(line);
    lines.push('');
    
    // Informações do pedido
    lines.push(`PEDIDO #${order.id}`);
    lines.push(`DATA: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
    lines.push(`CLIENTE: ${order.nome_cliente}`);
    lines.push('');
    
    // Endereço
    if (order.endereco) {
      lines.push('ENDERECO:');
      lines.push(this.wrapText(order.endereco, width));
      lines.push('');
    }
    
    // Pedido
    lines.push('PEDIDO:');
    lines.push(this.wrapText(order.pedido || 'Sem descrição', width));
    lines.push('');
    
    // Observações
    if (order.observacoes) {
      lines.push('OBSERVACOES:');
      lines.push(this.wrapText(order.observacoes, width));
      lines.push('');
    }
    
    // Pagamento
    lines.push(`PAGAMENTO: ${order.tipo_pagamento || 'Não informado'}`);
    lines.push('');
    
    // Total
    lines.push(line);
    lines.push(this.rightAlign(`TOTAL: ${this.formatPrice(order.valor)}`, width));
    lines.push(line);
    lines.push('');
    lines.push(this.centerText('OBRIGADO PELA PREFERENCIA!', width));
    lines.push('');
    
    return lines.join('\n');
  }

  private centerText(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  private rightAlign(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    return ' '.repeat(width - text.length) + text;
  }

  private wrapText(text: string, width: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, width));
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  private formatPrice(value: number): string {
    // 🔧 FORMATAÇÃO SIMPLES PARA IMPRESSORA ESC/POS
    // Evitar Intl.NumberFormat que pode gerar caracteres Unicode problemáticos
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
}

export const printerService = new PrinterService();
