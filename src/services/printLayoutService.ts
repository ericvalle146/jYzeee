import { PrintLayoutConfig, AvailableField, PrintFieldConfig, FormatConfig } from '../types/printer';
import { Order } from '../types/orders';

// Campos disponíveis do banco de dados baseados na estrutura real
export const AVAILABLE_FIELDS: AvailableField[] = [
  // Informações do Pedido
  { id: 'id', label: 'ID do Pedido', field: 'id', type: 'number', example: '123' },
  { id: 'created_at', label: 'Data/Hora do Pedido', field: 'created_at', type: 'date', format: 'datetime', example: '19/08/2025 14:30' },
  { id: 'status', label: 'Status', field: 'status', type: 'string', example: 'Em andamento' },
  
  // Informações do Cliente
  { id: 'nome_cliente', label: 'Nome do Cliente', field: 'nome_cliente', type: 'string', example: 'João Silva' },
  { id: 'endereco', label: 'Endereço', field: 'endereco', type: 'string', example: 'Rua das Flores, 123' },
  
  // Informações do Pedido
  { id: 'pedido', label: 'Itens do Pedido', field: 'pedido', type: 'string', example: '2x Pizza Margherita' },
  { id: 'observacoes', label: 'Observações', field: 'observacoes', type: 'string', example: 'Sem cebola' },
  
  // Informações Financeiras
  { id: 'valor', label: 'Valor Total', field: 'valor', type: 'number', format: 'currency', example: 'R$ 45,90' },
  { id: 'tipo_pagamento', label: 'Forma de Pagamento', field: 'tipo_pagamento', type: 'string', example: 'PIX' },
];

// Configuração padrão de formatação
export const DEFAULT_FORMAT_CONFIG: FormatConfig = {
  currency: {
    symbol: 'R$',
    decimals: 2,
    separator: ','
  },
  date: {
    format: 'dd/MM/yyyy HH:mm',
    timezone: 'America/Sao_Paulo'
  },
  text: {
    maxLength: 32,
    transform: undefined
  }
};

// ❌ REMOVIDO: Layout hardcoded removido completamente
// O sistema agora usa APENAS layouts dinâmicos da página "Configurar Layout"

class PrintLayoutService {
  private static STORAGE_KEY = 'print_layouts';
  private static DEFAULT_LAYOUT_KEY = 'default_print_layout';
  private isSaving = false; // Guard contra recursão

  // Salvar layout no localStorage - SEM RECURSÃO
  saveLayout(layout: PrintLayoutConfig): void {
    if (this.isSaving) {
      console.warn('⚠️ saveLayout chamado durante operação de salvamento, ignorando para evitar recursão');
      return;
    }
    
    this.isSaving = true;
    try {
      const layouts = this.getLayoutsRaw(); // Usar método raw sem auto-criação
      const existingIndex = layouts.findIndex(l => l.id === layout.id);
      
      if (existingIndex >= 0) {
        layouts[existingIndex] = { ...layout, updated_at: new Date().toISOString() };
      } else {
        layouts.push({ ...layout, created_at: new Date().toISOString() });
      }
      
      localStorage.setItem(PrintLayoutService.STORAGE_KEY, JSON.stringify(layouts));
      console.log(`💾 Layout ${layout.name} salvo com sucesso`);
    } finally {
      this.isSaving = false;
    }
  }

