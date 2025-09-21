// Tipos para configuração de layout de impressão

export interface PrintFieldConfig {
  id: string;
  label: string;
  field: string;               // Nome do campo no banco
  enabled: boolean;
  position: number;            // Ordem de exibição
  format?: string;             // Formato especial (currency, date, etc.)
  width?: number;              // Largura em caracteres
  align?: 'left' | 'center' | 'right';
  prefix?: string;             // Texto antes do valor
  suffix?: string;             // Texto depois do valor
  newLineAfter?: boolean;      // Quebra linha após este campo
}

export interface PrintSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  position: number;
  fields: PrintFieldConfig[];
  separator?: string;          // Separador da seção
  title?: string;              // Título da seção
}

export interface PrintLayoutConfig {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  paperWidth: number;          // Largura em caracteres (padrão 32 para 58mm)
  header: PrintSectionConfig;
  orderInfo: PrintSectionConfig;
  customerInfo: PrintSectionConfig;
  itemsInfo: PrintSectionConfig;
  totals: PrintSectionConfig;
  footer: PrintSectionConfig;
  created_at?: string;
  updated_at?: string;
}

// Campos disponíveis do banco de dados
export interface AvailableField {
  id: string;
  label: string;
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  description?: string;
  example?: string;
}

// Configuração de formatação
export interface FormatConfig {
  currency: {
    symbol: string;
    decimals: number;
    separator: string;
  };
  date: {
    format: string;
    timezone?: string;
  };
  text: {
    maxLength?: number;
    transform?: 'uppercase' | 'lowercase' | 'capitalize';
  };
}
