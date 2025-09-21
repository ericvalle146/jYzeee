import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Save,
  GripVertical,
  X,
  Hash,
  User,
  MapPin,
  FileText,
  DollarSign,
  CreditCard,
  Calendar,
  Package
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { CustomLayoutService } from '../services/customLayoutService';

// Variáveis disponíveis do banco de dados
const DATABASE_VARIABLES = [
  { id: 'id', label: 'ID do Pedido', icon: Hash, example: '123', color: 'bg-blue-100 text-blue-800' },
  { id: 'nome_cliente', label: 'Nome do Cliente', icon: User, example: 'João Silva', color: 'bg-green-100 text-green-800' },
  { id: 'endereco', label: 'Endereço', icon: MapPin, example: 'Rua das Flores, 123', color: 'bg-purple-100 text-purple-800' },
  { id: 'pedido', label: 'Itens do Pedido', icon: FileText, example: '2x Pizza Margherita', color: 'bg-orange-100 text-orange-800' },
  { id: 'observacoes', label: 'Observações', icon: Type, example: 'Sem cebola', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'valor', label: 'Valor Total', icon: DollarSign, example: 'R$ 85,80', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'tipo_pagamento', label: 'Forma de Pagamento', icon: CreditCard, example: 'PIX', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'status', label: 'Status', icon: Type, example: 'Confirmado', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'created_at', label: 'Data/Hora', icon: Calendar, example: '19/08/2025 14:30', color: 'bg-pink-100 text-pink-800' },
];

interface DroppedVariable {
  id: string;
  variable: typeof DATABASE_VARIABLES[0];
  x: number;
  y: number;
  text?: string;
}

interface SimplePrintLayoutEditorProps {
  onSave?: (layout: string) => void;
  onPreview?: (layout: string) => void;
}

