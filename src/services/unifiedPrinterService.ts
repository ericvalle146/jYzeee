import { API_CONFIG } from '@/config/api';
import { Order } from '../types/orders';
import { printLayoutService } from './printLayoutService';
import { PrintLayoutConfig } from '../types/printer';
import { CustomLayoutService } from './customLayoutService';

export interface SystemPrinter {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive' | 'error';
  isDefault: boolean;
  type: 'system' | 'usb' | 'thermal';
  devicePath?: string;
  description?: string;
  connection?: string;
  canActivate?: boolean;
}

export interface PrintResult {
  success: boolean;
  message: string;
  printerId?: string;
  error?: string;
}

export interface PrinterStatus {
  success: boolean;
  totalPrinters: number;
  activePrinters: number;
  defaultPrinter?: string;
  systemInfo: any;
}

class UnifiedPrinterService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = API_CONFIG.BACKEND_API;
  }

  /**
   * 🔍 DETECTAR TODAS AS IMPRESSORAS DO SISTEMA
   */
  async detectPrinters(): Promise<SystemPrinter[]> {
    try {
      // console.log('🔍 Detectando todas as impressoras do sistema...');
      
      const response = await fetch(`${this.apiUrl}/printer/detect`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na detecção: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // console.log(`✅ ${result.printers.length} impressoras detectadas:`, result.printers);
        return result.printers;
      } else {
        console.error('❌ Falha na detecção:', result.message);
        return [];
      }

    } catch (error) {
      console.error('❌ Erro ao detectar impressoras:', error);
      return [];
    }
  }

  /**
   * ⚡ ATIVAR IMPRESSORA INATIVA COM DIAGNÓSTICO
   */
  async activatePrinter(printerId: string): Promise<PrintResult> {
    try {
      // console.log(`⚡ [Activate] Tentando ativar impressora: ${printerId}`);
      
      const response = await fetch(`${this.apiUrl}/printer/activate/${printerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Activate] Erro HTTP ${response.status}:`, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // console.log(`✅ [Activate] Impressora ativada: ${result.message}`);
      } else {
        console.error(`❌ [Activate] Falha na ativação:`, result);
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao ativar impressora:', error);
      return {
        success: false,
        message: 'Erro de comunicação na ativação',
        error: error.message
      };
    }
  }

  /**
   * 🖨️ IMPRIMIR PEDIDO COM LAYOUT DINÂMICO
   */
  async printOrder(printerId: string, orderData: Order, customLayoutText?: string, layoutId?: string): Promise<PrintResult> {
    try {
      // console.log(`🖨️ Imprimindo pedido ${orderData.id} na impressora ${printerId}`);

      // Gerar texto de impressão usando layout dinâmico
      const rawPrintText = customLayoutText || this.generateDynamicPrintText(orderData, layoutId);
      
      // 🧹 SANITIZAÇÃO FINAL: Remover acentos e sequência indesejada
      const printText = this.sanitizePrintText(rawPrintText, orderData.id);
      
      // console.log('📄 Texto para impressão (layout dinâmico):', printText);

      const response = await fetch(`${this.apiUrl}/printer/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerId,
          orderData,
          printText
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na impressão: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // console.log(`✅ Pedido impresso: ${result.message}`);
      } else {
        console.error(`❌ Falha na impressão: ${result.message}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao imprimir pedido:', error);
      return {
        success: false,
        message: 'Erro de comunicação na impressão',
        error: error.message
      };
    }
  }

  /**
   * 🧪 TESTAR IMPRESSORA COM DIAGNÓSTICO DETALHADO
   */
  async testPrint(printerId: string): Promise<PrintResult> {
    try {
      // console.log(`🧪 [Test] Iniciando teste da impressora: ${printerId}`);
      
      // Primeiro, verificar se a impressora existe
      const printers = await this.detectPrinters();
      const printer = printers.find(p => p.id === printerId);
      
      if (!printer) {
        console.error(`❌ [Test] Impressora não encontrada: ${printerId}`);
        return {
          success: false,
          message: `Impressora ${printerId} não encontrada`,
          error: 'PRINTER_NOT_FOUND'
        };
      }

      // console.log(`📋 [Test] Impressora encontrada:`, {
      //   name: printer.name,
      //   status: printer.status,
      //   type: printer.type,
      //   canActivate: printer.canActivate
      // });

      // Se impressora está inativa, retornar erro em vez de ativar automaticamente
      if (printer.status === 'inactive') {
        console.warn(`⚠️ [Test] Impressora inativa: ${printer.name}`);
        return {
          success: false,
          message: `Impressora ${printer.name} está inativa. Use o botão 'Ativar' para habilitá-la manualmente antes de testar.`,
          error: 'PRINTER_INACTIVE'
        };
      }

      // Executar teste de impressão
      // console.log(`🖨️ [Test] Executando teste de impressão...`);
      const response = await fetch(`${this.apiUrl}/printer/test/${printerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Test] Erro HTTP ${response.status}:`, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // console.log(`✅ [Test] Teste realizado com sucesso: ${result.message}`);
      } else {
        console.error(`❌ [Test] Falha no teste:`, result);
      }

      return result;

    } catch (error) {
      console.error('❌ [Test] Erro geral no teste da impressora:', error);
      return {
        success: false,
        message: `Erro de comunicação no teste: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 📊 OBTER STATUS DO SISTEMA
   */
  async getStatus(): Promise<PrinterStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/printer/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro no status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      return {
        success: false,
        totalPrinters: 0,
        activePrinters: 0,
        systemInfo: {
          error: error.message
        }
      };
    }
  }

  /**
   * 📄 GERAR TEXTO DINÂMICO PARA IMPRESSÃO COM FALLBACK ROBUSTO
   * Utiliza as configurações de layout da página "Configurar Layout"
   */
  private generateDynamicPrintText(order: Order, layoutId?: string): string {
    try {
      let layout: PrintLayoutConfig | null = null;

      // 🎯 PRIORIDADE 1: Usar layout específico se fornecido
      if (layoutId) {
        layout = printLayoutService.getLayout(layoutId);
        if (layout) {
          // console.log(`🎨 Usando layout específico: ${layout.name} (ID: ${layout.id})`);
        } else {
          console.warn(`⚠️ Layout específico ${layoutId} não encontrado, usando padrão`);
        }
      }

      // 🎯 PRIORIDADE 2: Verificar se existe layout customizado com placeholders
      if (!layout) {
        const customLayout = CustomLayoutService.getCustomLayout();
        const isDefaultCustomLayout = customLayout.includes('SEU RESTAURANTE') && customLayout.includes('PEDIDO #{id}');
        
        if (!isDefaultCustomLayout) {
          // console.log(`🎨 Usando layout customizado com placeholders`);
          const processedText = CustomLayoutService.processLayout(order, customLayout);
          // console.log('✅ Texto gerado com CustomLayoutService (placeholders)');
          return processedText;
        }
      }

      // 🎯 PRIORIDADE 3: Se não encontrou layout específico nem customizado, usar padrão
      if (!layout) {
        layout = printLayoutService.getDefaultLayout();
        // console.log(`🏠 Usando layout padrão: ${layout.name} (ID: ${layout.id})`);
      }

      if (!layout) {
        throw new Error('Nenhum layout disponível');
      }

      // Gerar texto usando o serviço de layout
      const dynamicText = printLayoutService.generatePrintText(order, layout);
      
      // console.log('✅ Texto gerado dinamicamente com base nas configurações');
      return dynamicText;

    } catch (error) {
      console.error('❌ ERRO na geração dinâmica, usando fallback:', error);
      
      // FALLBACK ROBUSTO: Layout mínimo funcional
      if (error instanceof RangeError || error.message.includes('Maximum call stack')) {
        console.warn('🔄 Detectado stack overflow, usando fallback de emergência');
        return this.generateEmergencyFallbackText(order);
      }
      
      // Para outros erros, tentar fallback simples
      try {
        return this.generateEmergencyFallbackText(order);
      } catch (fallbackError) {
        console.error('❌ Falha crítica no fallback:', fallbackError);
        throw new Error(`Falha total na impressão: ${error.message}`);
      }
    }
  }

  /**
   * 🧹 SANITIZAÇÃO FINAL DO TEXTO DE IMPRESSÃO
   * Remove acentos, caracteres especiais e sequência indesejada \x1DV\x41\x03
   */
  private sanitizePrintText(text: string, orderId: number): string {
    let sanitized = text;
    let accentosRemovidos = false;
    let seqRemovida = false;

    // 1. Remover sequência indesejada \x1DV\x41\x03 e variações
    const originalLength = sanitized.length;
    sanitized = sanitized.replace(/\\x1DV\\x41\\x03/g, '');
    sanitized = sanitized.replace(/\x1D\x56\x41\x03/g, '');
    sanitized = sanitized.replace(/\\x1D V \\x41 \\x03/g, '');
    sanitized = sanitized.replace(/0x1D0x56\w*/g, '');
    if (sanitized.length !== originalLength) {
      seqRemovida = true;
    }

    // 2. Normalizar acentos e diacríticos
    const accentMap: { [key: string]: string } = {
      'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n',
      'Á': 'A', 'À': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
      'Ó': 'O', 'Ò': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C', 'Ñ': 'N'
    };

    const beforeAccents = sanitized;
    for (const [accented, normal] of Object.entries(accentMap)) {
      sanitized = sanitized.replace(new RegExp(accented, 'g'), normal);
    }
    if (sanitized !== beforeAccents) {
      accentosRemovidos = true;
    }

    // 3. Substituir caracteres especiais problemáticos
    sanitized = sanitized.replace(/[""]/g, '"');  // Smart quotes
    sanitized = sanitized.replace(/['']/g, "'");  // Smart apostrophes
    sanitized = sanitized.replace(/[–—]/g, '-');  // Em/en dash
    sanitized = sanitized.replace(/[…]/g, '...');  // Ellipsis

    // 4. Remover caracteres de controle não imprimíveis (exceto \n, \r)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 5. Limpar barras/escapes problemáticos mantendo legibilidade
    sanitized = sanitized.replace(/\\x[0-9A-Fa-f]{2}/g, '');  // Remove hex escapes
    sanitized = sanitized.replace(/\\[^nr]/g, ' ');  // Remove escapes exceto \n \r

    // Log de sanitização
    if (accentosRemovidos || seqRemovida) {
      // console.log(`sanitizacao_impressao: pedido=${orderId}, acentos_removidos=${accentosRemovidos}, seq_removida=${seqRemovida}`);
    }

    return sanitized;
  }

  /**
   * 🚨 FALLBACK DE EMERGÊNCIA - Layout mínimo funcional
   */
  private generateEmergencyFallbackText(order: Order): string {
    // console.log('🚨 Usando layout de emergencia para impressão');
    
    const lines = [];
    lines.push('='.repeat(32));
    lines.push('    PEDIDO DE ENTREGA');
    lines.push('='.repeat(32));
    lines.push('');
    lines.push(`Pedido: #${order.id}`);
    lines.push(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('CLIENTE:');
    lines.push(order.nome_cliente || 'Nao informado');
    if (order.endereco) {
      lines.push(`Endereco: ${order.endereco}`);
    }
    lines.push('');
    lines.push('PEDIDO:');
    lines.push(order.pedido || 'Nao informado');
    if (order.observacoes) {
      lines.push(`Obs: ${order.observacoes}`);
    }
    lines.push('');
    lines.push('-'.repeat(32));
    if (order.tipo_pagamento) {
      lines.push(`Pagamento: ${order.tipo_pagamento}`);
    }
    lines.push(`TOTAL: R$ ${order.valor || '0,00'}`);
    lines.push('='.repeat(32));
    lines.push('  Obrigado pela preferencia!');
    lines.push('='.repeat(32));
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * ❌ REMOVIDO: Fallback hardcoded eliminado completamente
   * Sistema agora FALHA se não houver configuração dinâmica
   */

  /**
   * 🔄 VERIFICAR CONEXÃO COM BACKEND
   */
  async checkConnection(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.success;
    } catch (error) {
      return false;
    }
  }
}

export const unifiedPrinterService = new UnifiedPrinterService();

