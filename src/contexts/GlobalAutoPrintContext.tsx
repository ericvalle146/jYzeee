import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Order } from '../types/orders';
import { useOrders } from '../hooks/useOrders';
import { useSSHPrinter } from '../hooks/useSSHPrinter';
import { useToast } from '../hooks/use-toast';

interface GlobalAutoPrintContextType {
  isEnabled: boolean;
  toggleAutoPrint: () => void;
  isProcessing: boolean;
  lastPrintedId: number | null;
  printQueueSize: number;
  activationTimestamp: string | null;
  reset: () => void;
  // Informações da impressora
  selectedPrinter: string | null;
  printers: any[];
  isDetecting: boolean;
  detectPrinters: () => Promise<any>;
  selectPrinter: (printerId: string) => void;
}

const GlobalAutoPrintContext = createContext<GlobalAutoPrintContextType | null>(null);

interface GlobalAutoPrintProviderProps {
  children: React.ReactNode;
}

export const GlobalAutoPrintProvider: React.FC<GlobalAutoPrintProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // Estados persistentes
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('auto-print-enabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [activationTimestamp, setActivationTimestamp] = useState<string | null>(() => {
    const saved = localStorage.getItem('auto-print-activation-timestamp');
    return saved || null;
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPrintedId, setLastPrintedId] = useState<number | null>(null);
  const [printQueue, setPrintQueue] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Hooks para dados e impressão
  const { orders, updatePrintStatus } = useOrders();
  const {
    isAvailable: isSSHAvailable,
    isConnected: isSSHConnected,
    printOrderViaSSH,
    checkStatus: checkSSHStatus,
    printerInfo
  } = useSSHPrinter();
  
  // Refs para controle
  const processedOrdersRef = useRef<Set<number>>(new Set());
  const previousOrdersRef = useRef<Order[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Salvar estados no localStorage
  useEffect(() => {
    localStorage.setItem('auto-print-enabled', JSON.stringify(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    if (activationTimestamp) {
      localStorage.setItem('auto-print-activation-timestamp', activationTimestamp);
    } else {
      localStorage.removeItem('auto-print-activation-timestamp');
    }
  }, [activationTimestamp]);

  // PROTEÇÃO: Desabilitar inicialização após 10 segundos para evitar ações automáticas indesejadas
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🛡️ GLOBAL AUTO-PRINT: Período de inicialização finalizado - sistema protegido contra ações automáticas');
      setIsInitializing(false);
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  // Verificar SSH automaticamente na inicialização
  useEffect(() => {
    const initSSHCheck = async () => {
      try {
        console.log('🌐 GLOBAL AUTO-PRINT: Verificando conexão SSH...');
        await checkSSHStatus();
      } catch (error) {
        console.error('🌐 GLOBAL AUTO-PRINT: Erro ao verificar SSH:', error);
      }
    };

    if (isEnabled) {
      console.log('🌐 GLOBAL AUTO-PRINT: Auto-print habilitado, verificando SSH...');
      initSSHCheck();
    }
  }, [isEnabled, checkSSHStatus]);

  // Monitorar quando impressora é selecionada automaticamente
  useEffect(() => {
    if (selectedPrinter && printers.length > 0) {
      const printer = printers.find(p => p.id === selectedPrinter);
      if (printer) {
        console.log('🌐 GLOBAL AUTO-PRINT: Impressora selecionada automaticamente:', {
          id: printer.id,
          name: printer.name,
          status: printer.status,
          isEnabled: isEnabled
        });
        
        // Se o auto-print estava habilitado mas não funcionando por falta de impressora,
        // agora pode funcionar
        if (isEnabled) {
          console.log('🌐 GLOBAL AUTO-PRINT: Auto-print habilitado e impressora disponível - sistema ativo!');
        }
      }
    }
  }, [selectedPrinter, printers, isEnabled]);

  // Log de inicialização e status da impressora
  useEffect(() => {
    console.log('🌐 GLOBAL AUTO-PRINT: Estado atualizado:', {
      enabled: isEnabled,
      timestamp: activationTimestamp,
      timestampFormatted: activationTimestamp ? new Date(activationTimestamp).toLocaleString('pt-BR') : null,
      selectedPrinter: selectedPrinter,
      printersCount: printers.length,
      isDetecting: isDetecting,
      printersDetailed: printers.map(p => ({ id: p.id, name: p.name, status: p.status }))
    });
  }, [isEnabled, activationTimestamp, selectedPrinter, printers, isDetecting]);

  // Função para verificar se pedido deve ser impresso
  const shouldPrintOrder = (order: Order): boolean => {
    if (!activationTimestamp) {
      console.log(`⚠️ GLOBAL AUTO-PRINT: Sem timestamp de ativação para pedido #${order.id}`);
      return false;
    }

    const orderTime = new Date(order.created_at).getTime();
    const activationTime = new Date(activationTimestamp).getTime();
    const shouldPrint = orderTime > activationTime;
    
    console.log(`⏰ GLOBAL AUTO-PRINT: Pedido #${order.id} - Criado: ${new Date(order.created_at).toLocaleTimeString('pt-BR')}, Ativação: ${new Date(activationTimestamp).toLocaleTimeString('pt-BR')}, Deve imprimir: ${shouldPrint}`);
    
    return shouldPrint;
  };

  // Função para imprimir pedido
  const printOrder = async (order: Order): Promise<boolean> => {
    // PROTEÇÃO: Não imprimir durante inicialização
    if (isInitializing) {
      console.log('🛡️ GLOBAL AUTO-PRINT: Sistema em inicialização - impressão bloqueada por segurança');
      return false;
    }

    if (!isSSHAvailable || !isSSHConnected) {
      console.error('❌ GLOBAL AUTO-PRINT: SSH não disponível');
      toast({
        title: "❌ Erro na Auto-impressão SSH",
        description: "Conexão SSH com a impressora não está disponível.",
        duration: 5000,
      });
      return false;
    }

    try {
      setIsProcessing(true);
      console.log(`🔐 GLOBAL AUTO-PRINT: Tentando imprimir pedido #${order.id} via SSH`);

      const result = await printOrderViaSSH(order);
      const success = result.success;
      
      if (success) {
        // Marcar como impresso no banco
        await updatePrintStatus(order.id, true);
        
        setLastPrintedId(order.id);
        processedOrdersRef.current.add(order.id);
        
        console.log(`✅ GLOBAL AUTO-PRINT: Pedido #${order.id} impresso com sucesso`);
        
        toast({
          title: "🖨️ Auto-impressão realizada",
          description: `Pedido #${order.id} impresso automaticamente`,
          duration: 3000,
        });
        
        return true;
      } else {
        console.error(`❌ GLOBAL AUTO-PRINT: Falha na impressão do pedido #${order.id}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ GLOBAL AUTO-PRINT: Erro ao imprimir pedido #${order.id}:`, error);
      
      toast({
        title: "❌ Erro na Auto-impressão",
        description: `Falha ao imprimir pedido #${order.id}`,
        duration: 5000,
      });
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para adicionar pedido à fila
  const addToQueue = (orderId: number) => {
    setPrintQueue(prev => {
      if (!prev.includes(orderId)) {
        console.log(`📤 GLOBAL AUTO-PRINT: Adicionando pedido #${orderId} à fila`);
        return [...prev, orderId];
      }
      return prev;
    });
  };

  // Marcar pedidos já impressos como processados (inicialização)
  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        if (order.impresso) {
          processedOrdersRef.current.add(order.id);
          console.log(`✅ GLOBAL AUTO-PRINT: Pedido ${order.id} já impresso - marcado como processado`);
        }
      });
      
      console.log(`🎯 GLOBAL AUTO-PRINT: ${processedOrdersRef.current.size} pedidos marcados como já processados`);
    }
  }, [orders]);

  // SISTEMA 1: DETECÇÃO POR MUDANÇA NO ARRAY
  useEffect(() => {
    console.log('🔄 GLOBAL AUTO-PRINT: Verificando novos pedidos...', {
      isEnabled,
      selectedPrinter: !!selectedPrinter,
      ordersCount: orders.length,
      previousCount: previousOrdersRef.current.length
    });

    if (!isEnabled || !selectedPrinter) {
      console.log('❌ GLOBAL AUTO-PRINT: Desabilitado ou sem impressora', {
        isEnabled,
        selectedPrinter: selectedPrinter,
        hasSelectedPrinter: !!selectedPrinter
      });
      return;
    }

    const newOrders = orders.filter(order => {
      const isComplete = true; // Assumindo que todos os pedidos do useOrders são completos
      const notProcessed = !processedOrdersRef.current.has(order.id);
      const isNew = !previousOrdersRef.current.some(prev => prev.id === order.id);
      const shouldPrint = shouldPrintOrder(order);
      const notPrinted = !order.impresso;
      
      console.log(`🔍 GLOBAL AUTO-PRINT: Pedido ${order.id}:`, {
        isComplete,
        notProcessed,
        isNew,
        shouldPrint,
        notPrinted,
        willAdd: isComplete && notProcessed && isNew && shouldPrint && notPrinted
      });
      
      return isComplete && notProcessed && isNew && shouldPrint && notPrinted;
    });

    console.log(`🎯 GLOBAL AUTO-PRINT: ${newOrders.length} novos pedidos detectados`);
    
    if (newOrders.length > 0) {
      console.log('🚀 GLOBAL AUTO-PRINT: Adicionando à fila:', newOrders.map(o => o.id));
      newOrders.forEach(order => addToQueue(order.id));
    }

    previousOrdersRef.current = [...orders];
  }, [orders, isEnabled, selectedPrinter]);

  // SISTEMA 2: POLLING ATIVO
  useEffect(() => {
    if (!isEnabled || !selectedPrinter || isInitializing) {
      console.log('🔄 GLOBAL AUTO-PRINT: Polling parado - aguardando condições', {
        isEnabled,
        selectedPrinter: selectedPrinter,
        hasSelectedPrinter: !!selectedPrinter,
        isInitializing
      });
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    console.log('🔄 GLOBAL AUTO-PRINT: Polling ativo iniciado (a cada 5 segundos)');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Usar os pedidos do hook useOrders diretamente
        const newOrders = orders.filter(order => {
          const isComplete = true; // Assumindo que todos os pedidos são completos
          const notProcessed = !processedOrdersRef.current.has(order.id);
          const notInQueue = !printQueue.includes(order.id);
          const notPrinted = !order.impresso;
          const shouldPrint = shouldPrintOrder(order);
          
          console.log(`📋 GLOBAL AUTO-PRINT POLLING: Pedido ${order.id} - Complete: ${isComplete}, NotProcessed: ${notProcessed}, NotInQueue: ${notInQueue}, NotPrinted: ${notPrinted}, ShouldPrint: ${shouldPrint}`);
          
          return isComplete && notProcessed && notInQueue && notPrinted && shouldPrint;
        });

        if (newOrders.length > 0) {
          console.log(`🚀 GLOBAL AUTO-PRINT POLLING: Detectados ${newOrders.length} novos pedidos para impressão!`, newOrders.map(o => o.id));
          newOrders.forEach(order => addToQueue(order.id));
        }
      } catch (error) {
        console.error('❌ GLOBAL AUTO-PRINT POLLING: Erro:', error);
      }
    }, 5000); // 5 segundos

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isEnabled, selectedPrinter, printQueue, orders, isInitializing]);

  // SISTEMA 3: PROCESSAMENTO DA FILA
  useEffect(() => {
    if (!isEnabled || !selectedPrinter || printQueue.length === 0 || isProcessing || isInitializing) {
      return;
    }

    const processQueue = async () => {
      const nextOrderId = printQueue[0];
      const orderToPrint = orders.find(order => order.id === nextOrderId);

      console.log(`🔄 GLOBAL AUTO-PRINT: Processando pedido #${nextOrderId}`, { encontrado: !!orderToPrint });

      // PROTEÇÃO DUPLA CONTRA REPROCESSAMENTO
      if (processedOrdersRef.current.has(nextOrderId)) {
        setPrintQueue(prev => prev.slice(1));
        return;
      }

      if (orderToPrint) {
        // MARCAR COMO PROCESSADO ANTES DE IMPRIMIR
        processedOrdersRef.current.add(nextOrderId);
        
        const success = await printOrder(orderToPrint);
        setPrintQueue(prev => {
          const newQueue = prev.slice(1);
          console.log(`📤 GLOBAL AUTO-PRINT: Removido da fila #${nextOrderId}, restam: ${newQueue.length}`);
          return newQueue;
        });
      } else {
        console.log(`⚠️ GLOBAL AUTO-PRINT: Pedido #${nextOrderId} não encontrado`);
        setPrintQueue(prev => prev.slice(1));
      }
    };

    console.log(`🚀 GLOBAL AUTO-PRINT: Iniciando processamento da fila (${printQueue.length} pedidos)`);
    processQueue();
  }, [printQueue, isEnabled, selectedPrinter, isProcessing, orders, isInitializing]);

  // Log de status da fila
  useEffect(() => {
    if (isEnabled && printQueue.length > 0) {
      console.log(`🗂️ GLOBAL AUTO-PRINT: ${printQueue.length} pedidos na fila`);
    }
  }, [isEnabled, printQueue.length]);

  // Função para ativar/desativar
  const toggleAutoPrint = () => {
    if (isEnabled) {
      // DESATIVAR
      console.log('🔴 GLOBAL AUTO-PRINT: DESATIVANDO impressão automática');
      setIsEnabled(false);
      setActivationTimestamp(null);
      setPrintQueue([]);
      
      toast({
        title: "🔴 Impressão Automática DESATIVADA",
        description: "Sistema parou de imprimir automaticamente em todas as páginas",
        duration: 3000,
      });
    } else {
      // ATIVAR
      const now = new Date().toISOString();
      console.log('🟢 GLOBAL AUTO-PRINT: ATIVANDO impressão automática - Timestamp:', now);
      setIsEnabled(true);
      setActivationTimestamp(now);
      processedOrdersRef.current.clear();
      
      toast({
        title: "🟢 Impressão Automática ATIVADA",
        description: `Sistema imprimirá pedidos automaticamente em todas as páginas a partir de ${new Date(now).toLocaleTimeString('pt-BR')}`,
        duration: 3000,
      });
    }
  };

  // Função para resetar
  const reset = () => {
    setPrintQueue([]);
    setLastPrintedId(null);
    processedOrdersRef.current.clear();
    setIsEnabled(false);
    setActivationTimestamp(null);
    
    toast({
      title: '🔄 Sistema resetado',
      description: 'Auto-impressão global foi resetada e estado limpo',
      duration: 2000,
    });
  };

  const value: GlobalAutoPrintContextType = {
    isEnabled,
    toggleAutoPrint,
    isProcessing,
    lastPrintedId,
    printQueueSize: printQueue.length,
    activationTimestamp,
    reset,
    // Informações da impressora SSH
    selectedPrinter: isSSHAvailable ? 'ssh_printer' : null,
    printers: isSSHAvailable ? [printerInfo] : [],
    isDetecting: false,
    detectPrinters: checkSSHStatus,
    selectPrinter: () => {}, // SSH não precisa seleção manual
  };

  return (
    <GlobalAutoPrintContext.Provider value={value}>
      {children}
    </GlobalAutoPrintContext.Provider>
  );
};

export const useGlobalAutoPrint = (): GlobalAutoPrintContextType => {
  const context = useContext(GlobalAutoPrintContext);
  if (!context) {
    throw new Error('useGlobalAutoPrint deve ser usado dentro de GlobalAutoPrintProvider');
  }
  return context;
};
