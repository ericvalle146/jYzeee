import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { Order } from '../types/orders';

interface ElectronPrinter {
  id: string;
  name: string;
  type: string;
  status: string;
  isDefault: boolean;
}

interface PrintResult {
  success: boolean;
  message: string;
}

export const useElectronPrinter = () => {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<ElectronPrinter[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPrinting, setPrinting] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  // Verificar se estamos no Electron
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectron(true);
      // Auto-detectar impressoras na inicialização
      detectPrinters();
    }
  }, []);

  // Detectar impressoras USB
  const detectPrinters = useCallback(async () => {
    if (!window.electronAPI?.printer) {
      console.log('🌐 APIs de impressão não disponíveis - rodando no navegador');
      return [];
    }

    try {
      setIsDetecting(true);
      console.log('🔍 Detectando impressoras USB...');
      
      const detectedPrinters = await window.electronAPI.printer.detectUSB();
      setPrinters(detectedPrinters);
      
      // Auto-conectar à primeira impressora se nenhuma estiver conectada
      if (detectedPrinters.length > 0 && !connectedPrinter) {
        const defaultPrinter = detectedPrinters.find(p => p.isDefault) || detectedPrinters[0];
        await connectToPrinter(defaultPrinter.id);
      }
      
      console.log(`📋 ${detectedPrinters.length} impressora(s) detectada(s)`);
      return detectedPrinters;

    } catch (error) {
      console.error('❌ Erro ao detectar impressoras:', error);
      toast({
        title: "❌ Erro na detecção",
        description: "Não foi possível detectar impressoras USB",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, [connectedPrinter, toast]);

  // Conectar à impressora
  const connectToPrinter = useCallback(async (printerId: string) => {
    if (!window.electronAPI?.printer) return false;

    try {
      const result = await window.electronAPI.printer.connect(printerId);
      
      if (result.success) {
        setConnectedPrinter(printerId);
        console.log(`🔌 Conectado à impressora: ${printerId}`);
        return true;
      } else {
        console.error('❌ Falha na conexão:', result.message);
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      return false;
    }
  }, []);

  // Teste de impressão
  const testPrint = useCallback(async (): Promise<PrintResult> => {
    if (!window.electronAPI?.printer) {
      return { success: false, message: 'APIs de impressão não disponíveis' };
    }

    if (!connectedPrinter) {
      return { success: false, message: 'Nenhuma impressora conectada' };
    }

    try {
      setPrinting(true);
      
      const result = await window.electronAPI.printer.test();
      
      if (result.success) {
        toast({
          title: "🎉 Teste bem-sucedido!",
          description: "Sua impressora está funcionando perfeitamente",
        });
      } else {
        toast({
          title: "❌ Falha no teste",
          description: result.message,
          variant: "destructive"
        });
      }

      return result;

    } catch (error) {
      const errorMsg = error.message || 'Erro desconhecido no teste';
      toast({
        title: "❌ Erro no teste",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, message: errorMsg };
    } finally {
      setPrinting(false);
    }
  }, [connectedPrinter, toast]);

  // Imprimir pedido
  const printOrder = useCallback(async (order: Order): Promise<PrintResult> => {
    if (!window.electronAPI?.printer) {
      return { success: false, message: 'APIs de impressão não disponíveis - use versão desktop' };
    }

    if (!connectedPrinter) {
      // Tentar detectar e conectar automaticamente
      const printers = await detectPrinters();
      if (printers.length === 0) {
        return { success: false, message: 'Nenhuma impressora detectada' };
      }
    }

    try {
      setPrinting(true);
      console.log(`🖨️ Imprimindo pedido #${order.id}...`);
      
      const result = await window.electronAPI.printer.printOrder(order);
      
      if (result.success) {
        toast({
          title: "🖨️ Pedido impresso!",
          description: `Pedido #${order.id} foi impresso com sucesso`,
        });
        console.log(`✅ Pedido #${order.id} impresso com sucesso`);
      } else {
        toast({
          title: "❌ Falha na impressão",
          description: result.message,
          variant: "destructive"
        });
        console.error(`❌ Falha na impressão do pedido #${order.id}:`, result.message);
      }

      return result;

    } catch (error) {
      const errorMsg = error.message || 'Erro desconhecido na impressão';
      console.error('❌ Erro ao imprimir pedido:', error);
      toast({
        title: "❌ Erro na impressão",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, message: errorMsg };
    } finally {
      setPrinting(false);
    }
  }, [connectedPrinter, detectPrinters, toast]);

  // Status da impressora
  const getPrinterStatus = useCallback(async () => {
    if (!window.electronAPI?.printer) {
      return { connected: false, ready: false };
    }

    try {
      return await window.electronAPI.printer.getStatus();
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { connected: false, ready: false };
    }
  }, []);

  return {
    // Estados
    isElectron,
    printers,
    connectedPrinter,
    isDetecting,
    isPrinting,
    
    // Funções
    detectPrinters,
    connectToPrinter,
    testPrint,
    printOrder,
    getPrinterStatus,
    
    // Informações úteis
    isReady: isElectron && !!connectedPrinter,
    printerCount: printers.length
  };
};
