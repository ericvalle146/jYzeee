import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Printer,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { printLayoutService } from '../services/printLayoutService';
import { PrintLayoutConfig } from '../types/printer';
import { Order } from '../types/orders';
import { useUnifiedPrinter } from '../hooks/useUnifiedPrinter';
import { NoLayoutsError } from './DynamicLayoutWarning';

interface PrintLayoutSelectorProps {
  order: Order;
  onLayoutChange?: (layoutId: string) => void;
  onPrint?: (layoutId: string) => void;
  className?: string;
}

export const PrintLayoutSelector: React.FC<PrintLayoutSelectorProps> = ({
  order,
  onLayoutChange,
  onPrint,
  className
}) => {
  const { toast } = useToast();
  const { printOrder, printing, selectedPrinter } = useUnifiedPrinter();
  
  const [layouts, setLayouts] = useState<PrintLayoutConfig[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('default');
  const [previewText, setPreviewText] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Carregar layouts na inicialização
  useEffect(() => {
    loadLayouts();
  }, []);

  // Atualizar preview quando layout ou pedido mudar
  useEffect(() => {
    updatePreview();
  }, [selectedLayoutId, order]);

  const loadLayouts = () => {
    const savedLayouts = printLayoutService.getLayouts();
    setLayouts(savedLayouts);
    
    const defaultLayout = printLayoutService.getDefaultLayout();
    setSelectedLayoutId(defaultLayout.id);
    
    console.log(`📋 ${savedLayouts.length} layouts carregados`);
  };

  const updatePreview = () => {
    try {
      const layout = printLayoutService.getLayout(selectedLayoutId);
      if (layout) {
        const preview = printLayoutService.generatePrintText(order, layout);
        setPreviewText(preview);
        console.log(`👁️ Preview atualizado para layout: ${layout.name}`);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      toast({
        title: "❌ Erro no Preview",
        description: "Não foi possível gerar o preview do layout",
        variant: "destructive"
      });
    }
  };

  const handleLayoutSelect = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    onLayoutChange?.(layoutId);
    
    const layout = layouts.find(l => l.id === layoutId);
    console.log(`🎨 Layout selecionado: ${layout?.name} (ID: ${layoutId})`);
    
    toast({
      title: "🎨 Layout Selecionado",
      description: `Layout "${layout?.name}" será usado na impressão`
    });
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
      toast({
        title: "⚠️ Impressora Necessária",
        description: "Selecione uma impressora antes de imprimir",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`🖨️ Iniciando impressão com layout: ${selectedLayoutId}`);
      
      const success = await printOrder(order, undefined, undefined, selectedLayoutId);
      
      if (success) {
        onPrint?.(selectedLayoutId);
        
        const layout = layouts.find(l => l.id === selectedLayoutId);
        toast({
          title: "✅ Impressão Realizada",
          description: `Pedido #${order.id} impresso com layout "${layout?.name}"`
        });
      }
    } catch (error) {
      console.error('❌ Erro na impressão:', error);
      toast({
        title: "❌ Erro na Impressão",
        description: "Falha ao imprimir com o layout selecionado",
        variant: "destructive"
      });
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (!showPreview) {
      updatePreview();
    }
  };

  const refreshLayouts = () => {
    loadLayouts();
    toast({
      title: "🔄 Layouts Atualizados",
      description: "Lista de layouts recarregada"
    });
  };

  // Se não há layouts configurados, mostrar erro
  if (layouts.length === 0) {
    return (
      <NoLayoutsError 
        onCreateLayout={() => window.location.href = '/layout-config'}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Layout de Impressão Dinâmico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Layout */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
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
            
            <Button
              variant="outline"
              size="icon"
              onClick={refreshLayouts}
              title="Recarregar layouts"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Informações do Layout Selecionado */}
          {selectedLayoutId && (
            <div className="p-3 bg-muted rounded-lg">
              {(() => {
                const layout = layouts.find(l => l.id === selectedLayoutId);
                return layout ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{layout.name}</h4>
                      {layout.isDefault && (
                        <Badge variant="secondary">Padrão</Badge>
                      )}
                    </div>
                    {layout.description && (
                      <p className="text-sm text-muted-foreground">{layout.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Largura: {layout.paperWidth} chars</span>
                      <span>Seções: {Object.values(layout).filter(section => 
                        typeof section === 'object' && section?.enabled
                      ).length}</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={printing || !selectedPrinter}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              {printing ? 'Imprimindo...' : 'Imprimir com Layout'}
            </Button>
            
            <Button
              variant="outline"
              onClick={togglePreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Ocultar' : 'Preview'}
            </Button>
          </div>

          {/* Preview do Layout */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview da Impressão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded font-mono text-xs whitespace-pre-line max-h-60 overflow-y-auto">
                  {previewText || 'Gerando preview...'}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status da Impressora */}
          {!selectedPrinter && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ℹ️ Sistema de impressão disponível. Configure suas preferências para usar este recurso.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
