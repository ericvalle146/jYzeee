import { Order } from '../types/orders';

export interface LayoutVariable {
  id: string;
  label: string;
  value: (order: Order) => string;
}

// Mapeamento das variáveis do banco de dados
export const LAYOUT_VARIABLES: LayoutVariable[] = [
  {
    id: 'id',
    label: 'ID do Pedido',
    value: (order) => `#${order.id}`
  },
  {
    id: 'nome_cliente',
    label: 'Nome do Cliente',
    value: (order) => order.nome_cliente || 'Cliente não informado'
  },
  {
    id: 'endereco',
    label: 'Endereço',
    value: (order) => order.endereco || order.endereço || 'Endereço não informado'
  },
  {
    id: 'pedido',
    label: 'Itens do Pedido',
    value: (order) => order.pedido || 'Pedido não informado'
  },
  {
    id: 'observacoes',
    label: 'Observações',
    value: (order) => order.observacoes || order.observações || ''
  },
  {
    id: 'valor',
    label: 'Valor Total',
    value: (order) => {
      // Garantir que é um número válido
      const numericValue = typeof order.valor === 'number' 
        ? order.valor 
        : parseFloat(String(order.valor)) || 0;
      
      // 🔧 FORMATAÇÃO SIMPLES PARA IMPRESSORA ESC/POS
      // Usar apenas caracteres ASCII básicos que a impressora entende
      const formatted = `R$ ${numericValue.toFixed(2).replace('.', ',')}`;
      
      return formatted;
    }
  },
  {
    id: 'tipo_pagamento',
    label: 'Forma de Pagamento',
    value: (order) => order.tipo_pagamento || 'Não informado'
  },
  {
    id: 'created_at',
    label: 'Data/Hora',
    value: (order) => new Date(order.created_at).toLocaleString('pt-BR')
  }
];

export class CustomLayoutService {
  private static readonly STORAGE_KEY = 'simple_print_layout';
  private static readonly DEFAULT_LAYOUT = `
=================================
        SEU RESTAURANTE
=================================

PEDIDO #{id}
Data: {created_at}

CLIENTE: {nome_cliente}
ENDEREÇO: {endereco}

---------------------------------
PEDIDO:
{pedido}

{observacoes}
---------------------------------

FORMA DE PAGAMENTO: {tipo_pagamento}
VALOR TOTAL: {valor}

=================================
   Obrigado pela preferência!
=================================
`.trim();

  /**
   * Obter o layout personalizado do localStorage
   */
  static getCustomLayout(): string {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || this.DEFAULT_LAYOUT;
  }

  /**
   * Salvar layout personalizado no localStorage
   */
  static saveCustomLayout(layout: string): void {
    localStorage.setItem(this.STORAGE_KEY, layout);
  }

  /**
   * Processar layout com dados do pedido
   */
  static processLayout(order: Order, customLayout?: string): string {
    const layout = customLayout || this.getCustomLayout();
    
    console.log('🔧 CustomLayoutService.processLayout - INICIANDO');
    console.log('📋 Dados recebidos:', order);
    console.log('📄 Layout recebido:', layout);
    
    let processedLayout = layout;

    // Substituir todas as variáveis pelos valores reais
    LAYOUT_VARIABLES.forEach(variable => {
      const placeholder = `{${variable.id}}`;
      const value = variable.value(order);
      
      // Substituir todas as ocorrências da variável
      processedLayout = processedLayout.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        value
      );
    });

    // Limpar linhas vazias duplicadas e formatar
    processedLayout = processedLayout
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // Máximo 2 quebras de linha consecutivas

    return processedLayout;
  }

  /**
   * Gerar preview do layout com dados de exemplo
   */
  static generatePreview(customLayout?: string): string {
    const exampleOrder: Order = {
      id: 123,
      nome_cliente: 'João Silva',
      endereco: 'Rua das Flores, 123 - Centro',
      pedido: '2x Pizza Margherita (Grande)\n1x Refrigerante 2L\n1x Sobremesa',
      observacoes: 'Sem cebola na pizza, entregar no portão azul',
      valor: 85.80,
      tipo_pagamento: 'PIX',
      created_at: new Date().toISOString(),
      impresso: false
    };

    return this.processLayout(exampleOrder, customLayout);
  }

  /**
   * Limpar todos os dados de layout salvos (para debug)
   */
  static clearAllLayouts(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('custom-layout-fields');
    localStorage.removeItem('print_layouts');
    localStorage.removeItem('default_print_layout');
    console.log('🗑️ Todos os layouts salvos foram limpos!');
  }

  /**
   * Validar se o layout contém variáveis válidas
   */
  static validateLayout(layout: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Encontrar todas as variáveis no layout
    const variableMatches = layout.match(/\{[^}]+\}/g) || [];
    
    variableMatches.forEach(match => {
      const variableName = match.slice(1, -1); // Remove { }
      
      const isValidVariable = LAYOUT_VARIABLES.some(v => v.id === variableName);
      
      if (!isValidVariable) {
        errors.push(`Variável inválida: ${match}`);
      }
    });

    // Verificar se tem pelo menos o número do pedido
    if (!layout.includes('{id}')) {
      warnings.push('Recomendamos incluir o ID do pedido {id} para identificação');
    }

    // Verificar se tem informações básicas
    const basicFields = ['nome_cliente', 'pedido', 'valor'];
    const missingBasicFields = basicFields.filter(field => !layout.includes(`{${field}}`));
    
    if (missingBasicFields.length > 0) {
      warnings.push(`Campos básicos não incluídos: ${missingBasicFields.map(f => `{${f}}`).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Obter estatísticas do layout
   */
  static getLayoutStats(layout: string): {
    lines: number;
    characters: number;
    variables: number;
    estimatedHeight: number;
  } {
    const lines = layout.split('\n').length;
    const characters = layout.length;
    const variables = (layout.match(/\{[^}]+\}/g) || []).length;
    
    // Estimar altura em mm (considerando fonte de 12pt ≈ 4mm por linha)
    const estimatedHeight = lines * 4;

    return {
      lines,
      characters,
      variables,
      estimatedHeight
    };
  }

  /**
   * Resetar para layout padrão
   */
  static resetToDefault(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Exportar layout para arquivo
   */
  static exportLayout(layout?: string): void {
    const content = layout || this.getCustomLayout();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-impressao-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Importar layout de arquivo
   */
  static async importLayout(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          resolve(content);
        } else {
          reject(new Error('Arquivo vazio ou inválido'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }
}

export default CustomLayoutService;
