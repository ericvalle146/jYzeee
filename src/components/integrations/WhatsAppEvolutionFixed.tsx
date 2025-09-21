import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Smartphone,
  Wifi,
  WifiOff,
  Power
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppState {
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  qrCode: string | null;
  error: string | null;
}

export function WhatsAppEvolutionFixed() {
  console.log('🔍 DEBUG: Componente WhatsAppEvolutionFixed renderizando');
  
  const { toast } = useToast();
  const [state, setState] = useState<WhatsAppState>({
    isConnected: false,
    isConnecting: false,
    isLoading: false,
    qrCode: null,
    error: null,
  });

  useEffect(() => {
    console.log('🔍 DEBUG: WhatsAppEvolutionFixed montado');
    console.log('🔍 DEBUG: Variáveis de ambiente:', {
      EVOLUTION_API_URL: import.meta.env.VITE_EVOLUTION_API_URL || 'NÃO DEFINIDA',
      EVOLUTION_API_KEY: import.meta.env.VITE_EVOLUTION_API_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
      WHATSAPP_INSTANCE_NAME: import.meta.env.VITE_WHATSAPP_INSTANCE_NAME || 'JyzeCliente (padrão)',
    });
  }, []);

  const handleGenerateQR = async () => {
    console.log('🔍 DEBUG: Iniciando geração de QR Code...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simular geração de QR Code para teste
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // QR Code de exemplo (base64 de um QR code simples)
      const sampleQR = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      
      setState(prev => ({ 
        ...prev, 
        qrCode: sampleQR,
        isConnecting: true,
        error: null 
      }));
      
      toast({
        title: 'QR Code gerado!',
        description: 'Escaneie o código com seu WhatsApp (DEMO)',
      });
      
      console.log('✅ DEBUG: QR Code gerado com sucesso');
    } catch (error) {
      console.error('❌ ERRO: Erro ao gerar QR Code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      toast({
        title: 'Erro ao gerar QR Code',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleConnect = () => {
    console.log('🔍 DEBUG: Simulando conexão...');
    setState(prev => ({ 
      ...prev, 
      isConnected: true, 
      isConnecting: false,
      qrCode: null 
    }));
    
    toast({
      title: 'WhatsApp Conectado!',
      description: 'Conexão estabelecida com sucesso (DEMO)',
    });
  };

  const handleDisconnect = () => {
    console.log('🔍 DEBUG: Desconectando...');
    setState({
      isConnected: false,
      isConnecting: false,
      isLoading: false,
      qrCode: null,
      error: null,
    });
    
    toast({
      title: 'WhatsApp Desconectado',
      description: 'Instância removida com sucesso',
    });
  };

  const getStatusBadge = () => {
    if (state.isConnected) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Conectado
        </Badge>
      );
    }
    
    if (state.isConnecting) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Conectando
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-red-500 text-red-500">
        <WifiOff className="h-3 w-3 mr-1" />
        Desconectado
      </Badge>
    );
  };

  const getStatusIcon = () => {
    if (state.isConnected) {
      return <Wifi className="h-5 w-5 text-green-500" />;
    }
    
    if (state.isConnecting) {
      return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
    
    return <WifiOff className="h-5 w-5 text-red-500" />;
  };

  console.log('🔍 DEBUG: Estado atual do WhatsApp:', state);

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <CardTitle>WhatsApp Business (Versão Corrigida)</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Integração com Evolution API para WhatsApp Business - Versão de Debug
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status da Conexão */}
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">
                  {state.isConnected ? 'WhatsApp Conectado' : 
                   state.isConnecting ? 'Aguardando Conexão' : 
                   'WhatsApp Desconectado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Instância: JyzeCliente | Status: {state.isConnected ? 'open' : state.isConnecting ? 'connecting' : 'close'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* QR Code Display */}
        {state.qrCode && !state.isConnected && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Escaneie o QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Abra o WhatsApp, vá em "Dispositivos Vinculados" e escaneie este código
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl border border-border shadow-lg">
                <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">QR Code Demo</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button onClick={handleConnect} variant="outline">
                Simular Conexão (Demo)
              </Button>
            </div>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {state.isConnected && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              WhatsApp conectado com sucesso! Sua instância está pronta para receber e enviar mensagens.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3">
          {!state.isConnected && !state.isConnecting && (
            <Button 
              onClick={handleGenerateQR}
              disabled={state.isLoading}
              className="w-full"
              size="lg"
            >
              {state.isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-5 w-5" />
              )}
              Conectar WhatsApp (Demo)
            </Button>
          )}
          
          {state.isConnecting && (
            <Button 
              onClick={handleGenerateQR}
              disabled={state.isLoading}
              variant="outline"
              className="w-full"
            >
              {state.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Gerar Novo QR Code
            </Button>
          )}
          
          {state.isConnected && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleGenerateQR}
                disabled={state.isLoading}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconectar
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
              >
                <Power className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            </div>
          )}
        </div>

        {/* Informações de Debug */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p><strong>Debug Info:</strong></p>
            <p>Componente: WhatsAppEvolutionFixed</p>
            <p>Estado: {JSON.stringify(state, null, 2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




