import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  Eye, 
  Printer,
  FileText,
  Download
} from 'lucide-react';
import { PrintLayoutConfig } from '../types/printer';
import { Order } from '../types/orders';
import { printLayoutService } from '../services/printLayoutService';

interface PrintPreviewProps {
  layout: PrintLayoutConfig;
  order?: Order;
  onPrint?: () => void;
  className?: string;
}

// Pedido exemplo para preview
const SAMPLE_ORDER: Order = {
  id: 123,
  nome_cliente: 'João Silva',
  pedido: '2x Pizza Margherita G, 1x Coca-Cola 2L, 1x Batata Frita G',
  observacoes: 'Sem cebola na pizza. Entregar no portão azul.',
  valor: 85.80,
  tipo_pagamento: 'PIX',
  endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP',
  status: 'Confirmado',
  created_at: new Date().toISOString()
};

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  layout,
  order = SAMPLE_ORDER,
  onPrint,
  className = ""
}) => {
  const previewText = printLayoutService.generatePrintText(order, layout);
  
  const handlePrintPreview = () => {
    onPrint?.();
  };

  const handleDownloadPreview = () => {
    const blob = new Blob([previewText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preview_${layout.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview de Impressão
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{layout.name}</Badge>
              <Badge variant="secondary" className="text-xs">
                {layout.paperWidth} chars
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadPreview} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            {onPrint && (
              <Button onClick={handlePrintPreview} size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Teste
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações do Preview */}
          <div className="text-sm text-muted-foreground">
            <p>📄 Usando pedido de exemplo para demonstração</p>
            <p>🖨️ Largura configurada: {layout.paperWidth} caracteres</p>
          </div>

          {/* Preview do Texto */}
          <div className="border rounded-lg bg-white">
            <div className="bg-gray-50 border-b px-3 py-2 text-sm font-medium text-gray-700">
              Visualização da Impressão
            </div>
            <ScrollArea className="h-96">
              <div className="p-4">
                <pre 
                  className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ 
                    fontFamily: 'Courier New, monospace',
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}
                >
                  {previewText}
                </pre>
              </div>
            </ScrollArea>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                {previewText.split('\n').length}
              </p>
              <p className="text-xs text-muted-foreground">Linhas</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {previewText.length}
              </p>
              <p className="text-xs text-muted-foreground">Caracteres</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {Object.values(layout).filter(section => 
                  typeof section === 'object' && 
                  'enabled' in section && 
                  section.enabled
                ).length}
              </p>
              <p className="text-xs text-muted-foreground">Seções Ativas</p>
            </div>
          </div>

          {/* Preview em Dispositivo Móvel */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Preview Mobile</h4>
            <div className="bg-gray-100 rounded-lg p-4 max-w-xs mx-auto">
              <div className="bg-white rounded shadow-sm p-3">
                <pre 
                  className="font-mono text-xs leading-tight whitespace-pre-wrap overflow-hidden"
                  style={{ 
                    fontFamily: 'Courier New, monospace',
                    fontSize: '10px',
                    lineHeight: '1.2'
                  }}
                >
                  {previewText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
