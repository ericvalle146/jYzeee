import { useState, useCallback } from 'react';
import { printerService, PrinterConfig } from '@/services/printerService';
import { Order } from '@/types/orders';
import { useToast } from './use-toast';
import { CustomLayoutService } from '@/services/customLayoutService';

export interface UsePrinterReturn {
  printing: boolean;
  printingOrderId: number | null;
  printerConnected: boolean;
  checkPrinterStatus: () => Promise<{ connected: boolean; model?: string; status?: string }>;
  printOrder: (order: Order, printerId?: string) => Promise<boolean>;
  printTest: (config?: PrinterConfig) => Promise<boolean>;
  detectPrinters: () => Promise<any[]>;
}

export const usePrinter = (): UsePrinterReturn => {
  const { toast } = useToast();
  const [printing, setPrinting] = useState(false);
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);

  const checkPrinterStatus = useCallback(async () => {
    try {
      const status = await printerService.checkPrinterStatus();
      setPrinterConnected(status.connected);
      return status;
    } catch (error) {
      setPrinterConnected(false);
      throw error;
    }
  }, []);

  const printOrder = useCallback(async (order: Order, printerId?: string): Promise<boolean> => {
    try {
      setPrinting(true);
      setPrintingOrderId(order.id);

      console.log('🔍 VALIDAÇÃO DOS DADOS DO PEDIDO:');
      console.log('================================');
      
      // VALIDAÇÃO RIGOROSA DOS DADOS
      if (!order) {
        throw new Error('Dados do pedido não fornecidos');
      }
      
      if (!order.id) {
        throw new Error('ID do pedido não encontrado');
      }

      // Garantir que todos os campos estão presentes
      const validatedOrder = {
        id: order.id,
        nome_cliente: order.nome_cliente || 'Cliente não informado',
        endereco: order.endereco || '',
        pedido: order.pedido || 'Pedido não especificado',
        valor: Number(order.valor) || 0, // ✅ GARANTIR QUE É NÚMERO
        tipo_pagamento: order.tipo_pagamento || '',
        observacoes: order.observacoes || '',
        status: order.status || 'pendente',
        created_at: order.created_at || new Date().toISOString(),
        impresso: order.impresso || false
      };

      console.log('✅ Dados validados:', validatedOrder);
      console.log('💰 VALOR ESPECÍFICO:', {
        original: order.valor,
        type: typeof order.valor,
        validated: validatedOrder.valor,
        validatedType: typeof validatedOrder.valor
      });
      console.log('================================');

      // Se não foi fornecido printerId, usa uma impressora padrão ou primeira disponível
      if (!printerId) {
        toast({
          title: "Erro",
          description: "Configure suas preferências de impressão",
          variant: "destructive",
        });
        return false;
      }

      // FORÇAR USO DO LAYOUT PERSONALIZADO
      let customLayout = CustomLayoutService.getCustomLayout();
      
      // Se o layout ainda for o padrão, forçar carregamento do localStorage
      if (customLayout.includes('SEU RESTAURANTE') || customLayout.includes('=================================')) {
        console.log('⚠️ Layout padrão detectado, forçando carregamento do localStorage...');
        
        const savedFields = localStorage.getItem('custom-layout-fields');
        if (savedFields) {
          const parsedFields = JSON.parse(savedFields);
          console.log('📋 Campos salvos encontrados:', parsedFields);
          
          // Gerar layout a partir dos campos salvos
          const forcedLayout = parsedFields.map((field: string) => {
            switch (field) {
              case 'nome_cliente':
                return 'CLIENTE: {nome_cliente}';
              case 'endereco':
                return 'ENDEREÇO: {endereco}';
              case 'pedido':
                return 'PEDIDO: {pedido}';
              case 'valor':
                return 'VALOR: {valor}';
              case 'tipo_pagamento':
                return 'PAGAMENTO: {tipo_pagamento}';
              case 'created_at':
                return 'DATA/HORA: {created_at}';
              case 'separator':
                return '===========================';
              default:
                return '';
            }
          }).filter((line: string) => line !== '').join('\n');
          
          customLayout = forcedLayout;
          CustomLayoutService.saveCustomLayout(customLayout);
          console.log('🔥 Layout forçado aplicado:', customLayout);
        }
      }
      
      const processedText = CustomLayoutService.processLayout(validatedOrder, customLayout);

      console.log('🖨️ IMPRIMINDO COM DEBUG COMPLETO:');
      console.log('==================================');
      console.log('📋 DADOS REAIS DO PEDIDO:', {
        id: validatedOrder.id,
        nome_cliente: validatedOrder.nome_cliente,
        endereco: validatedOrder.endereco,
        pedido: validatedOrder.pedido,
        valor: validatedOrder.valor,
        tipo_pagamento: validatedOrder.tipo_pagamento,
        observacoes: validatedOrder.observacoes,
        status: validatedOrder.status,
        created_at: validatedOrder.created_at
      });
      console.log('==================================');
      console.log('📄 Layout usado para impressão:', customLayout);
      console.log('==================================');
      console.log('🖨️ Texto processado final:', processedText);
      console.log('==================================');

      // Criar um order modificado com o texto processado para impressão
      const orderForPrint = {
        ...validatedOrder,
        customLayoutText: processedText
      };

      await printerService.printOrder(printerId, orderForPrint);

      toast({
        title: "✅ Impresso com Sucesso!",
        description: `Pedido #${validatedOrder.id} foi impresso usando seu layout personalizado`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro na Impressão",
        description: error instanceof Error ? error.message : "Falha ao imprimir pedido",
        variant: "destructive",
      });
      return false;
    } finally {
      setPrinting(false);
      setPrintingOrderId(null);
    }
  }, [toast]);

  const printTest = useCallback(async (config?: PrinterConfig): Promise<boolean> => {
    try {
      setPrinting(true);

      const success = await printerService.testPrint(config);

      if (success) {
        toast({
          title: "Sucesso",
          description: "Teste de impressão realizado com sucesso!",
        });
        return true;
      } else {
        throw new Error('Falha no teste de impressão');
      }
    } catch (error) {
      toast({
        title: "Erro no Teste",
        description: error instanceof Error ? error.message : "Falha ao realizar teste de impressão",
        variant: "destructive",
      });
      return false;
    } finally {
      setPrinting(false);
    }
  }, [toast]);

  const detectPrinters = useCallback(async (): Promise<any[]> => {
    try {
      const printers = await printerService.detectPrinters();
      return printers;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao detectar impressoras USB",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  return {
    printing,
    printingOrderId,
    printerConnected,
    checkPrinterStatus,
    printOrder,
    printTest,
    detectPrinters,
  };
};
