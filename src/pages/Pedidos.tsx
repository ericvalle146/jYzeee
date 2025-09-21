import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
// Switch removido - auto-impressão agora é global
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  ShoppingCart, 
  Printer, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  CreditCard, 
  User, 
  Package,
  DollarSign,
  RefreshCw,
  Loader2,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  Move,
  Eye,
  FileText,
  Save,
  Calendar,
  Edit3,
  X
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
// useGlobalAutoPrint removido - não precisamos mais dos controles locais
import { Order } from '../types/orders';
import { PrinterSetup } from '../components/PrinterSetup';
import { useUnifiedPrinter } from '../hooks/useUnifiedPrinter';
import { useOrders } from '../hooks/useOrders';
import { CustomLayoutService } from '../services/customLayoutService';
import { dynamicPrintService } from '../services/dynamicPrintService';
import { PrintLayoutSelector } from '../components/PrintLayoutSelector';

// Interface para definir os blocos ordenados do layout
interface OrderedBlock {
  id: string;
  label: string;
  fieldKey: string;
  order: number;
}

// Campos disponíveis para o layout
const AVAILABLE_FIELDS = [
  { key: 'nome_cliente', label: 'Nome do Cliente' },
  { key: 'endereco', label: 'Endereco' },
  { key: 'pedido', label: 'Pedido' },
  { key: 'valor', label: 'Valor' },
  { key: 'tipo_pagamento', label: 'Tipo de Pagamento' },
  { key: 'observacoes', label: 'Observacoes' },
  { key: 'created_at', label: 'Data/Hora' },
  { key: 'separator', label: '=== Separador ===' }
];

