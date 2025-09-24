import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../config/app.config';
import type { Order } from '../types/orders';

interface SSHPrinterStatus {
  isAvailable: boolean;
  isConnected: boolean;
  lastCheck: Date | null;
  error: string | null;
}

interface PrintResult {
  success: boolean;
  message: string;
  needsAuth?: boolean;
  authUrl?: string;
}

interface SSHPrinterInfo {
  name: string;
  status: 'online' | 'offline' | 'error';
  connection: string;
  description: string;
}

export const useSSHPrinter = () => {
  const [status, setStatus] = useState<SSHPrinterStatus>({
    isAvailable: false,
    isConnected: false,
    lastCheck: null,
    error: null
  });

  const [printerInfo, setPrinterInfo] = useState<SSHPrinterInfo>({
    name: 'SSH Printer',
    status: 'offline',
    connection: 'SSH eric@192.168.3.5',
    description: 'Impressora via SSH'
  });

  // Usar sempre o backend da VPS para comunicação SSH
  const getBackendUrl = () => APP_CONFIG.services.backend.url;

  /**
   * 🔗 VERIFICAR STATUS DA CONEXÃO SSH
   */
  const checkSSHStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getBackendUrl()}/printer/test-ssh`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(APP_CONFIG.services.backend.timeout)
      });

      if (response.ok) {
        const result = await response.json();
        
        setStatus(prev => ({
          ...prev,
          isAvailable: true,
          isConnected: result.success,
          lastCheck: new Date(),
          error: result.success ? null : result.message
        }));

        setPrinterInfo(prev => ({
          ...prev,
          status: result.success ? 'online' : 'error'
        }));

        return result.success;
      } else {
        throw new Error(`Backend não disponível: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro de conexão';
      
      setStatus(prev => ({
        ...prev,
        isAvailable: false,
        isConnected: false,
        lastCheck: new Date(),
        error: errorMessage
      }));

      setPrinterInfo(prev => ({
        ...prev,
        status: 'error'
      }));

      console.error('🔴 SSH Status Check failed:', error);
      return false;
    }
  }, []);

  /**
   * 🖨️ IMPRIMIR PEDIDO VIA SSH
   */
  const printOrderViaSSH = useCallback(async (order: Order, retryCount = 0): Promise<PrintResult> => {
    try {
      console.log(`🚀 Enviando pedido #${order.id} para impressão SSH (tentativa ${retryCount + 1})`);
      
      const printText = formatOrderForPrinting(order);
      
      const response = await fetch(`${getBackendUrl()}/printer/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerId: 'ssh_printer',
          orderData: order,
          printText: printText
        }),
        signal: AbortSignal.timeout(APP_CONFIG.services.backend.timeout)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Pedido #${order.id} impresso via SSH:`, result.message);
          return {
            success: true,
            message: result.message
          };
        } else {
          throw new Error(result.message || 'Falha na impressão SSH');
        }
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`🔴 Erro na impressão SSH (tentativa ${retryCount + 1}):`, error);
      
      // Retry logic
      if (retryCount < APP_CONFIG.services.backend.retries) {
        console.log(`🔄 Tentando novamente em 2 segundos... (${retryCount + 1}/${APP_CONFIG.services.backend.retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return printOrderViaSSH(order, retryCount + 1);
      }
      
      return {
        success: false,
        message: error.message || 'Falha na impressão SSH após múltiplas tentativas'
      };
    }
  }, []);

  /**
   * 🧪 TESTE DE IMPRESSÃO SSH
   */
  const testSSHPrint = useCallback(async (): Promise<PrintResult> => {
    try {
      console.log('🧪 Iniciando teste de impressão SSH');
      
      const response = await fetch(`${getBackendUrl()}/printer/test/ssh_printer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(APP_CONFIG.services.backend.timeout)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: result.success,
          message: result.message || 'Teste de impressão SSH concluído'
        };
      } else {
        throw new Error(`Erro HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('🔴 Erro no teste SSH:', error);
      return {
        success: false,
        message: error.message || 'Falha no teste de impressão SSH'
      };
    }
  }, []);

  /**
   * 📄 FORMATAR PEDIDO PARA IMPRESSÃO
   */
  const formatOrderForPrinting = (order: Order): string => {
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    
    return `=================
   PEDIDO #${order.id}
=================
Cliente: ${order.customer_name || 'N/A'}
Telefone: ${order.customer_phone || 'N/A'}
Endereço: ${order.customer_address || 'N/A'}

ITENS:
${order.items?.map(item => 
  `- ${item.name} x${item.quantity} - R$ ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}`
).join('\n') || 'Nenhum item'}

TOTAL: R$ ${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
Data: ${createdAt.toLocaleString('pt-BR')}
=================

`;
  };

  /**
   * 🔄 AUTO-CHECK PERIÓDICO
   */
  useEffect(() => {
    // Check inicial
    checkSSHStatus();
    
    // Check periódico a cada 30 segundos
    const interval = setInterval(checkSSHStatus, APP_CONFIG.services.printer.healthCheckInterval);
    
    return () => clearInterval(interval);
  }, [checkSSHStatus]);

  return {
    // Status
    isAvailable: status.isAvailable && status.isConnected,
    isConnected: status.isConnected,
    lastCheck: status.lastCheck,
    error: status.error,
    
    // Printer Info
    printerInfo,
    
    // Actions
    checkStatus: checkSSHStatus,
    printOrderViaSSH,
    testPrint: testSSHPrint,
    
    // Server Info
    serverInfo: `Backend: ${getBackendUrl()}`
  };
};

export default useSSHPrinter;
