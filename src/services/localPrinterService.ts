/**
 * 🖨️ SERVIÇO DE IMPRESSÃO LOCAL VIA IP
 * 
 * Integra com o novo sistema de impressão local configurado
 * Usa as configurações do printer.config.js
 */

import { Order } from '../types/orders';
import { PrintResult } from './unifiedPrinterService';

// Configuração dinâmica baseada no ambiente
const getPrinterConfig = () => {
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const isElectron = typeof window !== 'undefined' && typeof window.process === 'object';
  
  if (isProduction && !isElectron) {
    // Em produção na VPS - Comunicação via IP direto (não domínio)
    return {
      network: {
        localIP: window.location.hostname,
        port: 3003,
      },
      getLocalURL(): string {
        return `${window.location.protocol}//${window.location.hostname}:3003`;
      }
    };
  }
  
  // Desenvolvimento local
  return {
    network: {
      localIP: '192.168.3.5',
      port: 3003,
    },
    getLocalURL(): string {
      return `http://${this.network.localIP}:${this.network.port}`;
    }
  };
};

const PRINTER_CONFIG = getPrinterConfig();

export interface LocalPrintResult {
  success: boolean;
  message: string;
  method?: 'local-ip' | 'fallback';
  error?: string;
}

class LocalPrinterService {
  private readonly localURL: string;

  constructor() {
    this.localURL = PRINTER_CONFIG.getLocalURL();
  }

  /**
   * 🔍 VERIFICAR SE SERVIÇO LOCAL ESTÁ DISPONÍVEL
   */
  async checkLocalService(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.localURL}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.success === true;
      }
      
      return false;
    } catch (error) {
      console.log('⚠️ Serviço local de impressão não disponível:', error.message);
      return false;
    }
  }

  /**
   * 🧪 TESTAR IMPRESSÃO LOCAL
   */
  async testPrint(): Promise<LocalPrintResult> {
    try {
      const response = await fetch(`${this.localURL}/test-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: 'Teste de impressão executado com sucesso!',
          method: 'local-ip'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Falha no teste de impressão',
          error: 'TEST_FAILED'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao testar impressão: ${error.message}`,
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * 🖨️ IMPRIMIR PEDIDO VIA IP LOCAL
   */
  async printOrder(order: Order): Promise<LocalPrintResult> {
    try {
      // Verificar se serviço está disponível primeiro
      const serviceAvailable = await this.checkLocalService();
      if (!serviceAvailable) {
        return {
          success: false,
          message: 'Serviço local de impressão não está rodando',
          error: 'SERVICE_UNAVAILABLE'
        };
      }

      // Preparar dados do pedido para impressão
      const printData = {
        printText: this.formatOrderForPrint(order),
        orderData: {
          id: order.id,
          nome_cliente: order.nome_cliente,
          endereco: order.endereco,
          valor: order.valor,
          timestamp: new Date().toISOString()
        },
        orderId: order.id,
        userName: 'Sistema Web'
      };

      console.log('🖨️ Enviando para impressão local:', {
        url: `${this.localURL}/print`,
        orderId: order.id,
        cliente: order.nome_cliente
      });

      const response = await fetch(`${this.localURL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: `Pedido #${order.id} impresso com sucesso via IP local!`,
          method: 'local-ip'
        };
      } else {
        // Verificar se é erro de autorização IP
        if (response.status === 403 && data.error === 'IP_NOT_AUTHORIZED') {
          return {
            success: false,
            message: `IP não autorizado. Acesse ${data.authUrl || this.localURL} para autorizar.`,
            error: 'IP_NOT_AUTHORIZED'
          };
        }

        return {
          success: false,
          message: data.message || 'Falha na impressão local',
          error: 'PRINT_FAILED'
        };
      }
    } catch (error) {
      console.error('❌ Erro na impressão local:', error);
      return {
        success: false,
        message: `Erro de conexão: ${error.message}`,
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * 📄 FORMATAR PEDIDO PARA IMPRESSÃO
   */
  private formatOrderForPrint(order: Order): string {
    const now = new Date();
    
    return `
═══════════════════════════════
        PEDIDO #${order.id}
═══════════════════════════════

📅 ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}

👤 CLIENTE: ${order.nome_cliente || 'Não informado'}
📍 ENDEREÇO: ${order.endereco || 'Não informado'}

📦 PEDIDO:
${order.pedido || 'Não informado'}

${order.observacoes ? `📝 OBSERVAÇÕES:\n${order.observacoes}\n` : ''}
💰 VALOR: R$ ${this.formatPrice(order.valor)}
💳 PAGAMENTO: ${order.tipo_pagamento || 'Não informado'}

═══════════════════════════════
    Impresso via Sistema Web
    IP: ${PRINTER_CONFIG.network.localIP}
═══════════════════════════════
    `.trim();
  }

  /**
   * 💰 FORMATAR PREÇO
   */
  private formatPrice(value: number | string): string {
    const numericValue = typeof value === 'number' 
      ? value 
      : parseFloat(String(value)) || 0;
    
    return numericValue.toFixed(2).replace('.', ',');
  }

  /**
   * 📊 OBTER STATUS DO SERVIÇO
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    url: string;
    status?: any;
    error?: string;
  }> {
    try {
      const available = await this.checkLocalService();
      
      if (!available) {
        return {
          available: false,
          url: this.localURL,
          error: 'Serviço não está respondendo'
        };
      }

      const response = await fetch(`${this.localURL}/status`);
      const status = await response.json();

      return {
        available: true,
        url: this.localURL,
        status
      };
    } catch (error) {
      return {
        available: false,
        url: this.localURL,
        error: error.message
      };
    }
  }
}

// Exportar instância única
export const localPrinterService = new LocalPrinterService();