  // Carregar layouts RAW - sem auto-criação (evita recursão)
  private getLayoutsRaw(): PrintLayoutConfig[] {
    const stored = localStorage.getItem(PrintLayoutService.STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    try {
      return JSON.parse(stored) || [];
    } catch (error) {
      console.error('❌ Erro ao parsear layouts salvos:', error);
      return [];
    }
  }

  // Carregar layouts salvos - 100% DINÂMICO SEM RECURSÃO
  getLayouts(): PrintLayoutConfig[] {
    const layouts = this.getLayoutsRaw();
    
    // Se não há layouts, criar um inicial SEM chamar saveLayout
    if (layouts.length === 0) {
      const initialLayout = this.createInitialLayout();
      // Salvar diretamente no localStorage sem usar saveLayout
      localStorage.setItem(PrintLayoutService.STORAGE_KEY, JSON.stringify([initialLayout]));
      console.log('🎨 Layout inicial criado automaticamente');
      return [initialLayout];
    }
    
    return layouts;
  }

  // Criar layout inicial FUNCIONAL para configuração
  private createInitialLayout(): PrintLayoutConfig {
    return {
      id: 'initial_' + Date.now(),
      name: 'Layout Padrão Funcional',
      description: 'Layout inicial funcional. Personalize na página "Configurar Layout".',
      isDefault: true,
      paperWidth: 32,
      
      header: {
        id: 'header',
        name: 'Cabeçalho',
        enabled: true,
        position: 1,
        title: 'PEDIDO DE ENTREGA',
        separator: '='.repeat(32),
        fields: [
          {
            id: 'order_id',
            label: 'ID do Pedido',
            field: 'id',
            enabled: true,
            position: 1,
            prefix: 'Pedido #',
            newLineAfter: true
          },
          {
            id: 'order_date',
            label: 'Data/Hora',
            field: 'created_at',
            enabled: true,
            position: 2,
            format: 'datetime',
            newLineAfter: true
          }
        ]
      },
      
      customerInfo: {
        id: 'customer',
        name: 'Informações do Cliente',
        enabled: true,
        position: 2,
        title: 'CLIENTE',
        separator: '-'.repeat(32),
        fields: [
          {
            id: 'customer_name',
            label: 'Nome',
            field: 'nome_cliente',
            enabled: true,
            position: 1,
            newLineAfter: true
          },
          {
            id: 'customer_address',
            label: 'Endereço',
            field: 'endereco',
            enabled: true,
            position: 2,
            newLineAfter: true
          }
        ]
      },
      
      orderInfo: {
        id: 'order',
        name: 'Informações do Pedido',
        enabled: true,
        position: 3,
        title: 'PEDIDO',
        separator: '-'.repeat(32),
        fields: [
          {
            id: 'order_items',
            label: 'Itens',
            field: 'pedido',
            enabled: true,
            position: 1,
            newLineAfter: true
          },
          {
            id: 'order_notes',
            label: 'Observações',
            field: 'observacoes',
            enabled: true,
            position: 2,
            prefix: 'Obs: ',
            newLineAfter: true
          }
        ]
      },
      
      itemsInfo: {
        id: 'items',
        name: 'Itens do Pedido',
        enabled: false,
        position: 4,
        fields: []
      },
      
      totals: {
        id: 'totals',
        name: 'Totais',
        enabled: true,
        position: 5,
        title: 'VALORES',
        separator: '-'.repeat(32),
        fields: [
          {
            id: 'payment_method',
            label: 'Forma de Pagamento',
            field: 'tipo_pagamento',
            enabled: true,
            position: 1,
            prefix: 'Pagamento: ',
            newLineAfter: true
          },
          {
            id: 'total_amount',
            label: 'Total',
            field: 'valor',
            enabled: true,
            position: 2,
            format: 'currency',
            prefix: 'TOTAL: ',
            newLineAfter: true
          }
        ]
      },
      
      footer: {
        id: 'footer',
        name: 'Rodapé',
        enabled: true,
        position: 6,
        separator: '='.repeat(32),
        fields: [
          {
            id: 'footer_message',
            label: 'Mensagem',
            field: 'footer_message',
            enabled: true,
            position: 1,
            align: 'center',
            newLineAfter: true
          }
        ]
      },
      
      created_at: new Date().toISOString()
    };
  }

  // Obter layout por ID
  getLayout(id: string): PrintLayoutConfig | null {
    const layouts = this.getLayouts();
    return layouts.find(l => l.id === id) || null;
  }

  // Obter layout padrão - 100% DINÂMICO
  getDefaultLayout(): PrintLayoutConfig {
    const defaultId = localStorage.getItem(PrintLayoutService.DEFAULT_LAYOUT_KEY);
    if (defaultId) {
      const layout = this.getLayout(defaultId);
      if (layout) return layout;
    }
    
    // Se não há layout padrão definido, usar o primeiro disponível
    const layouts = this.getLayouts();
    const defaultLayout = layouts.find(l => l.isDefault) || layouts[0];
    
    if (!defaultLayout) {
      // Caso extremo: criar layout inicial se não existir nenhum
      const initialLayout = this.createInitialLayout();
      this.saveLayout(initialLayout);
      return initialLayout;
    }
    
    return defaultLayout;
  }

  // Definir layout padrão
  setDefaultLayout(layoutId: string): void {
    localStorage.setItem(PrintLayoutService.DEFAULT_LAYOUT_KEY, layoutId);
  }

  // Excluir layout - 100% DINÂMICO
  deleteLayout(id: string): boolean {
    const layouts = this.getLayouts();
    
    // Não permitir excluir se for o último layout
    if (layouts.length <= 1) {
      console.warn('❌ Não é possível excluir o último layout. Deve haver pelo menos um layout configurado.');
      return false;
    }
    
    const filtered = layouts.filter(l => l.id !== id);
    localStorage.setItem(PrintLayoutService.STORAGE_KEY, JSON.stringify(filtered));
    
    return true;
  }

  // Formatar valor baseado no tipo
  formatValue(value: any, field: AvailableField, formatConfig: FormatConfig = DEFAULT_FORMAT_CONFIG): string {
    if (value === null || value === undefined) return '';

    switch (field.type) {
      case 'number':
        if (field.format === 'currency') {
          return `${formatConfig.currency.symbol} ${Number(value).toFixed(formatConfig.currency.decimals).replace('.', formatConfig.currency.separator)}`;
        }
        return String(value);
        
      case 'date':
        if (field.format === 'datetime') {
          return new Date(value).toLocaleString('pt-BR', {
            timeZone: formatConfig.date.timezone,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return new Date(value).toLocaleDateString('pt-BR');
        
      case 'string': {
        let text = String(value);
        if (formatConfig.text.maxLength && text.length > formatConfig.text.maxLength) {
          text = text.substring(0, formatConfig.text.maxLength - 3) + '...';
        }
        if (formatConfig.text.transform) {
          switch (formatConfig.text.transform) {
            case 'uppercase': text = text.toUpperCase(); break;
            case 'lowercase': text = text.toLowerCase(); break;
            case 'capitalize': text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); break;
          }
        }
        return text;
      }
        
      default:
        return String(value);
    }
  }

  // Aplicar formatação a um campo
  formatField(fieldConfig: PrintFieldConfig, order: Order, customValues: Record<string, any> = {}): string {
    // Buscar o campo disponível
    const availableField = AVAILABLE_FIELDS.find(f => f.field === fieldConfig.field);
    if (!availableField) return '';

    // Obter valor
    const value = order[fieldConfig.field as keyof Order] || customValues[fieldConfig.field];
    
    // Aplicar formatação
    let formattedValue = this.formatValue(value, availableField);
    
    // Aplicar prefixo e sufixo
    if (fieldConfig.prefix) formattedValue = fieldConfig.prefix + formattedValue;
    if (fieldConfig.suffix) formattedValue = formattedValue + fieldConfig.suffix;
    
    // Aplicar alinhamento
    if (fieldConfig.align && fieldConfig.width) {
      switch (fieldConfig.align) {
        case 'center':
          formattedValue = formattedValue.padStart((formattedValue.length + fieldConfig.width) / 2).padEnd(fieldConfig.width);
          break;
        case 'right':
          formattedValue = formattedValue.padStart(fieldConfig.width);
          break;
        case 'left':
        default:
          formattedValue = formattedValue.padEnd(fieldConfig.width);
          break;
      }
    }
    
    return formattedValue;
  }

  // Gerar texto completo para impressão - 100% DINÂMICO
  generatePrintText(order: Order, layout?: PrintLayoutConfig, customValues: Record<string, any> = {}): string {
    // ⚠️ OBRIGATÓRIO: Layout deve ser fornecido ou carregado dinamicamente
    const activeLayout = layout || this.getDefaultLayout();
    
    if (!activeLayout) {
      throw new Error('❌ ERRO CRÍTICO: Nenhum layout configurado! Configure um layout na página "Configurar Layout" antes de imprimir.');
    }
    
    console.log(`🎨 Gerando impressão com layout dinâmico: ${activeLayout.name} (ID: ${activeLayout.id})`);
    console.log('📋 Configurações do layout:', {
      paperWidth: activeLayout.paperWidth,
      sectionsEnabled: Object.entries(activeLayout).filter(([key, section]) => 
        typeof section === 'object' && section?.enabled
      ).length
    });
    const lines: string[] = [];
    
    // Valores padrão mínimos para funcionamento
    const defaultCustomValues = {
      footer_message: 'Obrigado pela preferência!'
    };
    const allCustomValues = { ...defaultCustomValues, ...customValues };
    
    // Ordenar seções por posição - DINAMICAMENTE baseado na configuração
    const sections = [
      activeLayout.header,
      activeLayout.customerInfo,
      activeLayout.orderInfo,
      activeLayout.itemsInfo,
      activeLayout.totals,
      activeLayout.footer
    ].filter(s => s && s.enabled).sort((a, b) => a.position - b.position);
    
    console.log(`📑 Seções ativas encontradas: ${sections.length}`, sections.map(s => s.name));
    
    sections.forEach((section, sectionIndex) => {
      // Adicionar título da seção
      if (section.title) {
        lines.push(section.title);
      }
      
      // Adicionar separador
      if (section.separator) {
        lines.push(section.separator);
      }
      
      // Processar campos da seção
      const enabledFields = section.fields
        .filter(f => f.enabled)
        .sort((a, b) => a.position - b.position);
      
      enabledFields.forEach(field => {
        const formattedText = this.formatField(field, order, allCustomValues);
        if (formattedText.trim()) {
          lines.push(formattedText);
          
          // Adicionar quebra de linha se configurado
          if (field.newLineAfter) {
            lines.push('');
          }
        }
      });
      
      // Adicionar espaço entre seções (exceto a última)
      if (sectionIndex < sections.length - 1) {
        lines.push('');
      }
    });
    
    return lines.join('\n');
  }
}

export const printLayoutService = new PrintLayoutService();
