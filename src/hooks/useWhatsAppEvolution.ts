import { useState, useEffect, useCallback } from 'react';
import { evolutionApiService, QRCodeResponse, InstanceStatus } from '@/services/evolutionApiService';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppEvolutionState {
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  qrCode: string | null;
  instanceStatus: 'open' | 'close' | 'connecting' | null;
  error: string | null;
  instanceExists: boolean;
}

export function useWhatsAppEvolution() {
  const { toast } = useToast();
  const [state, setState] = useState<WhatsAppEvolutionState>({
    isConnected: false,
    isConnecting: false,
    isLoading: false,
    qrCode: null,
    instanceStatus: null,
    error: null,
    instanceExists: false,
  });

  // console.log('🔍 DEBUG: Hook useWhatsAppEvolution inicializado');
  // console.log('🔍 DEBUG: Estado atual:', state);

  // Verificar status da instância
  const checkInstanceStatus = useCallback(async () => {
    // console.log('🔍 DEBUG: Verificando status da instância...');
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const exists = await evolutionApiService.instanceExists();
      // console.log('🔍 DEBUG: Instância existe?', exists);
      
      if (exists) {
        const status = await evolutionApiService.getInstanceStatus();
        // console.log('🔍 DEBUG: Status da instância:', status);
        setState(prev => ({
          ...prev,
          instanceExists: true,
          instanceStatus: status.instance.status,
          isConnected: status.instance.status === 'open',
          isConnecting: status.instance.status === 'connecting',
        }));
        // console.log('✅ DEBUG: Estado atualizado - instância existe');
      } else {
        setState(prev => ({
          ...prev,
          instanceExists: false,
          instanceStatus: null,
          isConnected: false,
          isConnecting: false,
        }));
        // console.log('⚠️ DEBUG: Estado atualizado - instância não existe');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ ERRO: Erro ao verificar status:', errorMessage);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
        isConnecting: false,
      }));
      
      toast({
        title: 'Erro ao verificar status',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      // console.log('🔍 DEBUG: Verificação de status finalizada');
    }
  }, [toast]);

  // Gerar QR Code
  const generateQRCode = useCallback(async () => {
    // console.log('🔍 DEBUG: Iniciando geração de QR Code...');
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, qrCode: null }));
      
      // Verificar se a instância existe, se não, criar uma nova
      const exists = await evolutionApiService.instanceExists();
      // console.log('🔍 DEBUG: Instância existe para QR Code?', exists);
      
      if (!exists) {
        // console.log('🔍 DEBUG: Criando nova instância...');
        toast({
          title: 'Criando instância...',
          description: 'Configurando nova instância WhatsApp',
        });
        
        const createResponse = await evolutionApiService.createInstance();
        // console.log('🔍 DEBUG: Resposta da criação:', createResponse);
        
        if (createResponse.qrcode) {
          setState(prev => ({
            ...prev,
            qrCode: createResponse.qrcode!.base64,
            instanceExists: true,
            isConnecting: true,
            instanceStatus: 'connecting',
          }));
          
          toast({
            title: 'QR Code gerado!',
            description: 'Escaneie o código com seu WhatsApp',
          });
          // console.log('✅ DEBUG: QR Code gerado com sucesso (nova instância)');
        }
      } else {
        // console.log('🔍 DEBUG: Instância existe - tentando obter/reiniciar para QR Code...');
        
        toast({
          title: 'Gerando QR Code...',
          description: 'Reiniciando instância para gerar novo código',
        });
        
        try {
          // Tentar obter QR Code (que inclui restart automático)
          const qrResponse = await evolutionApiService.getQRCode();
          // console.log('🔍 DEBUG: Resposta do QR Code:', qrResponse);
          // console.log('🔍 DEBUG: Base64 recebido:', qrResponse.base64 ? 'PRESENTE' : 'AUSENTE');
          // console.log('🔍 DEBUG: Tamanho do base64:', qrResponse.base64?.length || 0);
          
          if (qrResponse.base64) {
            setState(prev => ({
              ...prev,
              qrCode: qrResponse.base64,
              isConnecting: true,
              instanceStatus: 'connecting',
            }));
            
            toast({
              title: 'QR Code gerado!',
              description: 'Escaneie o código com seu WhatsApp',
            });
            // console.log('✅ DEBUG: QR Code gerado com sucesso (instância reiniciada)');
          } else {
            console.error('❌ ERRO: Base64 não encontrado na resposta');
            throw new Error('QR Code base64 não encontrado na resposta da API');
          }
        } catch (qrError) {
          console.error('❌ ERRO: Falha ao obter QR Code, tentando recriar instância...');
          
          // Se falhar, tentar deletar e recriar a instância
          try {
            await evolutionApiService.deleteInstance();
            // console.log('🔍 DEBUG: Instância deletada, criando nova...');
            
            const createResponse = await evolutionApiService.createInstance();
            // console.log('🔍 DEBUG: Nova instância criada:', createResponse);
            
            if (createResponse.qrcode) {
              setState(prev => ({
                ...prev,
                qrCode: createResponse.qrcode!.base64,
                instanceExists: true,
                isConnecting: true,
                instanceStatus: 'connecting',
              }));
              
              toast({
                title: 'QR Code gerado!',
                description: 'Escaneie o código com seu WhatsApp',
              });
              // console.log('✅ DEBUG: QR Code gerado com sucesso (nova instância após erro)');
            } else {
              throw new Error('Nova instância criada mas sem QR Code');
            }
          } catch (recreateError) {
            console.error('❌ ERRO: Falha ao recriar instância:', recreateError);
            throw qrError; // Lançar o erro original
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ ERRO: Erro ao gerar QR Code:', errorMessage);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        qrCode: null,
      }));
      
      toast({
        title: 'Erro ao gerar QR Code',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      // console.log('🔍 DEBUG: Geração de QR Code finalizada');
    }
  }, [toast]);

  // Reconectar instância
  const reconnect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, qrCode: null }));
      
      const qrResponse = await evolutionApiService.reconnectInstance();
      
      setState(prev => ({
        ...prev,
        qrCode: qrResponse.base64,
        isConnecting: true,
        instanceStatus: 'connecting',
        isConnected: false,
      }));
      
      toast({
        title: 'Reconectando...',
        description: 'Escaneie o novo QR Code',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      
      toast({
        title: 'Erro ao reconectar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Desconectar instância
  const disconnect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await evolutionApiService.deleteInstance();
      
      setState(prev => ({
        ...prev,
        instanceExists: false,
        isConnected: false,
        isConnecting: false,
        instanceStatus: null,
        qrCode: null,
      }));
      
      toast({
        title: 'Desconectado',
        description: 'Instância WhatsApp removida com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      
      toast({
        title: 'Erro ao desconectar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Polling para verificar mudanças no status
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isConnecting || state.instanceExists) {
        checkInstanceStatus();
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [state.isConnecting, state.instanceExists, checkInstanceStatus]);

  // Verificar status inicial
  useEffect(() => {
    checkInstanceStatus();
  }, [checkInstanceStatus]);

  return {
    ...state,
    generateQRCode,
    reconnect,
    disconnect,
    checkInstanceStatus,
  };
}
