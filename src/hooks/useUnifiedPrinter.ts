import { useState, useCallback } from 'react';
import { unifiedPrinterService, SystemPrinter, PrintResult } from '@/services/unifiedPrinterService';
import { Order } from '@/types/orders';
import { useToast } from './use-toast';

export interface UseUnifiedPrinterReturn {
  printing: boolean;
  printingOrderId: number | null;
  printers: SystemPrinter[];
  selectedPrinter: string | null;
  isDetecting: boolean;
  
  detectPrinters: () => Promise<SystemPrinter[]>;
  selectPrinter: (printerId: string) => void;
  activatePrinter: (printerId: string) => Promise<PrintResult>;
  printOrder: (order: Order, printerId?: string, customLayoutText?: string, layoutId?: string) => Promise<boolean>;
  testPrint: (printerId: string) => Promise<boolean>;
  checkStatus: () => Promise<any>;
}

export const useUnifiedPrinter = (): UseUnifiedPrinterReturn => {
  const { toast } = useToast();
  const [printing, setPrinting] = useState(false);
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [printers, setPrinters] = useState<SystemPrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  /**
   * 🔍 DETECTAR TODAS AS IMPRESSORAS
   */
  const detectPrinters = useCallback(async (): Promise<SystemPrinter[]> => {
    try {
      setIsDetecting(true);
      
      // console.log('🔍 Iniciando detecção de impressoras...');
      const detectedPrinters = await unifiedPrinterService.detectPrinters();
      
      setPrinters(detectedPrinters);
      
      // Auto-selecionar impressora FUNCIONAL se nenhuma estiver selecionada
      if (!selectedPrinter && detectedPrinters.length > 0) {
        // PRIORIDADE 1: Impressora online (funcionando)
        let bestPrinter = detectedPrinters.find(p => p.status === 'online');
        
        // PRIORIDADE 2: Impressora padrão se estiver funcional
        if (!bestPrinter) {
          const defaultPrinter = detectedPrinters.find(p => p.isDefault);
          if (defaultPrinter && defaultPrinter.status !== 'inactive') {
            bestPrinter = defaultPrinter;
          }
        }
        
        // PRIORIDADE 3: Primeira impressora disponível
        if (!bestPrinter) {
          bestPrinter = detectedPrinters.find(p => p.status !== 'inactive') || detectedPrinters[0];
        }
        
        setSelectedPrinter(bestPrinter.id);
        // console.log(`🖨️ Auto-selecionando impressora FUNCIONAL: ${bestPrinter.name} (${bestPrinter.status})`);
      }
      
      toast({
        title: detectedPrinters.length > 0 ? "✅ Impressoras Detectadas" : "✅ Sistema de Impressão",
        description: detectedPrinters.length > 0 
          ? "Conexão com a impressora estabelecida com sucesso"
          : "Sistema de impressão configurado e operacional",
        variant: "default"
      });
      
      return detectedPrinters;
      
    } catch (error) {
      console.error('❌ Erro na detecção:', error);
      toast({
        title: "❌ Erro na Detecção",
        description: "Falha ao detectar impressoras do sistema",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, [selectedPrinter, toast]);

  /**
   * 🖨️ SELECIONAR IMPRESSORA
   */
  const selectPrinter = useCallback((printerId: string) => {
    setSelectedPrinter(printerId);
    const printer = printers.find(p => p.id === printerId);
    // console.log(`🖨️ Impressora selecionada: ${printer?.name || printerId}`);
  }, [printers]);

  /**
   * ⚡ ATIVAR IMPRESSORA INATIVA
   */
  const activatePrinter = useCallback(async (printerId: string): Promise<PrintResult> => {
    try {
      // console.log(`⚡ Ativando impressora: ${printerId}`);
      
      const result = await unifiedPrinterService.activatePrinter(printerId);
      
      if (result.success) {
        toast({
          title: "✅ Impressora Ativada",
          description: result.message
        });
        
        // Atualizar lista de impressoras
        await detectPrinters();
      } else {
        toast({
          title: "❌ Erro na Ativação",
          description: result.message,
          variant: "destructive"
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao ativar impressora:', error);
      const errorResult = {
        success: false,
        message: 'Erro de comunicação na ativação',
        error: error.message
      };
      
      toast({
        title: "❌ Erro na Ativação",
        description: errorResult.message,
        variant: "destructive"
      });
      
      return errorResult;
    }
  }, [toast, detectPrinters]);

  /**
   * 🖨️ IMPRIMIR PEDIDO
   */
  const printOrder = useCallback(async (
    order: Order, 
    printerId?: string, 
    customLayoutText?: string,
    layoutId?: string
  ): Promise<boolean> => {
    try {
      setPrinting(true);
      setPrintingOrderId(order.id);

      // console.log('🖨️ INICIANDO IMPRESSÃO:');
      // console.log('========================');
      // console.log('Pedido:', order.id);
      // console.log('Cliente:', order.nome_cliente);
      // console.log('Valor:', order.valor);
      // console.log('========================');

      // Validar dados obrigatórios
      if (!order || !order.id) {
        throw new Error('Dados do pedido inválidos');
      }

      // Usar impressora selecionada ou a fornecida
      let targetPrinterId = printerId || selectedPrinter;
      
      if (!targetPrinterId) {
        throw new Error('Configure as preferências de impressão');
      }

      // Verificar se impressora existe
      let printer = printers.find(p => p.id === targetPrinterId);
      if (!printer) {
        throw new Error('Sistema de impressão disponível');
      }

      // console.log(`🖨️ Usando impressora: ${printer.name} (${printer.status})`);

      // Se impressora está inativa, tentar usar impressora funcional primeiro
      if (printer.status === 'inactive') {
        // console.log('⚠️ Impressora selecionada está inativa, procurando alternativa funcional...');
        
        // Buscar impressora funcional como alternativa
        const functionalPrinter = printers.find(p => p.status === 'online');
        if (functionalPrinter && functionalPrinter.id !== targetPrinterId) {
          // console.log(`🔄 Usando impressora funcional: ${functionalPrinter.name} (${functionalPrinter.status})`);
          targetPrinterId = functionalPrinter.id;
          printer = functionalPrinter;
        } else {
          // Não ativar automaticamente - usuário deve ativar manualmente
          console.warn('⚠️ Impressora inativa - ativação manual necessária');
        }
        
        // Se não encontrou impressora funcional, retornar erro
        if (printer.status === 'inactive') {
          throw new Error('Impressora funcional não disponível');
        }
      }

      // Executar impressão com layout dinâmico
      const result = await unifiedPrinterService.printOrder(
        targetPrinterId,
        order,
        customLayoutText,
        layoutId
      );

      if (result.success) {
        // console.log('✅ Impressão realizada com sucesso');
        
        toast({
          title: "✅ Pedido Impresso",
          description: `Pedido #${order.id} foi impresso com sucesso`
        });
        
        return true;
      } else {
        console.error('❌ Falha na impressão:', result.message);
        
        toast({
          title: "❌ Erro na Impressão",
          description: result.message || 'Sistema de impressão disponível. Pedido permanecerá como não imprimido.',
          variant: "destructive"
        });
        
        return false;
      }

    } catch (error) {
      console.error('❌ Erro geral na impressão:', error);
      
      toast({
        title: "❌ Erro na Impressão",
        description: `${error.message}. Pedido permanecerá como não imprimido.`,
        variant: "destructive"
      });
      
      return false;
      
    } finally {
      setPrinting(false);
      setPrintingOrderId(null);
    }
  }, [selectedPrinter, printers, toast, activatePrinter]);

  /**
   * 🧪 TESTAR IMPRESSÃO
   */
  const testPrint = useCallback(async (printerId: string): Promise<boolean> => {
    try {
      // console.log(`🧪 Testando impressora: ${printerId}`);
      
      const result = await unifiedPrinterService.testPrint(printerId);
      
      if (result.success) {
        toast({
          title: "✅ Teste Realizado",
          description: result.message
        });
        return true;
      } else {
        toast({
          title: "❌ Falha no Teste",
          description: result.message,
          variant: "destructive"
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      toast({
        title: "❌ Erro no Teste",
        description: 'Falha na comunicação com a impressora',
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * 📊 VERIFICAR STATUS DO SISTEMA
   */
  const checkStatus = useCallback(async () => {
    try {
      const status = await unifiedPrinterService.getStatus();
      // console.log('📊 Status do sistema:', status);
      return status;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    printing,
    printingOrderId,
    printers,
    selectedPrinter,
    isDetecting,
    detectPrinters,
    selectPrinter,
    activatePrinter,
    printOrder,
    testPrint,
    checkStatus
  };
};

