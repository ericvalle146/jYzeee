import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Settings, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Copy, 
  Download,
  Upload,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  FileText,
  Printer,
  TestTube
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  PrintLayoutConfig, 
  PrintSectionConfig, 
  PrintFieldConfig, 
  AvailableField 
} from '../types/printer';
import { 
  printLayoutService, 
  AVAILABLE_FIELDS
} from '../services/printLayoutService';
import { dynamicPrintService } from '../services/dynamicPrintService';
import { Order } from '../types/orders';

interface PrintLayoutConfiguratorProps {
  onSave?: (layout: PrintLayoutConfig) => void;
  onPreview?: (layout: PrintLayoutConfig) => void;
}

export const PrintLayoutConfigurator: React.FC<PrintLayoutConfiguratorProps> = ({
  onSave,
  onPreview
}) => {
  const { toast } = useToast();
  
  const [layouts, setLayouts] = useState<PrintLayoutConfig[]>([]);
  const [currentLayout, setCurrentLayout] = useState<PrintLayoutConfig | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('default');
  const [activeSection, setActiveSection] = useState<string>('header');
  const [isEditing, setIsEditing] = useState(false);
  const [testingLayout, setTestingLayout] = useState(false);

  // Carregar layouts na inicialização
  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = () => {
    const savedLayouts = printLayoutService.getLayouts();
    setLayouts(savedLayouts);
    
    const defaultLayout = printLayoutService.getDefaultLayout();
    if (defaultLayout) {
      setCurrentLayout(defaultLayout);
      setSelectedLayoutId(defaultLayout.id);
    }
  };

  const handleLayoutSelect = (layoutId: string) => {
    const layout = printLayoutService.getLayout(layoutId);
    if (layout) {
      setCurrentLayout(layout);
      setSelectedLayoutId(layoutId);
      setIsEditing(false);
    }
  };

  const handleSaveLayout = () => {
    if (!currentLayout) {
      toast({
        title: "❌ Erro",
        description: "Nenhum layout selecionado para salvar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      printLayoutService.saveLayout(currentLayout);
      loadLayouts();
      setIsEditing(false);
      
      toast({
        title: "✅ Layout Salvo",
        description: `Layout "${currentLayout.name}" salvo com sucesso!`,
      });
      
      onSave?.(currentLayout);
    } catch (error) {
      toast({
        title: "❌ Erro ao Salvar",
        description: "Erro ao salvar o layout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewLayout = () => {
    const newLayout: PrintLayoutConfig = {
      id: `layout_${Date.now()}`,
      name: `Novo Layout ${layouts.length + 1}`,
      description: 'Layout criado pelo usuário',
      isDefault: false,
      paperWidth: 32,
      
      header: {
        id: 'header',
        name: 'Cabeçalho',
        enabled: true,
        position: 1,
        title: 'NOVO PEDIDO',
        separator: '='.repeat(32),
        fields: []
      },
      
      customerInfo: {
        id: 'customer',
        name: 'Informações do Cliente',
        enabled: true,
        position: 2,
        title: 'CLIENTE',
        separator: '-'.repeat(32),
        fields: []
      },
      
      orderInfo: {
        id: 'order',
        name: 'Informações do Pedido',
        enabled: true,
        position: 3,
        fields: []
      },
      
      itemsInfo: {
        id: 'items',
        name: 'Itens do Pedido',
        enabled: true,
        position: 4,
        fields: []
      },
      
      totals: {
        id: 'totals',
        name: 'Totais',
        enabled: true,
        position: 5,
        fields: []
      },
      
      footer: {
        id: 'footer',
        name: 'Rodapé',
        enabled: true,
        position: 6,
        fields: []
      },
      
      created_at: new Date().toISOString()
    };
    
    setCurrentLayout(newLayout);
    setSelectedLayoutId(newLayout.id);
    setIsEditing(true);
  };

  const handleDuplicateLayout = () => {
    if (!currentLayout) {
      toast({
        title: "❌ Erro",
        description: "Nenhum layout selecionado para duplicar.",
        variant: "destructive",
      });
      return;
    }
    
    const duplicatedLayout: PrintLayoutConfig = {
      ...currentLayout,
      id: `layout_${Date.now()}`,
      name: `${currentLayout.name} (Cópia)`,
      isDefault: false
    };
    
    setCurrentLayout(duplicatedLayout);
    setSelectedLayoutId(duplicatedLayout.id);
    setIsEditing(true);
  };

  const handleDeleteLayout = () => {
    if (currentLayout.id === 'default') {
      toast({
        title: "⚠️ Não é possível excluir",
        description: "O layout padrão não pode ser excluído.",
        variant: "destructive",
      });
      return;
    }

    if (printLayoutService.deleteLayout(currentLayout.id)) {
      toast({
        title: "🗑️ Layout Excluído",
        description: `Layout "${currentLayout.name}" foi excluído.`,
      });
      loadLayouts();
      handleLayoutSelect('default');
    }
  };

  const handlePreview = () => {
    onPreview?.(currentLayout);
  };

  // Pedido de exemplo para testes
  const SAMPLE_ORDER: Order = {
    id: 999,
    created_at: new Date().toISOString(),
    nome_cliente: 'João da Silva',
    endereco: 'Rua das Flores, 123 - Centro',
    pedido: '2x Pizza Margherita\n1x Coca-Cola 2L\n1x Batata Frita',
    observacoes: 'Sem cebola na pizza, entrega rápida',
    valor: 65.90,
    tipo_pagamento: 'PIX',
    status: 'Em preparação'
  };

  const handleTestLayout = async () => {
    if (!currentLayout) {
      toast({
        title: "❌ Erro",
        description: "Nenhum layout selecionado para testar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setTestingLayout(true);
      
      console.log('🧪 Testando layout dinâmico:', currentLayout.name);
      
      // Gerar preview usando o serviço dinâmico
      const preview = dynamicPrintService.generatePreview(SAMPLE_ORDER, currentLayout.id);
      
      if (preview.success && preview.content) {
        // Exibir preview em um toast ou modal
        toast({
          title: "🧪 Teste de Layout Realizado",
          description: `Layout "${currentLayout.name}" testado com sucesso! Verifique o console para detalhes.`
        });
        
        console.log('📄 Preview do layout:', preview.content);
        
        // Simular teste de impressão (sem imprimir realmente)
        const validation = dynamicPrintService.syncConfigurations();
        if (!validation.success && validation.issues) {
          console.warn('⚠️ Problemas encontrados:', validation.issues);
          toast({
            title: "⚠️ Avisos no Layout",
            description: `${validation.issues.length} problema(s) encontrado(s). Verifique o console.`,
            variant: "destructive"
          });
        }
        
      } else {
        throw new Error(preview.error || 'Erro desconhecido no teste');
      }
      
    } catch (error) {
      console.error('❌ Erro no teste de layout:', error);
      toast({
        title: "❌ Erro no Teste",
        description: `Falha ao testar o layout: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTestingLayout(false);
    }
  };

  const updateLayoutBasicInfo = (field: keyof PrintLayoutConfig, value: any) => {
    setCurrentLayout(prev => ({
      ...prev,
      [field]: value
    }));
    setIsEditing(true);
  };

  const updateSection = (sectionKey: keyof PrintLayoutConfig, updates: Partial<PrintSectionConfig>) => {
    setCurrentLayout(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey] as PrintSectionConfig,
        ...updates
      }
    }));
    setIsEditing(true);
  };

  const updateField = (sectionKey: keyof PrintLayoutConfig, fieldIndex: number, updates: Partial<PrintFieldConfig>) => {
    setCurrentLayout(prev => {
      const section = prev[sectionKey] as PrintSectionConfig;
      const newFields = [...section.fields];
      newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
      
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          fields: newFields
        }
      };
    });
    setIsEditing(true);
  };

  const addField = (sectionKey: keyof PrintLayoutConfig, availableField: AvailableField) => {
    const newField: PrintFieldConfig = {
      id: `${availableField.id}_${Date.now()}`,
      label: availableField.label,
      field: availableField.field,
      enabled: true,
      position: getCurrentSection(sectionKey).fields.length + 1,
      format: availableField.format,
      align: 'left',
      newLineAfter: true
    };

    setCurrentLayout(prev => {
      const section = prev[sectionKey] as PrintSectionConfig;
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          fields: [...section.fields, newField]
        }
      };
    });
    setIsEditing(true);
  };

  const removeField = (sectionKey: keyof PrintLayoutConfig, fieldIndex: number) => {
    setCurrentLayout(prev => {
      const section = prev[sectionKey] as PrintSectionConfig;
      const newFields = section.fields.filter((_, index) => index !== fieldIndex);
      
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          fields: newFields
        }
      };
    });
    setIsEditing(true);
  };

  const moveField = (sectionKey: keyof PrintLayoutConfig, fieldIndex: number, direction: 'up' | 'down') => {
    setCurrentLayout(prev => {
      const section = prev[sectionKey] as PrintSectionConfig;
      const newFields = [...section.fields];
      
      if (direction === 'up' && fieldIndex > 0) {
        [newFields[fieldIndex], newFields[fieldIndex - 1]] = [newFields[fieldIndex - 1], newFields[fieldIndex]];
      } else if (direction === 'down' && fieldIndex < newFields.length - 1) {
        [newFields[fieldIndex], newFields[fieldIndex + 1]] = [newFields[fieldIndex + 1], newFields[fieldIndex]];
      }
      
      // Reordenar posições
      newFields.forEach((field, index) => {
        field.position = index + 1;
      });
      
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          fields: newFields
        }
      };
    });
    setIsEditing(true);
  };

  const getCurrentSection = (sectionKey: keyof PrintLayoutConfig): PrintSectionConfig => {
    return currentLayout[sectionKey] as PrintSectionConfig;
  };

  const getAvailableFieldsForSection = (sectionKey: string): AvailableField[] => {
    // Filtrar campos baseado na seção
    switch (sectionKey) {
      case 'header':
        return AVAILABLE_FIELDS.filter(f => ['id', 'created_at'].includes(f.field));
      case 'customerInfo':
        return AVAILABLE_FIELDS.filter(f => ['nome_cliente', 'endereco'].includes(f.field));
      case 'orderInfo':
        return AVAILABLE_FIELDS.filter(f => ['status'].includes(f.field));
      case 'itemsInfo':
        return AVAILABLE_FIELDS.filter(f => ['pedido', 'observacoes'].includes(f.field));
      case 'totals':
        return AVAILABLE_FIELDS.filter(f => ['valor', 'tipo_pagamento'].includes(f.field));
      default:
        return AVAILABLE_FIELDS;
    }
  };

  const sectionTabs = [
    { key: 'header', label: 'Cabeçalho', section: currentLayout.header },
    { key: 'customerInfo', label: 'Cliente', section: currentLayout.customerInfo },
    { key: 'orderInfo', label: 'Pedido', section: currentLayout.orderInfo },
    { key: 'itemsInfo', label: 'Itens', section: currentLayout.itemsInfo },
    { key: 'totals', label: 'Totais', section: currentLayout.totals },
    { key: 'footer', label: 'Rodapé', section: currentLayout.footer },
  ];

  return (
    <div className="space-y-6">
      {/* Header de Controle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Layout de Impressão
              </CardTitle>
              <CardDescription>
                Configure como os pedidos serão impressos personalizando campos e formatação
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Não Salvo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seleção de Layout */}
            <div className="space-y-2">
              <Label>Layout Ativo</Label>
              <Select value={selectedLayoutId} onValueChange={handleLayoutSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um layout" />
                </SelectTrigger>
                <SelectContent>
                  {layouts.map(layout => (
                    <SelectItem key={layout.id} value={layout.id}>
                      <div className="flex items-center gap-2">
                        <span>{layout.name}</span>
                        {layout.isDefault && (
                          <Badge variant="secondary" className="text-xs">Padrão</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome do Layout */}
            <div className="space-y-2">
              <Label>Nome do Layout</Label>
              <Input
                value={currentLayout.name}
                onChange={(e) => updateLayoutBasicInfo('name', e.target.value)}
                placeholder="Nome do layout"
              />
            </div>

            {/* Largura do Papel */}
            <div className="space-y-2">
              <Label>Largura (caracteres)</Label>
              <Input
                type="number"
                value={currentLayout.paperWidth}
                onChange={(e) => updateLayoutBasicInfo('paperWidth', parseInt(e.target.value) || 32)}
                min={20}
                max={80}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button onClick={handleSaveLayout} disabled={!isEditing}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Layout
            </Button>
            <Button onClick={handlePreview} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button 
              onClick={handleTestLayout} 
              variant="outline"
              disabled={testingLayout}
              className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testingLayout ? 'Testando...' : 'Testar Layout Dinâmico'}
            </Button>
            <Button onClick={handleCreateNewLayout} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Novo Layout
            </Button>
            <Button onClick={handleDuplicateLayout} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
            {currentLayout.id !== 'default' && (
              <Button onClick={handleDeleteLayout} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor de Seções */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Seções</CardTitle>
          <CardDescription>
            Configure cada seção do layout de impressão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="grid w-full grid-cols-6">
              {sectionTabs.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                  {tab.label}
                  {!tab.section.enabled && (
                    <span className="ml-1 text-gray-400">⚪</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {sectionTabs.map(tab => (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4">
                <SectionEditor
                  section={tab.section}
                  sectionKey={tab.key as keyof PrintLayoutConfig}
                  availableFields={getAvailableFieldsForSection(tab.key)}
                  onUpdateSection={(updates) => updateSection(tab.key as keyof PrintLayoutConfig, updates)}
                  onUpdateField={(fieldIndex, updates) => updateField(tab.key as keyof PrintLayoutConfig, fieldIndex, updates)}
                  onAddField={(field) => addField(tab.key as keyof PrintLayoutConfig, field)}
                  onRemoveField={(fieldIndex) => removeField(tab.key as keyof PrintLayoutConfig, fieldIndex)}
                  onMoveField={(fieldIndex, direction) => moveField(tab.key as keyof PrintLayoutConfig, fieldIndex, direction)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para editar uma seção específica
interface SectionEditorProps {
  section: PrintSectionConfig;
  sectionKey: string;
  availableFields: AvailableField[];
  onUpdateSection: (updates: Partial<PrintSectionConfig>) => void;
  onUpdateField: (fieldIndex: number, updates: Partial<PrintFieldConfig>) => void;
  onAddField: (field: AvailableField) => void;
  onRemoveField: (fieldIndex: number) => void;
  onMoveField: (fieldIndex: number, direction: 'up' | 'down') => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  availableFields,
  onUpdateSection,
  onUpdateField,
  onAddField,
  onRemoveField,
  onMoveField
}) => {
  return (
    <div className="space-y-6">
      {/* Configurações da Seção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações da Seção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={section.enabled}
              onCheckedChange={(enabled) => onUpdateSection({ enabled })}
            />
            <Label>Seção Ativa</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={section.title || ''}
                onChange={(e) => onUpdateSection({ title: e.target.value })}
                placeholder="Título opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Separador</Label>
              <Input
                value={section.separator || ''}
                onChange={(e) => onUpdateSection({ separator: e.target.value })}
                placeholder="Ex: ========"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campos da Seção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Campos da Seção</CardTitle>
            <Select onValueChange={(fieldId) => {
              const field = availableFields.find(f => f.id === fieldId);
              if (field) onAddField(field);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Adicionar campo" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map(field => (
                  <SelectItem key={field.id} value={field.id}>
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <p className="text-xs text-gray-500">{field.example}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {section.fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                fieldIndex={index}
                isFirst={index === 0}
                isLast={index === section.fields.length - 1}
                onUpdate={(updates) => onUpdateField(index, updates)}
                onRemove={() => onRemoveField(index)}
                onMove={(direction) => onMoveField(index, direction)}
              />
            ))}
            
            {section.fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum campo configurado</p>
                <p className="text-sm">Use o seletor acima para adicionar campos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para editar um campo específico
interface FieldEditorProps {
  field: PrintFieldConfig;
  fieldIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updates: Partial<PrintFieldConfig>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMove
}) => {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          {/* Controles de Ordem */}
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMove('up')}
              disabled={isFirst}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMove('down')}
              disabled={isLast}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Configurações do Campo */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.enabled}
                  onCheckedChange={(enabled) => onUpdate({ enabled })}
                />
                <Label className="font-medium">{field.label}</Label>
                <Badge variant="outline" className="text-xs">
                  {field.field}
                </Badge>
              </div>
              <Button size="sm" variant="destructive" onClick={onRemove}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Prefixo</Label>
                <Input
                  value={field.prefix || ''}
                  onChange={(e) => onUpdate({ prefix: e.target.value })}
                  placeholder="Ex: Total: "
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Sufixo</Label>
                <Input
                  value={field.suffix || ''}
                  onChange={(e) => onUpdate({ suffix: e.target.value })}
                  placeholder="Ex:  (obrigatório)"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Alinhamento</Label>
                <Select
                  value={field.align || 'left'}
                  onValueChange={(align) => onUpdate({ align: align as 'left' | 'center' | 'right' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Largura</Label>
                <Input
                  type="number"
                  value={field.width || ''}
                  onChange={(e) => onUpdate({ width: parseInt(e.target.value) || undefined })}
                  placeholder="Auto"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={field.newLineAfter || false}
                onCheckedChange={(newLineAfter) => onUpdate({ newLineAfter })}
              />
              <Label className="text-sm">Quebrar linha após este campo</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
