/**
 * INIT-01: Multi-Instance WhatsApp Hook
 * 
 * Hook refatorado para suportar múltiplas instâncias WhatsApp
 * Substitui o useWhatsAppEvolution com nova arquitetura
 */

import { useState, useEffect, useCallback } from 'react';
import { whatsappMultiInstanceService, QRCodeResponse, InstanceStatusResponse } from '@/services/whatsappMultiInstanceService';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppMultiInstanceState {
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  qrCode: string | null;
  instanceStatus: 'open' | 'close' | 'connecting' | 'unknown' | null;
  error: string | null;
  clientId: string | null;
  instanceName: string | null;
}

export function useWhatsAppMultiInstance(initialClientId?: string) {
  const { toast } = useToast();
  const [state, setState] = useState<WhatsAppMultiInstanceState>({
    isConnected: false,
    isConnecting: false,
    isLoading: false,
    qrCode: null,
    instanceStatus: null,
    error: null,
    clientId: initialClientId || null,
    instanceName: null,
  });

  console.log('🔧 useWhatsAppMultiInstance initialized', {
    clientId: initialClientId,
    state: state.instanceStatus
  });

  /**
   * Set client ID for this hook instance
   */
  const setClientId = useCallback((clientId: string) => {
    console.log(`🆔 Setting client ID: ${clientId}`);
    setState(prev => ({
      ...prev,
      clientId,
      // Reset state when changing client
      isConnected: false,
      isConnecting: false,
      qrCode: null,
      instanceStatus: null,
      error: null,
      instanceName: null,
    }));
  }, []);

  /**
   * Check instance status for current client
   */
  const checkInstanceStatus = useCallback(async (): Promise<InstanceStatusResponse | null> => {
    if (!state.clientId) {
      console.warn('⚠️ No client ID set, cannot check status');
      return null;
    }

    console.log(`🔍 Checking status for client: ${state.clientId}`);
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const statusResponse = await whatsappMultiInstanceService.checkInstanceStatus(state.clientId);
      
      setState(prev => ({
        ...prev,
        instanceName: statusResponse.instanceName,
        instanceStatus: statusResponse.status,
        isConnected: statusResponse.status === 'open',
        isConnecting: statusResponse.status === 'connecting',
      }));

      console.log(`✅ Status updated for ${state.clientId}:`, statusResponse.status);
      return statusResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error checking status for ${state.clientId}:`, errorMessage);
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        instanceStatus: 'unknown',
      }));

      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.clientId]);

  /**
   * INIT-02: Generate QR Code with intelligent flow
   */
  const generateQRCode = useCallback(async (): Promise<QRCodeResponse | null> => {
    if (!state.clientId) {
      toast({
        title: 'Client ID Required',
        description: 'Please set a client ID before generating QR Code',
        variant: 'destructive',
      });
      return null;
    }

    console.log(`📱 Generating QR Code for client: ${state.clientId}`);
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, qrCode: null }));
      
      const qrResponse = await whatsappMultiInstanceService.generateQRCode(state.clientId);
      
      setState(prev => ({
        ...prev,
        instanceName: qrResponse.instanceName,
      }));

      if (qrResponse.status === 'already_connected') {
        // Instance is already connected
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          instanceStatus: 'open',
        }));

        toast({
          title: 'Already Connected',
          description: qrResponse.message,
        });

      } else if (qrResponse.status === 'generated' && qrResponse.qrCode) {
        // QR Code generated successfully
        setState(prev => ({
          ...prev,
          qrCode: qrResponse.qrCode!,
          isConnecting: true,
          instanceStatus: 'connecting',
          isConnected: false,
        }));

        toast({
          title: 'QR Code Generated',
          description: 'Scan the QR Code with your WhatsApp to connect',
        });

      } else {
        // Error generating QR Code
        throw new Error(qrResponse.message);
      }

      console.log(`✅ QR Code generation result for ${state.clientId}:`, qrResponse.status);
      return qrResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error generating QR Code for ${state.clientId}:`, errorMessage);
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        qrCode: null,
      }));

      toast({
        title: 'Error Generating QR Code',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.clientId, toast]);

  /**
   * Disconnect and delete instance
   */
  const disconnect = useCallback(async (): Promise<boolean> => {
    if (!state.clientId) {
      toast({
        title: 'Client ID Required',
        description: 'Please set a client ID before disconnecting',
        variant: 'destructive',
      });
      return false;
    }

    console.log(`🗑️ Disconnecting client: ${state.clientId}`);
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await whatsappMultiInstanceService.deleteInstance(state.clientId);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          instanceStatus: null,
          qrCode: null,
          instanceName: null,
        }));

        toast({
          title: 'Disconnected',
          description: result.message,
        });

        console.log(`✅ Client ${state.clientId} disconnected successfully`);
        return true;
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error disconnecting ${state.clientId}:`, errorMessage);
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));

      toast({
        title: 'Error Disconnecting',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.clientId, toast]);

  /**
   * Auto-check status periodically when connecting
   */
  useEffect(() => {
    if (state.isConnecting && state.clientId) {
      console.log(`⏰ Starting periodic status check for ${state.clientId}`);
      
      const interval = setInterval(() => {
        checkInstanceStatus();
      }, 5000); // Check every 5 seconds

      return () => {
        console.log(`🛑 Stopping periodic status check for ${state.clientId}`);
        clearInterval(interval);
      };
    }
  }, [state.isConnecting, state.clientId, checkInstanceStatus]);

  /**
   * Check status when client ID changes
   */
  useEffect(() => {
    if (state.clientId) {
      console.log(`🔄 Client ID changed to ${state.clientId}, checking status`);
      checkInstanceStatus();
    }
  }, [state.clientId, checkInstanceStatus]);

  return {
    // State
    ...state,
    
    // Actions
    setClientId,
    generateQRCode,
    disconnect,
    checkInstanceStatus,
    
    // Computed properties
    canGenerateQR: !!state.clientId && !state.isLoading,
    canDisconnect: !!state.clientId && (state.isConnected || state.isConnecting) && !state.isLoading,
    statusText: state.instanceStatus ? state.instanceStatus.toUpperCase() : 'UNKNOWN',
  };
}
