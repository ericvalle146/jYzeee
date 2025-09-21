import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  QrCode, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Power
} from 'lucide-react';
import { useWhatsAppEvolution } from '@/hooks/useWhatsAppEvolution';

export function WhatsAppEvolution() {
  
  // Verificar se todas as dependências estão disponíveis
  useEffect(() => {
    
    // Verificar se o hook está funcionando
    try {
    } catch (error) {
      console.error('❌ ERRO: Problema com hook useWhatsAppEvolution:', error);
    }
  }, []);
  
  let hookResult;
  try {
    hookResult = useWhatsAppEvolution();
  } catch (error) {
    console.error('❌ ERRO: Falha ao executar hook:', error);
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar componente WhatsApp: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const {
    isConnected,
    isConnecting,
    isLoading,
    qrCode,
    instanceStatus,
    error,
    instanceExists,
    generateQRCode,
    reconnect,
    disconnect,
    checkInstanceStatus,
  } = hookResult;




  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          <CardTitle>WhatsApp Business</CardTitle>
        </div>
        <CardDescription>
          Integração com Evolution API para WhatsApp Business
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">

        {/* Mensagem de Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* QR Code Display */}
        {qrCode && !isConnected && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Escaneie o QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Abra o WhatsApp, vá em "Dispositivos Vinculados" e escaneie este código
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl border border-border shadow-lg">
                <img 
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 rounded-lg"
                  onLoad={() => {
                  }}
                  onError={(e) => {
                    console.error('❌ ERRO: Falha ao carregar imagem QR Code:', e);
                    console.error('❌ ERRO: QR Code string:', qrCode?.substring(0, 100) + '...');
                  }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                O QR Code expira em alguns minutos. Clique em "Gerar Novo QR Code" se necessário.
              </p>
            </div>

          </div>
        )}


        {/* Alert para problemas de conexão */}
        {error && error.includes('QR Code não encontrado') && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>A instância WhatsApp pode estar conectada ou em estado inválido.</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={disconnect}
                    disabled={isLoading}
                    size="sm"
                    variant="destructive"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-3 w-3" />
                    )}
                    Recriar Instância
                  </Button>
                  <Button 
                    onClick={generateQRCode}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-3 w-3" />
                    )}
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mensagem de Sucesso */}
        {isConnected && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              WhatsApp conectado com sucesso! Sua instância está pronta para receber e enviar mensagens.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3">
          {!isConnected && !isConnecting && (
            <Button 
              onClick={generateQRCode}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-5 w-5" />
              )}
              {instanceExists ? 'Gerar Novo QR Code' : 'Conectar WhatsApp'}
            </Button>
          )}
          
          {isConnecting && (
            <div className="space-y-2">
              <Button 
                onClick={generateQRCode}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Gerar Novo QR Code
              </Button>
            </div>
          )}
          
          {isConnected && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={reconnect}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Reconectar
              </Button>
              
              <Button 
                onClick={disconnect}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                Desconectar
              </Button>
            </div>
          )}
        </div>

        {/* Informações Adicionais */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Como conectar:</p>
              <ul className="space-y-1 text-xs">
                <li>1. Clique em "Conectar WhatsApp"</li>
                <li>2. Abra o WhatsApp no seu celular</li>
                <li>3. Vá em Menu → Dispositivos Vinculados</li>
                <li>4. Toque em "Vincular um dispositivo"</li>
                <li>5. Escaneie o QR Code exibido acima</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
