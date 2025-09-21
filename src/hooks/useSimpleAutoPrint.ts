import { useState, useEffect, useRef, useCallback } from 'react';
import { Order, isOrderComplete } from '../types/orders';

export interface AutoPrintHookReturn {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  toggleAutoPrint: () => void; // Nova função para controle ON/OFF
  isProcessing: boolean;
  lastPrintedId: number | null;
  printQueueSize: number;
  activationTimestamp: string | null; // Timestamp de quando foi ativado
  reset: () => void;
  addToQueue: (orderId: number) => void;
}

export const useSimpleAutoPrint = (
  orders: Order[],
  selectedPrinter: string | null,
  updatePrintStatus: (orderId: number, isPrinted: boolean) => Promise<any>,
  showToast: (toast: any) => void,
  printOrderFunction: (order: Order, printerId: string) => Promise<boolean> // USAR A FUNÇÃO REAL DE IMPRESSÃO!
): AutoPrintHookReturn => {
  // Carregar estado persistente do localStorage
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('auto-print-enabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPrintedId, setLastPrintedId] = useState<number | null>(null);
  const [printQueue, setPrintQueue] = useState<number[]>([]);
  
  // Carregar timestamp de ativação persistente do localStorage
  const [activationTimestamp, setActivationTimestamp] = useState<string | null>(() => {
    const saved = localStorage.getItem('auto-print-activation-timestamp');
    return saved || null;
  });

  // Log de inicialização para debug
  useEffect(() => {
    const savedEnabled = localStorage.getItem('auto-print-enabled');
    const savedTimestamp = localStorage.getItem('auto-print-activation-timestamp');
    
    if (savedEnabled || savedTimestamp) {
      console.log('🔄 AUTO-PRINT: Estado carregado do localStorage:', {
        enabled: isEnabled,
        timestamp: activationTimestamp,
        timestampFormatted: activationTimestamp ? new Date(activationTimestamp).toLocaleString('pt-BR') : null
      });
    }
  }, []); // Executar apenas uma vez na inicialização
  
  const previousOrdersRef = useRef<Order[]>([]);
  const processedOrdersRef = useRef<Set<number>>(new Set());
  const hasInitialized = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Salvar estado no localStorage sempre que isEnabled mudar
  useEffect(() => {
    localStorage.setItem('auto-print-enabled', JSON.stringify(isEnabled));
  }, [isEnabled]);

  // Salvar timestamp no localStorage sempre que activationTimestamp mudar
  useEffect(() => {
    if (activationTimestamp) {
      localStorage.setItem('auto-print-activation-timestamp', activationTimestamp);
    } else {
      localStorage.removeItem('auto-print-activation-timestamp');
    }
  }, [activationTimestamp]);

  // Função para ativar/desativar impressão automática com controle temporal
  const toggleAutoPrint = useCallback(() => {
    if (isEnabled) {
      // DESATIVAR
      console.log('🔴 AUTO-PRINT: DESATIVANDO impressão automática');
      setIsEnabled(false);
      setActivationTimestamp(null);
      // Limpar fila de impressão
      setPrintQueue([]);
      showToast({
        title: "🔴 Impressão Automática DESATIVADA",
        description: "Sistema parou de imprimir automaticamente",
        duration: 3000,
      });
    } else {
      // ATIVAR
      const now = new Date().toISOString();
      console.log('🟢 AUTO-PRINT: ATIVANDO impressão automática - Timestamp:', now);
      setIsEnabled(true);
      setActivationTimestamp(now);
      // Limpar histórico para começar fresh
      processedOrdersRef.current.clear();
      showToast({
        title: "🟢 Impressão Automática ATIVADA",
        description: `Sistema imprimirá pedidos a partir de ${new Date(now).toLocaleTimeString('pt-BR')}`,
        duration: 3000,
      });
    }
  }, [isEnabled, showToast]);

  // Função para verificar se pedido deve ser impresso baseado no timestamp
  const shouldPrintOrder = useCallback((order: Order): boolean => {
    if (!activationTimestamp) {
      console.log(`⚠️ AUTO-PRINT: Sem timestamp de ativação para pedido #${order.id}`);
      return false;
    }

    const orderTime = new Date(order.created_at).getTime();
    const activationTime = new Date(activationTimestamp).getTime();
    const shouldPrint = orderTime > activationTime;
    
    console.log(`⏰ AUTO-PRINT: Pedido #${order.id} - Criado: ${new Date(order.created_at).toLocaleTimeString('pt-BR')}, Ativação: ${new Date(activationTimestamp).toLocaleTimeString('pt-BR')}, Deve imprimir: ${shouldPrint}`);
    
    return shouldPrint;
  }, [activationTimestamp]);

  // USAR A FUNÇÃO REAL DE VALIDAÇÃO DO TYPES/ORDERS.TS!

  // Função para imprimir pedido - USAR A MESMA FUNÇÃO QUE FUNCIONA NO BOTÃO!
  const printOrder = useCallback(async (order: Order): Promise<void> => {
    if (!selectedPrinter) {
      console.error('❌ AUTO-PRINT: Nenhuma impressora selecionada');
      return;
    }

    try {
      // Auto-print execution
      setIsProcessing(true);
      
      // USAR A FUNÇÃO REAL QUE JÁ FUNCIONA NO BOTÃO!
      const success = await printOrderFunction(order, selectedPrinter);
      
      if (success) {
        console.log(`✅ AUTO-PRINT: Impressão física realizada com sucesso para pedido #${order.id}`);
        
        // Marcar como impresso no banco
        console.log(`🔄 AUTO-PRINT: Atualizando status no banco para pedido #${order.id}...`);
        await updatePrintStatus(order.id, true);
        console.log(`✅ AUTO-PRINT: Status atualizado no banco para pedido #${order.id}`);
        
        setLastPrintedId(order.id);
        // NÃO ADICIONAR NOVAMENTE - JÁ FOI ADICIONADO ANTES DA IMPRESSÃO
        
        // Auto-print execution
        
        showToast({
          title: "✅ Impresso automaticamente!",
          description: `Pedido #${order.id} - ${order.nome_cliente} - Status atualizado no banco`,
          duration: 3000,
        });
      } else {
        throw new Error('Falha na impressão - função retornou false');
      }
      
    } catch (error) {
      console.error(`❌ AUTO-PRINT: Erro na impressão do pedido #${order.id}:`, error);
      showToast({
        title: "❌ Erro na auto-impressão",
        description: `Pedido #${order.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPrinter, updatePrintStatus, showToast, printOrderFunction]);

  // Função para buscar pedidos da API (para polling)
  const fetchOrdersFromAPI = async (): Promise<Order[]> => {
    try {
      const response = await fetch('http://localhost:3002/orders');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return [];
    }
  };

  // Função para adicionar à fila - COM PROTEÇÃO CONTRA DUPLICATAS
  const addToQueue = useCallback((orderId: number) => {
    setPrintQueue(prev => {
      // Verificar se já está na fila OU se já foi processado
      if (prev.includes(orderId) || processedOrdersRef.current.has(orderId)) {
        return prev;
      }
      return [...prev, orderId];
    });
  }, []);

  // INICIALIZAÇÃO: Marcar apenas pedidos já impressos como processados
  useEffect(() => {
    if (orders.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🔧 AUTO-PRINT: Inicializando sistema...');
      
      // Marcar apenas pedidos JÁ IMPRESSOS como processados
      orders.forEach(order => {
        if (order.impresso) {
          processedOrdersRef.current.add(order.id);
          console.log(`✅ Pedido ${order.id} já impresso - marcado como processado`);
        } else if (isOrderComplete(order)) {
          console.log(`🆕 Pedido ${order.id} não impresso - será processado`);
        }
      });
      
      console.log(`🎯 AUTO-PRINT: ${processedOrdersRef.current.size} pedidos marcados como já processados`);
    }
  }, [orders]);

  // Função para resetar sistema
  const reset = () => {
    setPrintQueue([]);
    setLastPrintedId(null);
    processedOrdersRef.current.clear();
    
    // Limpar também a persistência do localStorage
    setIsEnabled(false);
    setActivationTimestamp(null);
    
    showToast({
      title: '🔄 Sistema resetado',
      description: 'Auto-impressão foi resetada e estado limpo',
      duration: 2000,
    });
  };

  // SISTEMA 1: DETECÇÃO POR MUDANÇA NO ARRAY
  useEffect(() => {
    console.log('🔄 AUTO-PRINT: Verificando novos pedidos...', {
      isEnabled,
      selectedPrinter: !!selectedPrinter,
      ordersCount: orders.length,
      previousCount: previousOrdersRef.current.length
    });

    if (!isEnabled || !selectedPrinter) {
      console.log('❌ AUTO-PRINT: Desabilitado ou sem impressora');
      return;
    }

    const newOrders = orders.filter(order => {
      const isComplete = isOrderComplete(order);
      const notProcessed = !processedOrdersRef.current.has(order.id);
      const isNew = !previousOrdersRef.current.some(prev => prev.id === order.id);
      const shouldPrint = shouldPrintOrder(order); // Verificar timestamp
      const notPrinted = !order.impresso; // Não imprimir já impressos
      
      console.log(`🔍 AUTO-PRINT: Pedido ${order.id}:`, {
        isComplete,
        notProcessed,
        isNew,
        shouldPrint,
        notPrinted,
        willAdd: isComplete && notProcessed && isNew && shouldPrint && notPrinted
      });
      
      return isComplete && notProcessed && isNew && shouldPrint && notPrinted;
    });

    console.log(`🎯 AUTO-PRINT: ${newOrders.length} novos pedidos detectados`);
    
    if (newOrders.length > 0) {
      console.log('🚀 AUTO-PRINT: Adicionando à fila:', newOrders.map(o => o.id));
      newOrders.forEach(order => addToQueue(order.id));
    }

    previousOrdersRef.current = [...orders];
  }, [orders, isEnabled, selectedPrinter, addToQueue]);

  // SISTEMA 2: POLLING ATIVO - REATIVADO COM PROTEÇÃO ANTI-DUPLICATA
  useEffect(() => {
    if (!isEnabled || !selectedPrinter) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    console.log('🔄 SISTEMA 2: Polling ativo iniciado (a cada 3 segundos)');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const apiOrders = await fetchOrdersFromAPI();
        console.log(`📡 POLLING: ${apiOrders.length} pedidos da API`);
        
        const newOrders = apiOrders.filter(order => {
          const isComplete = isOrderComplete(order);
          const notProcessed = !processedOrdersRef.current.has(order.id);
          const notInQueue = !printQueue.includes(order.id);
          const notPrinted = !order.impresso; // NÃO imprimir pedidos já impressos
          const shouldPrint = shouldPrintOrder(order); // Verificar timestamp
          
          console.log(`📋 POLLING: Pedido ${order.id} - Complete: ${isComplete}, NotProcessed: ${notProcessed}, NotInQueue: ${notInQueue}, NotPrinted: ${notPrinted}, ShouldPrint: ${shouldPrint}`);
          
          return isComplete && notProcessed && notInQueue && notPrinted && shouldPrint;
        });

        if (newOrders.length > 0) {
          console.log(`🚀 POLLING: Detectados ${newOrders.length} novos pedidos para impressão!`, newOrders.map(o => o.id));
          newOrders.forEach(order => addToQueue(order.id));
        }
      } catch (error) {
        console.error('❌ POLLING: Erro ao buscar pedidos:', error);
      }
    }, 3000); // 3 segundos - mais eficiente

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isEnabled, selectedPrinter, addToQueue, printQueue]);

  // SISTEMA 3: PROCESSAMENTO DA FILA
  useEffect(() => {
    if (!isEnabled || !selectedPrinter || printQueue.length === 0 || isProcessing) {
      return;
    }

    const processQueue = async () => {
      const nextOrderId = printQueue[0];
      const orderToPrint = orders.find(order => order.id === nextOrderId);

      console.log(`🔄 AUTO-PRINT: Processando pedido #${nextOrderId}`, { encontrado: !!orderToPrint });

      // PROTEÇÃO DUPLA CONTRA REPROCESSAMENTO
      if (processedOrdersRef.current.has(nextOrderId)) {
        setPrintQueue(prev => prev.slice(1));
        return;
      }

      if (orderToPrint && isOrderComplete(orderToPrint)) {
        // MARCAR COMO PROCESSADO ANTES DE IMPRIMIR
        processedOrdersRef.current.add(nextOrderId);
        
        await printOrder(orderToPrint);
        setPrintQueue(prev => {
          const newQueue = prev.slice(1);
          console.log(`📤 AUTO-PRINT: Removido da fila #${nextOrderId}, restam: ${newQueue.length}`);
          return newQueue;
        });
      } else {
        console.log(`⚠️ AUTO-PRINT: Pedido #${nextOrderId} inválido ou incompleto`);
        setPrintQueue(prev => prev.slice(1));
      }
    };

    console.log(`🚀 AUTO-PRINT: Iniciando processamento da fila (${printQueue.length} pedidos)`);
    processQueue();
  }, [printQueue, isEnabled, selectedPrinter, isProcessing, orders, printOrder]);

  // Log de status simples
  useEffect(() => {
    if (isEnabled && printQueue.length > 0) {
      console.log(`�️ AUTO-PRINT: ${printQueue.length} pedidos na fila`);
    }
  }, [isEnabled, printQueue.length]);

  return {
    isEnabled,
    setIsEnabled,
    toggleAutoPrint, // Nova função para controle ON/OFF
    isProcessing,
    lastPrintedId,
    printQueueSize: printQueue.length,
    activationTimestamp, // Timestamp de quando foi ativado
    reset,
    addToQueue,
  };
};