export const SimplePrintLayoutEditor: React.FC<SimplePrintLayoutEditorProps> = ({
  onSave,
  onPreview
}) => {
  const { toast } = useToast();
  const [droppedVariables, setDroppedVariables] = useState<DroppedVariable[]>([]);
  const [freeText, setFreeText] = useState('');
  const [draggedVariable, setDraggedVariable] = useState<typeof DATABASE_VARIABLES[0] | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar layout salvo na inicialização
  useEffect(() => {
    const savedLayout = CustomLayoutService.getCustomLayout();
    setFreeText(savedLayout);
  }, []);

  const handleDragStart = (variable: typeof DATABASE_VARIABLES[0]) => {
    setDraggedVariable(variable);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedVariable || !dropZoneRef.current) return;

    const rect = dropZoneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newVariable: DroppedVariable = {
      id: `${draggedVariable.id}_${Date.now()}`,
      variable: draggedVariable,
      x,
      y
    };

    setDroppedVariables(prev => [...prev, newVariable]);
    setDraggedVariable(null);

    toast({
      title: "✅ Variável Adicionada",
      description: `${draggedVariable.label} foi adicionada ao layout`,
    });
  };

  const removeVariable = (id: string) => {
    setDroppedVariables(prev => prev.filter(v => v.id !== id));
  };

  const updateVariableText = (id: string, text: string) => {
    setDroppedVariables(prev => 
      prev.map(v => v.id === id ? { ...v, text } : v)
    );
  };

  const generateLayout = () => {
    // Usar o texto livre como layout principal
    // As variáveis arrastadas serão apenas para visualização/exemplo
    let layout = freeText.trim();
    
    if (!layout) {
      layout = 'Digite seu layout personalizado...';
    }
    
    return layout;
  };

  const getPreviewText = () => {
    const layout = generateLayout();
    return CustomLayoutService.generatePreview(layout);
  };

  const handleSave = () => {
    const layout = generateLayout();
    
    // Validar layout
    const validation = CustomLayoutService.validateLayout(layout);
    
    if (!validation.isValid) {
      toast({
        title: "❌ Erro no Layout",
        description: `Problemas encontrados: ${validation.errors.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Salvar layout
    CustomLayoutService.saveCustomLayout(layout);
    
    toast({
      title: "💾 Layout Salvo com Sucesso!",
      description: validation.warnings.length > 0 
        ? `Salvo com avisos: ${validation.warnings.join(', ')}` 
        : "Seu layout personalizado foi salvo e será usado nas impressões!",
    });
    
    onSave?.(layout);
  };

  const handlePreview = () => {
    const layout = generateLayout();
    const previewText = getPreviewText();
    onPreview?.(previewText);
  };

  const handleDownload = () => {
    const layout = generateLayout();
    CustomLayoutService.exportLayout(layout);
    
    toast({
      title: "📥 Download Iniciado",
      description: "Arquivo de layout baixado com sucesso!",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await CustomLayoutService.importLayout(file);
      setFreeText(content);
      
      toast({
        title: "📤 Layout Importado",
        description: "Arquivo carregado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro na Importação",
        description: error instanceof Error ? error.message : "Erro ao carregar arquivo",
        variant: "destructive",
      });
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSavedLayout = () => {
    const saved = CustomLayoutService.getCustomLayout();
    setFreeText(saved);
    toast({
      title: "📂 Layout Carregado",
      description: "Layout salvo foi restaurado no editor",
    });
  };

  const resetToDefault = () => {
    CustomLayoutService.resetToDefault();
    const defaultLayout = CustomLayoutService.getCustomLayout();
    setFreeText(defaultLayout);
    
    toast({
      title: "� Layout Restaurado",
      description: "Layout padrão foi restaurado",
    });
  };

  const insertVariable = (variableId: string) => {
    const variable = `{${variableId}}`;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFreeText(newText);
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setFreeText(prev => prev + variable);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-[600px]">
      {/* Painel de Variáveis - Esquerda */}
      <div className="col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Variáveis Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-3">
              Clique para inserir no cursor:
            </p>
            {DATABASE_VARIABLES.map(variable => {
              const Icon = variable.icon;
              return (
                <div
                  key={variable.id}
                  onClick={() => insertVariable(variable.id)}
                  className="cursor-pointer p-2 border rounded-lg hover:shadow-md transition-all bg-white hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{variable.label}</p>
                      <p className="text-xs text-gray-500 truncate">{variable.example}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs mt-1 ${variable.color}`}>
                    {`{${variable.id}}`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Editor Principal - Centro */}
      <div className="col-span-2">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Editor de Layout
              </CardTitle>
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" />
                  Importar
                </Button>
                <Button size="sm" variant="outline" onClick={loadSavedLayout}>
                  📂 Carregar
                </Button>
                <Button size="sm" variant="outline" onClick={resetToDefault}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Padrão
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Editor de Texto Principal */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600">✏️ Digite seu layout personalizado:</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handlePreview}>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                </div>
              </div>
              
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Digite seu layout aqui... Use as variáveis do lado esquerdo clicando nelas para inserir no texto."
                className="min-h-[400px] text-sm font-mono resize-none"
                style={{ fontFamily: 'monospace' }}
              />
              
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 font-medium">
                  💡 Dicas rápidas:
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Clique nas variáveis à esquerda para inserir no texto</li>
                  <li>• Use {`{nome_cliente}`}, {`{pedido}`}, {`{valor}`} etc.</li>
                  <li>• Adicione linhas, separadores e texto fixo como quiser</li>
                  <li>• Salve e teste imprimindo um pedido!</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Preview - Direita */}
      <div className="col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono leading-relaxed max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {getPreviewText()}
              </pre>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button size="sm" variant="outline" onClick={handleDownload} className="w-full">
                <Download className="h-3 w-3 mr-2" />
                Baixar Layout
              </Button>
              
              {(() => {
                const stats = CustomLayoutService.getLayoutStats(generateLayout());
                const validation = CustomLayoutService.validateLayout(generateLayout());
                
                return (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📝 Linhas: {stats.lines}</p>
                    <p>🔤 Caracteres: {stats.characters}</p>
                    <p>🔧 Variáveis: {stats.variables}</p>
                    <p>📏 Alt. Est.: {stats.estimatedHeight}mm</p>
                    
                    {validation.warnings.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-yellow-700 text-xs font-medium">⚠️ Avisos:</p>
                        {validation.warnings.map((warning, i) => (
                          <p key={i} className="text-yellow-600 text-xs">{warning}</p>
                        ))}
                      </div>
                    )}
                    
                    {validation.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-red-700 text-xs font-medium">❌ Erros:</p>
                        {validation.errors.map((error, i) => (
                          <p key={i} className="text-red-600 text-xs">{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
