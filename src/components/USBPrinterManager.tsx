import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  Printer, 
  Usb, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  TestTube,
  Zap,
  CheckCircle
} from 'lucide-react';

interface USBPrinter {
  id: string;
  name: string;
  type: string;
  vendorId: number;
  productId: number;
  manufacturer: string;
  status: string;
  isDefault: boolean;
  capabilities: string[];
}

interface USBPrinterManagerProps {
  onPrinterConnected?: (printerId: string) => void;
}

export const USBPrinterManager: React.FC<USBPrinterManagerProps> = ({ onPrinterConnected }) => {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<USBPrinter[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  // Verificar se estamos no Electron
  useEffect(() => {
    const checkElectron = () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setIsElectron(true);
        detectPrinters(); // Auto-detectar na inicialização
      } else {
        console.log('🌐 Rodando no navegador - funcionalidades USB não disponíveis');
      }
    };

    checkElectron();
  }, []);

  // Detectar impressoras USB
  const detectPrinters = async () => {
    if (!window.electronAPI?.printer) {
      toast({
        title: "⚠️ Funcionalidade não disponível",
        description: "Impressão USB só funciona no aplicativo desktop",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDetecting(true);
      console.log('🔍 Detectando impressoras USB...');
      
      const detectedPrinters = await window.electronAPI.printer.detectUSB();
      setPrinters(detectedPrinters);
      
      toast({
        title: "🔍 Detecção concluída",
        description: `${detectedPrinters.length} impressora(s) USB encontrada(s)`,
      });

      console.log('📋 Impressoras detectadas:', detectedPrinters);

    } catch (error) {
      console.error('❌ Erro ao detectar impressoras:', error);
      toast({
        title: "❌ Erro na detecção",
        description: "Não foi possível detectar impressoras USB",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Conectar à impressora
  const connectToPrinter = async (printerId: string) => {
    try {
      setIsConnecting(true);
      
      const result = await window.electronAPI.printer.connect(printerId);
      
      if (result.success) {
        setConnectedPrinter(printerId);
        onPrinterConnected?.(printerId);
        
        toast({
          title: "🔌 Conectado!",
          description: "Impressora USB conectada com sucesso",
        });
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      toast({
        title: "❌ Erro de conexão",
        description: error.message || "Não foi possível conectar à impressora",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Teste de impressão
  const testPrint = async () => {
    if (!connectedPrinter) {
      toast({
        title: "⚠️ Impressora não conectada",
        description: "Conecte uma impressora primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTesting(true);
      
      const result = await window.electronAPI.printer.test();
      
      if (result.success) {
        toast({
          title: "🎉 Teste bem-sucedido!",
          description: "Sua impressora está funcionando perfeitamente",
        });
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      toast({
        title: "❌ Falha no teste",
        description: error.message || "Erro ao testar impressora",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isElectron) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impressão USB
          </CardTitle>
          <CardDescription>
            Funcionalidade disponível apenas no aplicativo desktop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Usb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Para usar impressão USB direta, baixe o aplicativo desktop JYZE.AI
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Gerenciador de Impressoras USB
        </CardTitle>
        <CardDescription>
          Conecte e configure sua impressora térmica USB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Botão de detecção */}
        <div className="flex gap-2">
          <Button 
            onClick={detectPrinters}
            disabled={isDetecting}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
            {isDetecting ? 'Detectando...' : 'Detectar Impressoras'}
          </Button>
          
          {connectedPrinter && (
            <Button 
              onClick={testPrint}
              disabled={isTesting}
              variant="outline"
            >
              <TestTube className={`h-4 w-4 mr-2 ${isTesting ? 'animate-pulse' : ''}`} />
              {isTesting ? 'Testando...' : 'Teste'}
            </Button>
          )}
        </div>

        {/* Lista de impressoras */}
        <div className="space-y-2">
          {printers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Usb className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhuma impressora USB detectada</p>
              <p className="text-sm">Conecte sua impressora e clique em "Detectar"</p>
            </div>
          ) : (
            printers.map((printer) => (
              <div 
                key={printer.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{printer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {printer.manufacturer} • USB
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Status da impressora */}
                  {connectedPrinter === printer.id ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectada
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  )}
                  
                  {/* Botão de conexão */}
                  {connectedPrinter === printer.id ? (
                    <Button size="sm" variant="outline" disabled>
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => connectToPrinter(printer.id)}
                      disabled={isConnecting}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Status global */}
        {connectedPrinter && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Impressora conectada e pronta!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Novos pedidos serão impressos automaticamente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
