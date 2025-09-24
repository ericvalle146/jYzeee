/**
 * 🌐 HOOK PARA IMPRESSÃO VIA IP
 * 
 * Sistema de impressão totalmente via IP - sem dependências locais
 */

import { useState, useCallback, useEffect } from 'react';
import { Order } from '../types/orders';
import { useToast } from './use-toast';

// Configuração do servidor de impressão via IP
const PRINTER_SERVER = {
  ip: '192.168.3.5',
  port: 3003,
  getURL: () => `http://192.168.3.5:3003`
};

export interface IPPrintResult {
  success: boolean;
  message: string;
  method: 'ip-remote';
  needsAuth?: boolean;
  authUrl?: string;
}

export interface IPPrinterStatus {
  available: boolean;
  url: string;
  authorizedIPs: number;
  pendingIPs: number;
  printerName?: string;
  platform?: string;
}

export const useIPPrinter = () => {
  const { toast } = useToast();
  const [printing, setPrinting] = useState(false);
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [serverStatus, setServerStatus] = useState<IPPrinterStatus | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);

  /**
   * 🔍 VERIFICAR STATUS DO SERVIDOR DE IMPRESSÃO
   */
  const checkServerStatus = useCallback(async (forceRefresh = false): Promise<IPPrinterStatus> => {
    // Cache inteligente: não verificar novamente se foi checado há menos de 10s
    const now = Date.now();
    if (!forceRefresh && serverStatus && (now - lastCheck) < 10000) {
      return serverStatus;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Aumentado para 5s

      const response = await fetch(`${PRINTER_SERVER.getURL()}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        const status: IPPrinterStatus = {
          available: data.success === true,
          url: PRINTER_SERVER.getURL(),
          authorizedIPs: data.authorizedIPs || 0,
          pendingIPs: data.pendingIPs || 0,
          printerName: data.printers || 'Detectadas',
          platform: data.platform
        };

        setServerStatus(status);
        setLastCheck(Date.now());
        return status;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Servidor de impressão indisponível: ${error.message}`);
      
      const status: IPPrinterStatus = {
        available: false,
        url: PRINTER_SERVER.getURL(),
        authorizedIPs: 0,
        pendingIPs: 0
      };

      setServerStatus(status);
      setLastCheck(Date.now());
      return status;
    }
  }, []);

  /**
   * 🧪 TESTAR IMPRESSÃO VIA IP
   */
  const testPrint = useCallback(async (): Promise<IPPrintResult> => {
    try {
      const response = await fetch(`${PRINTER_SERVER.getURL()}/test-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "🖨️ Teste via IP executado!",
          description: "A impressora respondeu com sucesso via rede",
        });

        return {
          success: true,
          message: 'Teste de impressão executado com sucesso via IP!',
          method: 'ip-remote'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Falha no teste via IP',
          method: 'ip-remote'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão IP: ${error.message}`,
        method: 'ip-remote'
      };
    }
  }, [toast]);

  /**
   * 🖨️ IMPRIMIR PEDIDO VIA IP (com retry automático)
   */
  const printOrder = useCallback(async (order: Order, retryCount = 0): Promise<IPPrintResult> => {
    const maxRetries = 2;
    
    try {
      setPrinting(true);
      setPrintingOrderId(order.id);

      console.log(`🌐 Iniciando impressão via IP para pedido #${order.id} (tentativa ${retryCount + 1})`);

      // Verificar se servidor está disponível
      const status = await checkServerStatus();
      if (!status.available) {
        if (retryCount < maxRetries) {
          console.log(`🔄 Tentativa ${retryCount + 1} falhou, tentando novamente...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
          return printOrder(order, retryCount + 1);
        }
        throw new Error('Servidor de impressão via IP não está disponível após múltiplas tentativas');
      }

      // Preparar dados do pedido
      const printData = {
        printText: formatOrderForPrint(order),
        orderData: {
          id: order.id,
          nome_cliente: order.nome_cliente,
          endereco: order.endereco,
          valor: order.valor,
          timestamp: new Date().toISOString()
        },
        orderId: order.id,
        userName: 'Sistema Web - IP Print'
      };

      console.log(`📡 Enviando para ${PRINTER_SERVER.getURL()}/print`);

      const response = await fetch(`${PRINTER_SERVER.getURL()}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "🌐 Impresso via IP!",
          description: `Pedido #${order.id} foi impresso via rede (${PRINTER_SERVER.ip})`,
        });

        return {
          success: true,
          message: `Pedido #${order.id} impresso com sucesso via IP!`,
          method: 'ip-remote'
        };
      } else {
        // Verificar se é erro de autorização IP
        if (response.status === 403 && data.error === 'IP_NOT_AUTHORIZED') {
          toast({
            title: "🔐 IP não autorizado",
            description: `Acesse ${data.authUrl || PRINTER_SERVER.getURL()} para autorizar este IP`,
            variant: "destructive",
            duration: 8000
          });

          return {
            success: false,
            message: `IP não autorizado para impressão`,
            method: 'ip-remote',
            needsAuth: true,
            authUrl: data.authUrl || PRINTER_SERVER.getURL()
          };
        }

        throw new Error(data.message || 'Falha na impressão via IP');
      }
    } catch (error) {
      console.error('❌ Erro na impressão via IP:', error);
      
      toast({
        title: "❌ Falha na impressão via IP",
        description: error.message,
        variant: "destructive"
      });

      return {
        success: false,
        message: error.message,
        method: 'ip-remote'
      };
    } finally {
      setPrinting(false);
      setPrintingOrderId(null);
    }
  }, [toast, checkServerStatus]);

  /**
   * 📄 FORMATAR PEDIDO PARA IMPRESSÃO
   */
  const formatOrderForPrint = (order: Order): string => {
    const now = new Date();
    const timestamp = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    
    // Layout melhorado para impressoras térmicas
    return `
╔═══════════════════════════════╗
║         PEDIDO #${order.id.toString().padEnd(13)}║
╚═══════════════════════════════╝

📅 ${timestamp}

👤 CLIENTE:
${order.nome_cliente || 'Não informado'}

📍 ENDEREÇO:
${order.endereco || 'Não informado'}

╔═════════ ITENS DO PEDIDO ═════════╗
${order.pedido || 'Não informado'}
╚═══════════════════════════════════╝

${order.observacoes ? `📝 OBSERVAÇÕES:\n${order.observacoes}\n` : ''}
┌─────────────────────────────────┐
│ 💰 VALOR: R$ ${formatPrice(order.valor).padEnd(17)}│
│ 💳 PAGAMENTO: ${(order.tipo_pagamento || 'Não informado').padEnd(14)}│
└─────────────────────────────────┘

═══════════════════════════════════
Sistema: Impressão via IP
Servidor: ${PRINTER_SERVER.ip}:${PRINTER_SERVER.port}
═══════════════════════════════════
    `.trim();
  };

  /**
   * 💰 FORMATAR PREÇO
   */
  const formatPrice = (value: number | string): string => {
    const numericValue = typeof value === 'number' 
      ? value 
      : parseFloat(String(value)) || 0;
    
    return numericValue.toFixed(2).replace('.', ',');
  };

  /**
   * 🔄 AUTO-VERIFICAR STATUS PERIODICAMENTE
   */
  useEffect(() => {
    // Verificar status imediatamente
    checkServerStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(() => {
      checkServerStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkServerStatus]);

  // Monitorar mudanças de conectividade e mostrar feedback
  useEffect(() => {
    if (serverStatus && lastCheck > 0) {
      if (serverStatus.available) {
        console.log('🌐 Servidor de impressão conectado');
      } else {
        console.log('⚠️ Servidor de impressão desconectado');
      }
    }
  }, [serverStatus?.available, lastCheck]);

  return {
    // Estados
    printing,
    printingOrderId,
    serverStatus,
    
    // Funções
    checkServerStatus,
    testPrint,
    printOrder,
    
    // Utilitários
    isAvailable: serverStatus?.available || false,
    serverURL: PRINTER_SERVER.getURL(),
    serverIP: PRINTER_SERVER.ip,
    lastCheck
  };
};