const Pedidos = () => {
  const { toast } = useToast();
  
  // Usar dados reais do Supabase
  const { orders, loading, error, stats, refreshData, updateOrder, updatePrintStatus } = useOrders();
  
  // Estados para layout
  const [layoutBlocks, setLayoutBlocks] = useState<OrderedBlock[]>([]);
  const [layoutPreview, setLayoutPreview] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState('nao-imprimido');
  
  // Estado para filtro de período
  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'esta-semana' | 'este-mes' | 'total'>('hoje');
  
  // Estados para o modal de criação de pedido
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    nome_cliente: '',
    endereco: '',
    pedido: '',
    observacoes: '',
    valor: '',
    tipo_pagamento: ''
  });
  
  // Hook unificado para impressão
  const { 
    printing,
    printingOrderId, 
    printers, 
    selectedPrinter, 
    isDetecting,
    detectPrinters,
    selectPrinter,
    activatePrinter,
    printOrder,
    checkStatus 
  } = useUnifiedPrinter();
  
  // Estados adicionais para controle da UI de impressão
  const [printerConnected, setPrinterConnected] = useState<boolean>(false);
  const [printerStatus, setPrinterStatus] = useState<'idle' | 'detecting' | 'ready' | 'error'>('idle');
  
  // Estados para controle de auto-impressão
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  
  // Estados para sistema de impressão dinâmica
  const [showLayoutSelector, setShowLayoutSelector] = useState<Record<number, boolean>>({});
  const [selectedLayoutIds, setSelectedLayoutIds] = useState<Record<number, string>>({});

  // Estados para CRUD de pedidos
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState({
    nome_cliente: '',
    endereco: '',
    pedido: '',
    observacoes: '',
    valor: '',
    tipo_pagamento: ''
  });

  // Função removida - não precisamos mais de teste automático

  // Sincronizar estados da UI com o hook unificado
  useEffect(() => {
    // Atualizar status baseado no hook
    if (isDetecting) {
      setPrinterStatus('detecting');
    } else if (printers.length > 0) {
      setPrinterStatus('ready');
      // Verificar se a impressora selecionada está online
      if (selectedPrinter) {
        const printer = printers.find(p => p.id === selectedPrinter);
        setPrinterConnected(printer?.status === 'online');
      }
    } else {
      setPrinterStatus('idle');
      setPrinterConnected(false);
    }
  }, [isDetecting, printers, selectedPrinter]);

  // Detectar impressoras na inicialização
  useEffect(() => {
    const initDetectPrinters = async () => {
      try {
        await detectPrinters();
      } catch (error) {
        console.error('Erro ao detectar impressoras:', error);
        setPrinterStatus('error');
      }
    };

    // Detectar impressoras apenas uma vez na inicialização
    if (printers.length === 0 && !isDetecting) {
      initDetectPrinters();
    }
  }, [detectPrinters, printers.length, isDetecting]);

  // useEffect removido - não precisamos mais de teste automático repetitivo

  // useEffects para configuração de layout
  useEffect(() => {
    // Carregar layout salvo do localStorage
    const savedFields = localStorage.getItem('custom-layout-fields');
    
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields);
        const restoredBlocks = parsedFields.map((fieldKey: string, index: number) => {
          const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
          return {
            id: `block-${index}`,
            label: field ? field.label : fieldKey === 'separator' ? '=== Separador ===' : fieldKey,
            fieldKey: fieldKey,
            order: index
          };
        });
        setLayoutBlocks(restoredBlocks);
        
        // Garantir que o CustomLayoutService também tenha o layout carregado
        const loadedTemplate = generateLayoutTemplate(restoredBlocks);
        CustomLayoutService.saveCustomLayout(loadedTemplate);
        
        return;
      } catch (error) {
        console.error('Erro ao carregar layout salvo:', error);
      }
    }

    // Layout padrão se não houver salvo
    const defaultBlocks = [
      { id: 'block-0', label: 'Nome do Cliente', fieldKey: 'nome_cliente', order: 0 },
      { id: 'block-1', label: 'Endereco', fieldKey: 'endereco', order: 1 },
      { id: 'block-2', label: '=== Separador ===', fieldKey: 'separator', order: 2 },
      { id: 'block-3', label: 'Pedido', fieldKey: 'pedido', order: 3 },
      { id: 'block-4', label: 'Observacoes', fieldKey: 'observacoes', order: 4 },
      { id: 'block-5', label: 'Valor', fieldKey: 'valor', order: 5 },
      { id: 'block-6', label: 'Tipo de Pagamento', fieldKey: 'tipo_pagamento', order: 6 }
    ];
    setLayoutBlocks(defaultBlocks);
    
    // Garantir que o CustomLayoutService também tenha o layout padrão
    const defaultTemplate = generateLayoutTemplate(defaultBlocks);
    CustomLayoutService.saveCustomLayout(defaultTemplate);
  }, []);

  useEffect(() => {
    if (layoutBlocks.length > 0) {
      const fieldOrder = layoutBlocks
        .sort((a, b) => a.order - b.order)
        .map(block => block.fieldKey);
      
      // Criar preview simples
      const preview = fieldOrder.map(field => {
        if (field === 'separator') return '===========================';
        const fieldLabel = AVAILABLE_FIELDS.find(f => f.key === field)?.label || field;
        return `${fieldLabel}: [valor]`;
      }).join('\n');
      
      setLayoutPreview(preview);
    }
  }, [layoutBlocks]);

  // Funções para configuração de layout
  const addField = (fieldKey: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
    if (!field) return;

    // Verifica se o campo já existe (exceto separador que pode ser usado múltiplas vezes)
    if (fieldKey !== 'separator' && layoutBlocks.some(block => block.fieldKey === fieldKey)) {
      toast({
        title: "Campo já adicionado",
        description: "Este campo já está presente no layout.",
        variant: "destructive"
      });
      return;
    }

    const newBlock: OrderedBlock = {
      id: `block-${Date.now()}`,
      label: field.label,
      fieldKey: fieldKey,
      order: layoutBlocks.length
    };

    setLayoutBlocks(prev => [...prev, newBlock]);
    
    toast({
      title: "Campo adicionado",
      description: `${field.label} foi adicionado ao layout.`
    });
  };

  const removeField = (blockId: string) => {
    const updatedBlocks = layoutBlocks
      .filter(block => block.id !== blockId)
      .map((block, index) => ({ ...block, order: index }));
    
    setLayoutBlocks(updatedBlocks);
    
    toast({
      title: "Campo removido",
      description: "Campo foi removido do layout."
    });
  };

  const moveUp = (blockId: string) => {
    const blockIndex = layoutBlocks.findIndex(block => block.id === blockId);
    if (blockIndex <= 0) return;

    const updatedBlocks = [...layoutBlocks];
    const currentBlock = updatedBlocks[blockIndex];
    const previousBlock = updatedBlocks[blockIndex - 1];

    currentBlock.order = blockIndex - 1;
    previousBlock.order = blockIndex;

    updatedBlocks[blockIndex] = previousBlock;
    updatedBlocks[blockIndex - 1] = currentBlock;

    setLayoutBlocks(updatedBlocks);
  };

  const moveDown = (blockId: string) => {
    const blockIndex = layoutBlocks.findIndex(block => block.id === blockId);
    if (blockIndex >= layoutBlocks.length - 1) return;

    const updatedBlocks = [...layoutBlocks];
    const currentBlock = updatedBlocks[blockIndex];
    const nextBlock = updatedBlocks[blockIndex + 1];

    currentBlock.order = blockIndex + 1;
    nextBlock.order = blockIndex;

    updatedBlocks[blockIndex] = nextBlock;
    updatedBlocks[blockIndex + 1] = currentBlock;

    setLayoutBlocks(updatedBlocks);
  };

  const saveLayout = () => {
    const fieldOrder = layoutBlocks
      .sort((a, b) => a.order - b.order)
      .map(block => block.fieldKey);
    
    // Salvar como string simples para localStorage
    localStorage.setItem('custom-layout-fields', JSON.stringify(fieldOrder));
    
    // Gerar e salvar o layout no CustomLayoutService para impressão real
    const customLayout = generateLayoutTemplate(layoutBlocks);
    CustomLayoutService.saveCustomLayout(customLayout);
    
    
    toast({
      title: "✅ Layout Salvo",
      description: "Sua configuração será usada nas próximas impressões."
    });
  };

  const resetLayout = () => {
    // Limpar tudo do zero - remover todos os layouts salvos
    localStorage.removeItem('simple_print_layout');
    localStorage.removeItem('custom-layout-fields');
    localStorage.removeItem('print_layouts');
    localStorage.removeItem('default_print_layout');
    
    // Limpar o estado atual
    setLayoutBlocks([]);
    
    
    toast({
      title: "🔄 Sistema Limpo",
      description: "Todos os layouts foram removidos. Sistema voltou ao estado inicial.",
      duration: 3000,
    });
  };

  // Função para detectar impressoras (wrapper para o hook)
  const handleDetectPrinters = async () => {
    try {
      await detectPrinters();
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
    }
  };

  // Função para gerar layout personalizado para impressão
  // Gerar template de layout personalizado para CustomLayoutService
  const generateLayoutTemplate = (blocks: OrderedBlock[]): string => {
    const sortedBlocks = blocks.sort((a, b) => a.order - b.order);
    
    if (sortedBlocks.length === 0) {
      return `CLIENTE: {nome_cliente}
ENDERECO: {endereco}
===========================
PEDIDO: {pedido}
OBSERVACOES: {observacoes}
VALOR: {valor}
PAGAMENTO: {tipo_pagamento}`;
    }

    return sortedBlocks.map(block => {
      switch (block.fieldKey) {
        case 'nome_cliente':
          return 'CLIENTE: {nome_cliente}';
        case 'endereco':
          return 'ENDERECO: {endereco}';
        case 'pedido':
          return 'PEDIDO: {pedido}';
        case 'valor':
          return 'VALOR: {valor}';
        case 'tipo_pagamento':
          return 'PAGAMENTO: {tipo_pagamento}';
        case 'observacoes':
          return 'OBSERVACOES: {observacoes}';
        case 'created_at':
          return 'DATA/HORA: {created_at}';
        case 'separator':
          return '===========================';
        default:
          return '';
      }
    }).filter(line => line !== '').join('\n');
  };

  // Função para formatar preço (garantindo consistência com CustomLayoutService)
  const formatPrice = useCallback((value: number | string) => {
    // Garantir que é um número válido
    const numericValue = typeof value === 'number' 
      ? value 
      : parseFloat(String(value)) || 0;
    
    // 🔧 FORMATAÇÃO SIMPLES PARA IMPRESSORA ESC/POS
    // Usar apenas caracteres ASCII básicos
    const formatted = `R$ ${numericValue.toFixed(2).replace('.', ',')}`;
    
    return formatted;
  }, []);

  // Função para imprimir pedido com layout dinâmico
  const handlePrintOrder = useCallback(async (order: Order, printerId?: string, layoutId?: string): Promise<boolean> => {
    const printerToUse = printerId || selectedPrinter;
    if (!printerToUse) {
      toast({
        title: "ℹ️ Configuração necessária",
        description: "Configure suas preferências de impressão para continuar.",
        variant: "default",
      });
      return false;
    }

    try {
      // Usar layout específico se fornecido, senão usar o padrão
      const layoutToUse = layoutId || selectedLayoutIds[order.id];
      
      toast({
        title: "🖨️ Imprimindo com Layout Dinâmico...",
        description: `Enviando pedido #${order.id} para impressão${layoutToUse ? ' com layout personalizado' : ''}`,
      });


      // Usar o sistema de impressão dinâmica
      const success = await printOrder(order, printerToUse, undefined, layoutToUse);
      
      if (success) {
        // ✅ NOVA FUNCIONALIDADE: Marcar automaticamente como impresso após impressão bem-sucedida
        try {
          await updatePrintStatus(order.id, true);
          toast({
            title: "✅ Impresso com sucesso!",
            description: `Pedido #${order.id} foi marcado como impresso`,
          });
          return true;
        } catch (statusError) {
          console.error('Erro ao atualizar status de impressão:', statusError);
          // Não bloquear a impressão se houver erro no banco
          toast({
            title: "🖨️ Impressão realizada",
            description: "Pedido foi impresso! (Status será atualizado em breve)",
            variant: "default",
          });
          
          // Tentar novamente após 2 segundos
          setTimeout(async () => {
            try {
              await updatePrintStatus(order.id, true);
              toast({
                title: "✅ Status atualizado",
                description: `Status de impressão do pedido #${order.id} foi atualizado`,
              });
            } catch (retryError) {
              console.error('Erro na segunda tentativa:', retryError);
            }
          }, 2000);
          return true; // A impressão funcionou, mesmo com erro de status
        }
      } else {
        toast({
          title: "❌ Falha na impressão",
          description: "A impressão não foi realizada com sucesso",
          variant: "destructive",
        });
        return false;
      }
      
    } catch (error) {
      console.error('Erro na impressão:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Falha ao imprimir o pedido";
      
      // Mostrar toast com orientações específicas
      if (errorMessage.includes('desligada') || errorMessage.includes('desconectada')) {
        toast({
          title: "🔌 Impressora Offline",
          description: (
            <div className="space-y-2">
              <p>A impressora parece estar desligada ou desconectada.</p>
              <p className="text-sm font-medium">✅ Verifique se:</p>
              <ul className="text-xs list-disc list-inside space-y-1">
                <li>A impressora está ligada</li>
                <li>O cabo USB está conectado</li>
                <li>A impressora não está em modo de economia</li>
              </ul>
            </div>
          ),
          variant: "destructive",
          duration: 8000,
        });
      } else if (errorMessage.includes('ocupada')) {
        toast({
          title: "⏳ Impressora Ocupada",
          description: "A impressora está processando outro trabalho. Tente novamente em alguns segundos.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (errorMessage.includes('Servidor de impressão offline')) {
        toast({
          title: "🌐 Servidor Offline",
          description: "O serviço de impressão não está rodando. Verifique se o backend está ativo.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "❌ Erro na Impressão",
          description: errorMessage,
          variant: "destructive",
          duration: 6000,
        });
      }
      return false;
    }
  }, [selectedPrinter, printOrder, updatePrintStatus, toast, selectedLayoutIds]);

  // Funções para controlar o seletor de layout
  const toggleLayoutSelector = useCallback((orderId: number) => {
    setShowLayoutSelector(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  }, []);

  const handleLayoutChange = useCallback((orderId: number, layoutId: string) => {
    setSelectedLayoutIds(prev => ({
      ...prev,
      [orderId]: layoutId
    }));
  }, []);

  const handlePrintWithLayout = useCallback(async (orderId: number, layoutId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const success = await handlePrintOrder(order, undefined, layoutId);
      if (success) {
        // Fechar o seletor após impressão bem-sucedida
        setShowLayoutSelector(prev => ({
          ...prev,
          [orderId]: false
        }));
      }
    }
  }, [orders, handlePrintOrder]);

  // Sistema de impressão automática agora é gerenciado globalmente pelo contexto
  // Não precisamos mais de controles locais aqui

  const generateCustomPrintLayout = (order: Order): string => {
    const fieldOrder = layoutBlocks
      .sort((a, b) => a.order - b.order)
      .map(block => block.fieldKey);
    
    if (fieldOrder.length === 0) {
      // Layout padrão se nenhum foi configurado
      return `CLIENTE: ${order.nome_cliente || 'Nao informado'}
ENDERECO: ${order.endereco || 'Nao informado'}
===========================
PEDIDO: ${order.pedido || 'Nao informado'}
OBSERVACOES: ${order.observacoes || 'Nao informado'}
VALOR: R$ ${order.valor || '0,00'}
PAGAMENTO: ${order.tipo_pagamento || 'Nao informado'}`;
    }

    return fieldOrder.map(field => {
      switch (field) {
        case 'nome_cliente':
          return `CLIENTE: ${order.nome_cliente || 'Nao informado'}`;
        case 'endereco':
          return `ENDERECO: ${order.endereco || 'Nao informado'}`;
        case 'pedido':
          return `PEDIDO: ${order.pedido || 'Nao informado'}`;
        case 'valor':
          return `VALOR: R$ ${order.valor || '0,00'}`;
        case 'tipo_pagamento':
          return `PAGAMENTO: ${order.tipo_pagamento || 'Nao informado'}`;
        case 'observacoes':
          return `OBSERVACOES: ${order.observacoes || 'Nao informado'}`;
        case 'created_at':
          return `DATA/HORA: ${new Date(order.created_at).toLocaleString('pt-BR')}`;
        case 'separator':
          return '===========================';
        default:
          return '';
      }
    }).filter(line => line !== '').join('\n');
  };

  // Função para marcar como impresso manualmente
  const handleMarkAsPrinted = async (orderId: number) => {
    try {
      await updatePrintStatus(orderId, true);
      toast({
        title: "✅ Marcado como Impresso",
        description: `Pedido #${orderId} foi marcado como impresso no banco de dados`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao marcar pedido como impresso",
        variant: "destructive",
      });
    }
  };

  // Função para atualizar status (removida - não usamos mais status)
  // const handleStatusChange = async (orderId: number, newStatus: string) => {
  //   // Status foi removido do sistema
  // };

  // Funções para filtrar por período (MOVIDAS PARA ANTES DO USO)
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    endOfWeek.setHours(23, 59, 59, 999);
    
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isThisMonth = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Função para filtrar pedidos por período
  const getFilteredOrdersByPeriod = (orders: Order[]) => {
    switch (periodFilter) {
      case 'hoje':
        return orders.filter(order => isToday(order.created_at));
      case 'esta-semana':
        return orders.filter(order => isThisWeek(order.created_at));
      case 'este-mes':
        return orders.filter(order => isThisMonth(order.created_at));
      case 'total':
      default:
        return orders;
    }
  };

  // Filtrar pedidos baseado no período selecionado e na aba ativa
  const filteredOrders = (() => {
    // Primeiro filtra por período
    const periodFilteredOrders = getFilteredOrdersByPeriod(orders);
    
    // Depois filtra por status de impressão baseado na aba ativa
    return periodFilteredOrders.filter(order => {
      if (activeTab === 'nao-imprimido') {
        return !order.impresso; // Pedidos não impressos
      } else if (activeTab === 'ja-imprimido') {
        return order.impresso; // Pedidos já impressos
      }
      return true;
    });
  })();

  // ================================
  // FUNÇÕES PARA CRIAÇÃO DE PEDIDO
  // ================================
  
  // Função para resetar o formulário
  const resetNewOrderForm = () => {
    setNewOrderForm({
      nome_cliente: '',
      endereco: '',
      pedido: '',
      observacoes: '',
      valor: '',
      tipo_pagamento: ''
    });
  };

  // Função para atualizar campos do formulário
  const updateOrderFormField = (field: string, value: string | boolean) => {
    setNewOrderForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para validar o formulário
  const validateOrderForm = () => {
    const { nome_cliente, endereco, pedido, valor, tipo_pagamento } = newOrderForm;
    
    if (!nome_cliente.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return false;
    }
    
    if (!endereco.trim()) {
      toast({
        title: "Campo obrigatório", 
        description: "Endereço é obrigatório",
        variant: "destructive"
      });
      return false;
    }
    
    if (!pedido.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descrição do pedido é obrigatória",
        variant: "destructive"
      });
      return false;
    }
    
    if (!valor.trim() || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Valor deve ser um número maior que zero",
        variant: "destructive"
      });
      return false;
    }
    
    if (!tipo_pagamento.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Tipo de pagamento é obrigatório",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Função para submeter o novo pedido - CORRIGIDA COM ID
  const handleCreateOrder = async () => {
    if (!validateOrderForm()) return;
    
    setIsCreatingOrder(true);
    
    try {
      // ✅ SOLUÇÃO: Sistema de ID Sequencial Profissional
      // 🔢 Inicia em 100000 e vai incrementando: 100000, 100001, 100002...
      // 🧠 Inteligente: Se você deletar um pedido, preenche o gap automaticamente
      // ♾️ Sem limite: Pode ir até 999999 e além conforme necessário
      const generateSequentialId = (): number => {
        const BASE_ID = 100000; // Começar a partir de 100000
        
        // Se não há pedidos, começar do 100000
        if (orders.length === 0) {
          return BASE_ID;
        }
        
        // Pegar todos os IDs dos pedidos existentes que são >= 100000
        const existingIds = orders
          .map(order => order.id)
          .filter(id => id >= BASE_ID)
          .sort((a, b) => a - b); // Ordenar do menor para o maior
        
        // Se não há IDs na faixa de 100000+, começar do 100000
        if (existingIds.length === 0) {
          return BASE_ID;
        }
        
        // Encontrar o primeiro gap na sequência ou retornar o próximo após o último
        for (let i = 0; i < existingIds.length; i++) {
          const expectedId = BASE_ID + i;
          const actualId = existingIds[i];
          
          // Se encontrou um gap, usar esse número
          if (actualId !== expectedId) {
            return expectedId;
          }
        }
        
        // Se não há gaps, usar o próximo número após o último
        const lastId = existingIds[existingIds.length - 1];
        return lastId + 1;
      };
      
      const idGerado = generateSequentialId();
      
      // Criar payload com ID explícito
      const criarPayloadComId = (): Record<string, any> => {
        const payload: Record<string, any> = {};
        
        // ✅ ADICIONAR ID PRIMEIRO
        payload['id'] = idGerado;
        
        // Adicionar APENAS os campos necessários, um por um
        payload['nome_cliente'] = newOrderForm.nome_cliente.trim();
        payload['endereço'] = newOrderForm.endereco.trim(); // COM cedilha
        payload['pedido'] = newOrderForm.pedido.trim();
        payload['valor'] = parseFloat(newOrderForm.valor);
        payload['tipo_pagamento'] = newOrderForm.tipo_pagamento.trim();
        payload['impresso'] = false;
        
        // Adicionar observações apenas se não estiver vazio
        if (newOrderForm.observacoes.trim()) {
          payload['observações'] = newOrderForm.observacoes.trim();
        }
        
        return payload;
      };

      const payloadParaInserir = criarPayloadComId();


      // Usar a função createOrder do hook useOrders (se disponível)
      // Por enquanto, vamos usar o Supabase diretamente
      const { supabase } = await import('@/config/supabase');
      
      const { data: newOrder, error } = await supabase
        .from('pedidos')
        .insert(payloadParaInserir) // Usar payload com campo 'id'
        .select()
        .single();

      if (error) throw error;

      // Sucesso!
      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido para ${payloadParaInserir.nome_cliente} foi adicionado`,
      });

      // Fechar modal e resetar formulário
      setIsCreateOrderModalOpen(false);
      resetNewOrderForm();
      
      // Atualizar dados da página
      await refreshData();
      
      
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      
      // Extrair mensagem de erro mais descritiva do Supabase
      let errorMessage = "Erro desconhecido";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Tentar extrair mensagem do erro do Supabase
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.error?.message) {
          errorMessage = supabaseError.error.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        }
      }
      
      toast({
        title: "Erro ao criar pedido",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // ========== FUNÇÕES CRUD (UPDATE/DELETE) ==========
  
  // Função para abrir modal de edição
  const handleEditOrder = useCallback((order: Order) => {
    setOrderToEdit(order);
    setEditOrderForm({
      nome_cliente: order.nome_cliente || '',
      endereco: order.endereco || '',
      pedido: order.pedido || '',
      observacoes: order.observacoes || '',
      valor: String(order.valor || ''),
      tipo_pagamento: order.tipo_pagamento || ''
    });
    setIsEditModalOpen(true);
  }, []);

  // Função para fechar modal de edição
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setOrderToEdit(null);
    setEditOrderForm({
      nome_cliente: '',
      endereco: '',
      pedido: '',
      observacoes: '',
      valor: '',
      tipo_pagamento: ''
    });
  }, []);

  // Função para atualizar campo do formulário de edição
  const updateEditOrderForm = useCallback((field: string, value: string) => {
    setEditOrderForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Função para validar formulário de edição
  const validateEditOrderForm = useCallback(() => {
    const errors: string[] = [];
    
    if (!editOrderForm.nome_cliente.trim()) errors.push('Nome do cliente é obrigatório');
    if (!editOrderForm.endereco.trim()) errors.push('Endereço é obrigatório');
    if (!editOrderForm.pedido.trim()) errors.push('Descrição do pedido é obrigatória');
    if (!editOrderForm.valor.trim()) errors.push('Valor é obrigatório');
    if (!editOrderForm.tipo_pagamento.trim()) errors.push('Tipo de pagamento é obrigatório');
    
    const valorNumerico = parseFloat(editOrderForm.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      errors.push('Valor deve ser um número válido maior que zero');
    }
    
    return errors;
  }, [editOrderForm]);

  // Função para atualizar pedido
  const handleUpdateOrder = useCallback(async () => {
    if (!orderToEdit) return;

    const validationErrors = validateEditOrderForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Erro de validação",
        description: validationErrors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingOrder(true);

    try {
      const { supabase } = await import('@/config/supabase');
      
      // Construir payload sanitizado para update
      const updatePayload = {
        nome_cliente: editOrderForm.nome_cliente.trim(),
        endereço: editOrderForm.endereco.trim(), // COM cedilha
        pedido: editOrderForm.pedido.trim(),
        valor: parseFloat(editOrderForm.valor),
        tipo_pagamento: editOrderForm.tipo_pagamento.trim(),
      };

      // Adicionar observações apenas se não estiver vazio
      if (editOrderForm.observacoes.trim()) {
        (updatePayload as any).observações = editOrderForm.observacoes.trim();
      }


      const { data: updatedOrder, error } = await supabase
        .from('pedidos')
        .update(updatePayload)
        .eq('id', orderToEdit.id)
        .select()
        .single();

      if (error) throw error;

      // Sucesso!
      toast({
        title: "Pedido atualizado com sucesso!",
        description: `Pedido #${orderToEdit.id} foi atualizado`,
      });

      // Fechar modal
      handleCloseEditModal();
      
      // Atualizar dados da página
      await refreshData();
      
      
    } catch (error) {
      console.error('❌ Erro ao atualizar pedido:', error);
      
      let errorMessage = "Erro desconhecido";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.error?.message) {
          errorMessage = supabaseError.error.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        }
      }
      
      toast({
        title: "Erro ao atualizar pedido",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingOrder(false);
    }
  }, [orderToEdit, editOrderForm, validateEditOrderForm, handleCloseEditModal, refreshData, toast]);

  // Função para abrir diálogo de confirmação de exclusão
  const handleDeleteOrder = useCallback((order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  }, []);

  // Função para fechar diálogo de exclusão
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setOrderToDelete(null);
  }, []);

  // Função para confirmar exclusão
  const handleConfirmDelete = useCallback(async () => {
    if (!orderToDelete) return;

    setIsDeletingOrder(true);

    try {
      const { supabase } = await import('@/config/supabase');


      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', orderToDelete.id);

      if (error) throw error;

      // Sucesso!
      toast({
        title: "Pedido excluído com sucesso!",
        description: `Pedido #${orderToDelete.id} foi removido permanentemente`,
      });

      // Fechar diálogo
      handleCloseDeleteDialog();
      
      // Atualizar dados da página
      await refreshData();
      
      
    } catch (error) {
      console.error('❌ Erro ao excluir pedido:', error);
      
      let errorMessage = "Erro desconhecido";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.error?.message) {
          errorMessage = supabaseError.error.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        }
      }
      
      toast({
        title: "Erro ao excluir pedido",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeletingOrder(false);
    }
  }, [orderToDelete, handleCloseDeleteDialog, refreshData, toast]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando pedidos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar pedidos: {error}</p>
          <Button onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 left-64 pt-20 bg-gradient-to-br from-background via-background/95 to-background/90 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Gestão de Pedidos
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Gerencie todos os pedidos do seu negócio em tempo real
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* Auto-impressão agora é gerenciada globalmente no header */}
            
            <Button 
              onClick={() => setIsCreateOrderModalOpen(true)} 
              variant="default" 
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Pedido
            </Button>
            
            <Button onClick={refreshData} variant="outline" size="lg">
              <RefreshCw className="h-5 w-5 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Seção de Status das Impressoras */}
      <div className="px-6 py-4 border-b border-border/30">
        <Card className="bg-gradient-to-r from-background to-background/80 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Printer className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Status das Impressoras</h3>
                  </div>
                </div>
                
                {/* Badge de Status */}
                <Badge 
                  className={`px-4 py-2 text-sm font-medium ${
                    printerStatus === 'ready' && printerConnected ? 'bg-green-500 text-white' :
                    printerStatus === 'ready' && !printerConnected ? 'bg-orange-500 text-white' :
                    printerStatus === 'detecting' ? 'bg-yellow-500 text-white' :
                    printerStatus === 'error' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}
                >
                  {printerStatus === 'ready' && printerConnected && <><CheckCircle className="h-4 w-4 mr-1" /> Pronta</>}
                  {printerStatus === 'ready' && !printerConnected && selectedPrinter && <><AlertCircle className="h-4 w-4 mr-1" /> Offline</>}
                  {printerStatus === 'ready' && !selectedPrinter && <><Zap className="h-4 w-4 mr-1" /> Selecione Impressora</>}
                  {printerStatus === 'detecting' && <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Detectando...</>}
                  {printerStatus === 'error' && <><AlertCircle className="h-4 w-4 mr-1" /> Erro</>}
                  {printerStatus === 'idle' && <><Zap className="h-4 w-4 mr-1" /> Aguardando</>}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                {/* Seletor de Impressora */}
                {printers.length > 0 && (
                  <div className="flex items-center gap-2 hidden">
                    <Label htmlFor="printer-select" className="text-sm font-medium">Impressora:</Label>
                    <Select value={selectedPrinter || ''} onValueChange={selectPrinter}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione uma impressora" />
                      </SelectTrigger>
                      <SelectContent>
                        {printers.map((printer, index) => {
                          // Usar a mesma lógica de identificação robusta
                          let printerKey = '';
                          if (printer.path) {
                            printerKey = printer.path;
                          } else if (printer.name && typeof printer.name === 'string') {
                            printerKey = printer.name;
                          } else if (printer.vendorId && printer.productId) {
                            printerKey = `${printer.vendorId}:${printer.productId}`;
                          } else {
                            printerKey = String(printer.name || `printer-${index}`);
                          }
                          
                          const isSelected = printerKey === selectedPrinter;
                          return (
                            <SelectItem 
                              key={index} 
                              value={printerKey}
                            >
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Printer className="h-4 w-4" />
                                  {isSelected && (
                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                      printerConnected ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                  )}
                                </div>
                                <span>
                                  {printer.name || printer.path || `Impressora ${index + 1}`}
                                  {printer.platform && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({printer.platform})
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className={`text-xs ml-2 ${printerConnected ? 'text-green-600' : 'text-red-600'}`}>
                                      • {printerConnected ? 'Online' : 'Offline'}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Botões de Ação */}
                <Button 
                  onClick={detectPrinters} 
                  disabled={isDetecting}
                  variant="outline"
                  size="sm"
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isDetecting ? 'Detectando...' : 'Detectar'}
                </Button>
                
                {/* Botão Configurar Impressora */}
                <PrinterSetup>
                  <Button variant="outline" size="sm" className="hidden">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </PrinterSetup>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-6 py-6">
        {/* 1. Total de Pedidos (Histórico) */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalOrders}</div>
            <p className="text-sm text-muted-foreground mt-1">Total histórico</p>
          </CardContent>
        </Card>

        {/* 2. Pedidos Hoje */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Pedidos Hoje</CardTitle>
            <Clock className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{orders.filter(order => isToday(order.created_at)).length}</div>
            <p className="text-sm text-muted-foreground mt-1">Pedidos de hoje</p>
          </CardContent>
        </Card>

        {/* 3. Pedidos no Mês (convertido do Faturamento) */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Pedidos no Mês</CardTitle>
            <Calendar className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{orders.filter(order => isThisMonth(order.created_at)).length}</div>
            <p className="text-sm text-muted-foreground mt-1">Total de pedidos no mês corrente</p>
          </CardContent>
        </Card>

        {/* 4. Em Andamento */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Em Andamento</CardTitle>
            <Package className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{orders.filter(order => !order.impresso).length}</div>
            <p className="text-sm text-muted-foreground mt-1">Aguardando impressão</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Período */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
            <Button
              variant={periodFilter === 'hoje' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodFilter('hoje')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                periodFilter === 'hoje' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Hoje
            </Button>
            <Button
              variant={periodFilter === 'esta-semana' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodFilter('esta-semana')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                periodFilter === 'esta-semana' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Esta Semana
            </Button>
            <Button
              variant={periodFilter === 'este-mes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodFilter('este-mes')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                periodFilter === 'este-mes' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Este Mês
            </Button>
            <Button
              variant={periodFilter === 'total' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodFilter('total')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                periodFilter === 'total' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Total
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Pedidos */}
      <div className="px-6 pb-6 min-h-0 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
            <TabsTrigger value="nao-imprimido" className="text-base">Não Imprimido</TabsTrigger>
            <TabsTrigger value="ja-imprimido" className="text-base">Já Imprimido</TabsTrigger>
            <TabsTrigger value="configurar-layout" className="text-base">🖨️ Configurar Layout</TabsTrigger>
          </TabsList>

        {/* Aba Não Imprimido */}
        <TabsContent value="nao-imprimido" className="flex-1 overflow-auto">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="bg-card/80 border border-border/40 rounded-xl shadow-lg backdrop-blur-sm hover:shadow-xl hover:bg-card/90 transition-all duration-200 hover:scale-[1.01] border-l-4 border-l-yellow-500 aspect-square flex flex-col p-4">
                {/* Header do cartão com número e status */}
                <CardHeader className="p-0 pb-2 flex-shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col">
                      <div className="text-lg font-bold text-white mb-1">
                        #{order.id}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge className="bg-yellow-500 text-white border-0 px-2.5 py-1 font-medium text-xs flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      Pendente
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground truncate">
                      {order.nome_cliente}
                    </CardTitle>
                  </div>
                </CardHeader>

                {/* Conteúdo do pedido */}
                <CardContent className="flex-1 flex flex-col justify-between p-0 space-y-2">
                  {/* Seção do Pedido */}
                  <div className="flex-1">
                    <div className="bg-accent/50 rounded-lg p-2 mb-2 min-h-[60px]">
                      <p className="text-xs leading-tight line-clamp-4">
                        {order.pedido || 'Sem descrição do pedido'}
                      </p>
                    </div>

                    {/* Observações (se existir) */}
                    {order.observacoes && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 mb-2">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 line-clamp-2">
                          {order.observacoes}
                        </p>
                      </div>
                    )}

                    {/* Informações compactas */}
                    <div className="space-y-1">
                      {/* Endereço */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs truncate">
                          {order.endereco || 'Endereço não informado'}
                        </p>
                      </div>

                      {/* Pagamento */}
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs truncate">
                          {order.tipo_pagamento || 'Não informado'}
                        </p>
                      </div>

                      {/* Valor */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <p className="text-sm font-bold text-green-600">
                          {formatPrice(order.valor)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex-shrink-0">
                    <div className="flex gap-1 mb-2">
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPrinted(order.id)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Marcar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2"
                        onClick={() => handlePrintOrder(order)}
                        disabled={printingOrderId === order.id}
                      >
                        {printingOrderId === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Printer className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Botões de Editar e Excluir */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditOrder(order)}
                        className="flex-1 h-7 text-xs hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order)}
                        className="h-7 px-2 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-32 h-full flex flex-col items-center justify-center">
              <Clock className="h-48 w-48 mx-auto mb-12 opacity-30 text-yellow-500" />
              <h3 className="text-4xl font-semibold text-muted-foreground mb-6">
                Nenhum pedido não imprimido
              </h3>
              <p className="text-xl text-muted-foreground">
                Todos os pedidos foram impressos ou não há pedidos no momento
              </p>
            </div>
          )}
        </TabsContent>

        {/* Aba Já Imprimido */}
        <TabsContent value="ja-imprimido" className="flex-1 overflow-auto">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="bg-card/80 border border-border/40 rounded-xl shadow-lg backdrop-blur-sm hover:shadow-xl hover:bg-card/90 transition-all duration-200 hover:scale-[1.01] border-l-4 border-l-green-500 aspect-square flex flex-col p-4">
                {/* Header do cartão com número e status */}
                <CardHeader className="p-0 pb-2 flex-shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col">
                      <div className="text-lg font-bold text-white mb-1">
                        #{order.id}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white border-0 px-2.5 py-1 font-medium text-xs flex items-center gap-1 shrink-0">
                      <Printer className="h-3 w-3" />
                      Impresso
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground truncate">
                      {order.nome_cliente}
                    </CardTitle>
                  </div>
                </CardHeader>

                {/* Conteúdo do pedido */}
                <CardContent className="flex-1 flex flex-col justify-between p-0 space-y-2">
                  {/* Seção do Pedido */}
                  <div className="flex-1">
                    <div className="bg-accent/50 rounded-lg p-2 mb-2 min-h-[60px]">
                      <p className="text-xs leading-tight line-clamp-4">
                        {order.pedido || 'Sem descrição do pedido'}
                      </p>
                    </div>

                    {/* Observações (se existir) */}
                    {order.observacoes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-2">
                        <p className="text-xs text-blue-800 dark:text-blue-200 line-clamp-2">
                          {order.observacoes}
                        </p>
                      </div>
                    )}

                    {/* Informações compactas */}
                    <div className="space-y-1">
                      {/* Endereço */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs truncate">
                          {order.endereco || 'Endereço não informado'}
                        </p>
                      </div>

                      {/* Pagamento */}
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs truncate">
                          {order.tipo_pagamento || 'Não informado'}
                        </p>
                      </div>

                      {/* Valor */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <p className="text-sm font-bold text-green-600">
                          {formatPrice(order.valor)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex-shrink-0">
                    <div className="flex gap-1 mb-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs"
                        onClick={() => handlePrintOrder(order)}
                        disabled={printingOrderId === order.id}
                      >
                        {printingOrderId === order.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Printer className="h-3 w-3 mr-1" />
                        )}
                        Reimprimir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 px-2"
                        onClick={() => updatePrintStatus(order.id, false)}
                        title="Marcar como não impresso"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Botões de Editar e Excluir */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditOrder(order)}
                        className="flex-1 h-7 text-xs hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order)}
                        className="h-7 px-2 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-32 h-full flex flex-col items-center justify-center">
              <CheckCircle2 className="h-48 w-48 mx-auto mb-12 opacity-30 text-green-500" />
              <h3 className="text-4xl font-semibold text-muted-foreground mb-6">
                Nenhum pedido já imprimido ainda
              </h3>
              <p className="text-xl text-muted-foreground">
                Os pedidos impressos aparecerão aqui
              </p>
            </div>
          )}
        </TabsContent>

        {/* Nova Aba: Configurar Layout */}
        <TabsContent value="configurar-layout" className="flex-1 overflow-auto">
          <div className="min-h-screen bg-background">
            
            {/* Header da página */}
            <div className="border-b">
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h1 className="text-2xl font-semibold">
                      Configuração de Layout
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure a ordem dos campos para impressão dos pedidos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interface principal */}
            <div className="max-w-7xl mx-auto p-6">
              
              {/* Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Coluna 1: Campos Disponíveis */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Campos Disponíveis
                      </CardTitle>
                      <CardDescription>Clique para adicionar ao layout</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {AVAILABLE_FIELDS.map((field) => (
                          <Button
                            key={field.key}
                            variant="outline"
                            size="sm"
                            onClick={() => addField(field.key)}
                            className="w-full justify-start text-left h-auto py-2"
                            disabled={field.key !== 'separator' && layoutBlocks.some(block => block.fieldKey === field.key)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="text-sm">{field.label}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna 2: Layout Atual */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Move className="h-4 w-4" />
                        Ordem dos Campos
                      </CardTitle>
                      <CardDescription>Organize a sequência dos campos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {layoutBlocks.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">Nenhum campo adicionado</p>
                            <p className="text-xs text-muted-foreground mt-1">Adicione campos da coluna ao lado</p>
                          </div>
                        ) : (
                          layoutBlocks.sort((a, b) => a.order - b.order).map((block, index) => (
                            <div
                              key={block.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-muted-foreground bg-muted w-6 h-6 rounded-full flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium">
                                  {block.label}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveUp(block.id)}
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveDown(block.id)}
                                  disabled={index === layoutBlocks.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeField(block.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna 3: Preview */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Pré-visualização
                      </CardTitle>
                      <CardDescription>Visualize como ficará o layout final</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="bg-muted p-4 rounded-lg border-2 border-dashed">
                        {layoutPreview ? (
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {layoutPreview}
                          </pre>
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Adicione campos para ver</p>
                            <p className="text-xs mt-1">a pré-visualização do layout</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Ações */}
              <div className="mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-center items-center gap-3">
                      <Button
                        onClick={saveLayout}
                        disabled={layoutBlocks.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Salvar
                      </Button>
                      
                      <Button
                        onClick={resetLayout}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Modal para Criação de Pedido */}
      <Dialog open={isCreateOrderModalOpen} onOpenChange={setIsCreateOrderModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Adicionar Novo Pedido
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar um novo pedido manualmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Nome do Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="nome_cliente" className="font-semibold">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_cliente"
                placeholder="Ex: João Silva"
                value={newOrderForm.nome_cliente}
                onChange={(e) => updateOrderFormField('nome_cliente', e.target.value)}
                disabled={isCreatingOrder}
              />
            </div>

            {/* Endereço */}
            <div className="grid gap-2">
              <Label htmlFor="endereco" className="font-semibold">
                Endereço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endereco"
                placeholder="Ex: Rua das Flores, 123 - Centro"
                value={newOrderForm.endereco}
                onChange={(e) => updateOrderFormField('endereco', e.target.value)}
                disabled={isCreatingOrder}
              />
            </div>

            {/* Descrição do Pedido */}
            <div className="grid gap-2">
              <Label htmlFor="pedido" className="font-semibold">
                Descrição do Pedido <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="pedido"
                placeholder="Ex: 1x Pizza Margherita G, 2x Coca-Cola 350ml"
                value={newOrderForm.pedido}
                onChange={(e) => updateOrderFormField('pedido', e.target.value)}
                disabled={isCreatingOrder}
                rows={3}
              />
            </div>

            {/* Observações */}
            <div className="grid gap-2">
              <Label htmlFor="observacoes" className="font-semibold">
                Observações (Opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Ex: Sem cebola, entregar no portão"
                value={newOrderForm.observacoes}
                onChange={(e) => updateOrderFormField('observacoes', e.target.value)}
                disabled={isCreatingOrder}
                rows={2}
              />
            </div>

            {/* Valor e Tipo de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor" className="font-semibold">
                  Valor (R$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 45.90"
                  value={newOrderForm.valor}
                  onChange={(e) => updateOrderFormField('valor', e.target.value)}
                  disabled={isCreatingOrder}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tipo_pagamento" className="font-semibold">
                  Tipo de Pagamento <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newOrderForm.tipo_pagamento}
                  onValueChange={(value) => updateOrderFormField('tipo_pagamento', value)}
                  disabled={isCreatingOrder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOrderModalOpen(false);
                resetNewOrderForm();
              }}
              disabled={isCreatingOrder}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Criar Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Pedido */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Editar Pedido #{orderToEdit?.id}
            </DialogTitle>
            <DialogDescription>
              Modifique as informações do pedido abaixo. Campos obrigatórios estão marcados com *.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nome do Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="edit-nome-cliente">Nome do Cliente *</Label>
              <Input
                id="edit-nome-cliente"
                value={editOrderForm.nome_cliente}
                onChange={(e) => updateEditOrderForm('nome_cliente', e.target.value)}
                placeholder="Digite o nome do cliente"
              />
            </div>

            {/* Endereço */}
            <div className="grid gap-2">
              <Label htmlFor="edit-endereco">Endereço *</Label>
              <Input
                id="edit-endereco"
                value={editOrderForm.endereco}
                onChange={(e) => updateEditOrderForm('endereco', e.target.value)}
                placeholder="Digite o endereço de entrega"
              />
            </div>

            {/* Pedido */}
            <div className="grid gap-2">
              <Label htmlFor="edit-pedido">Descrição do Pedido *</Label>
              <Textarea
                id="edit-pedido"
                value={editOrderForm.pedido}
                onChange={(e) => updateEditOrderForm('pedido', e.target.value)}
                placeholder="Descreva os itens do pedido"
                rows={3}
              />
            </div>

            {/* Observações */}
            <div className="grid gap-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={editOrderForm.observacoes}
                onChange={(e) => updateEditOrderForm('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>

            {/* Valor e Tipo de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-valor">Valor (R$) *</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editOrderForm.valor}
                  onChange={(e) => updateEditOrderForm('valor', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-tipo-pagamento">Tipo de Pagamento *</Label>
                <Select
                  value={editOrderForm.tipo_pagamento}
                  onValueChange={(value) => updateEditOrderForm('tipo_pagamento', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={isUpdatingOrder}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdateOrder}
              disabled={isUpdatingOrder}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-base">
              <div className="space-y-3 mt-4">
                <p className="font-medium">
                  Você tem certeza que deseja excluir este pedido?
                </p>
                
                {orderToDelete && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Pedido:</span> #{orderToDelete.id}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Cliente:</span> {orderToDelete.nome_cliente}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Valor:</span> {formatPrice(orderToDelete.valor)}
                    </p>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">⚠️ Ação Irreversível</p>
                      <p>Esta ação não pode ser desfeita. O pedido será removido permanentemente do sistema.</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={isDeletingOrder}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeletingOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sim, Excluir Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;
