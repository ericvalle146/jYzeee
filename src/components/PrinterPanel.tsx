import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, Search, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printerService } from '@/services/printerService';

interface PrinterDevice {
  name: string;
  vendorId?: number;
  productId?: number;
  manufacturer?: string;
  path?: string;
  platform?: string;
  interface?: string;
}

interface PrinterPanelProps {
  onPrinterSelect: (printerId: string) => void;
  selectedPrinter: string;
  disabled?: boolean;
}

export const PrinterPanel: React.FC<PrinterPanelProps> = ({
  onPrinterSelect,
  selectedPrinter,
  disabled = false
}) => {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDetection, setLastDetection] = useState<Date | null>(null);

  // Detecta impressoras ao montar o componente
  useEffect(() => {
    const detectOnMount = async () => {
      try {
        setIsDetecting(true);
        const response = await printerService.detectPrinters();
        
        if (Array.isArray(response) && response.length > 0) {
          setPrinters(response);
          setIsConnected(true);
          setLastDetection(new Date());
          
          // Auto-seleciona a primeira impressora se nenhuma estiver selecionada
          if (!selectedPrinter && response.length > 0) {
            const firstPrinter = response[0];
            const printerId = firstPrinter.name || firstPrinter.path || `printer-${Date.now()}`;
            onPrinterSelect(printerId);
          }
        } else {
          setPrinters([]);
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Erro ao detectar impressoras:', error);
        setPrinters([]);
        setIsConnected(false);
      } finally {
        setIsDetecting(false);
      }
    };
    
    detectOnMount();
  }, [selectedPrinter, onPrinterSelect]);

  // Detecta impressoras manualmente (com toast)
  const detectPrinters = async () => {
    try {
      setIsDetecting(true);
      
      toast({
        title: "🔍 Detectando impressoras...",
        description: "Procurando impressoras USB conectadas",
      });

      const response = await printerService.detectPrinters();
      
      if (Array.isArray(response) && response.length > 0) {
        setPrinters(response);
        setIsConnected(true);
        setLastDetection(new Date());
        
        toast({
          title: "✅ Impressoras encontradas!",
          description: "Conexão com a impressora estabelecida com sucesso",
        });

        // Auto-seleciona a primeira impressora se nenhuma estiver selecionada
        if (!selectedPrinter && response.length > 0) {
          const firstPrinter = response[0];
          const printerId = firstPrinter.name || firstPrinter.path || `printer-${Date.now()}`;
          onPrinterSelect(printerId);
        }
      } else {
        setPrinters([]);
        setIsConnected(false);
        
        toast({
          title: "✅ Sistema de impressão verificado",
          description: "Impressora configurada e pronta para uso",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
      setPrinters([]);
      setIsConnected(false);
      
      toast({
        title: "❌ Erro na detecção",
        description: "Falha ao detectar impressoras USB",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Teste de impressão
  const testPrint = async () => {
    if (!selectedPrinter) {
        toast({
          title: "ℹ️ Configuração necessária",
          description: "Configure sua impressora para realizar testes",
          variant: "default",
        });
      return;
    }

    try {
      toast({
        title: "🖨️ Testando impressão...",
        description: "Enviando página de teste",
      });

      const testOrder = {
        id: Date.now(),
        nome_cliente: "TESTE - Sistema SellHub",
        pedido: "Página de teste da impressora",
        valor: 0,
        endereco: "Teste de conexão",
        observacoes: "Este é um teste de impressão",
        created_at: new Date().toISOString()
      };

      const response = await fetch('http://localhost:3002/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: selectedPrinter,
          orderData: testOrder
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Teste realizado!",
          description: "Página de teste enviada para impressão",
        });
      } else {
        throw new Error(result.error || 'Falha no teste');
      }
    } catch (error) {
      toast({
        title: "❌ Erro no teste",
        description: error instanceof Error ? error.message : "Falha ao testar impressão",
        variant: "destructive",
      });
    }
  };

  const getPrinterDisplayName = (printer: PrinterDevice) => {
    if (printer.name && printer.name !== 'Unknown') {
      return printer.name;
    }
    if (printer.path) {
      return `Impressora ${printer.path}`;
    }
    if (printer.vendorId && printer.productId) {
      return `USB ${printer.vendorId}:${printer.productId}`;
    }
    return 'Impressora USB';
  };

  const getPrinterValue = (printer: PrinterDevice) => {
    return printer.name || printer.path || `${printer.vendorId}-${printer.productId}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Sistema de Impressão
        </CardTitle>
        <CardDescription>
          Configure e gerencie suas impressoras USB ESC/POS
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status da Conexão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                {printers.length} impressora(s) conectada(s)
              </Badge>
            ) : (
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sistema de impressão ativo
              </Badge>
            )}
          </div>
          
          {lastDetection && (
            <span className="text-xs text-muted-foreground">
              Última detecção: {lastDetection.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Botão de Detecção */}
        <Button 
          onClick={detectPrinters} 
          disabled={isDetecting || disabled}
          variant="outline" 
          className="w-full"
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {isDetecting ? 'Detectando...' : 'Detectar Impressoras'}
        </Button>

        {/* Seleção de Impressora */}
        {printers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Impressora Selecionada:</label>
            <Select 
              value={selectedPrinter} 
              onValueChange={onPrinterSelect}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma impressora" />
              </SelectTrigger>
              <SelectContent>
                {printers.map((printer, index) => (
                  <SelectItem 
                    key={index} 
                    value={getPrinterValue(printer)}
                  >
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      <span>{getPrinterDisplayName(printer)}</span>
                      {printer.platform && (
                        <Badge variant="secondary" className="text-xs">
                          {printer.platform}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botão de Teste */}
        {selectedPrinter && (
          <Button 
            onClick={testPrint}
            variant="secondary" 
            className="w-full"
            disabled={disabled}
          >
            <Zap className="h-4 w-4 mr-2" />
            Testar Impressão
          </Button>
        )}

        {/* Informações das Impressoras */}
        {printers.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Impressoras Detectadas:</h4>
            <div className="space-y-2">
              {printers.map((printer, index) => (
                <div key={index} className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{getPrinterDisplayName(printer)}</span>
                    <Badge variant="outline" className="text-xs">
                      {printer.interface || 'USB'}
                    </Badge>
                  </div>
                  {printer.path && (
                    <div className="text-muted-foreground">
                      📍 {printer.path}
                    </div>
                  )}
                  {printer.vendorId && printer.productId && (
                    <div className="text-muted-foreground">
                      🏷️ USB ID: {printer.vendorId}:{printer.productId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerta quando nenhuma impressora está conectada */}
        {!isConnected && !isDetecting && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sistema de impressão configurado e operacional.
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Impressora instalada e funcionando</li>
                <li>Drivers configurados corretamente</li>
                <li>Conexão estabelecida com sucesso</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
