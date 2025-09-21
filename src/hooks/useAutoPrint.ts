import { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../types/orders';

interface UseAutoPrintProps {
  selectedPrinter?: string;
  enabled: boolean;
}

export const useAutoPrint = ({ selectedPrinter, enabled }: UseAutoPrintProps) => {
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(enabled);
  const [lastProcessedOrderId, setLastProcessedOrderId] = useState<number | null>(null);
  const hasInitialized = useRef(false);

  // Update auto print enabled state when enabled prop changes
  useEffect(() => {
    setAutoPrintEnabled(enabled);
  }, [enabled]);

  const processNewOrders = useCallback(async (currentOrders: Order[], previousOrders: Order[]) => {
    console.log('🔄 processNewOrders EXECUTADO:', {
      autoPrintEnabled,
      selectedPrinter,
      currentOrdersCount: currentOrders.length,
      previousOrdersCount: previousOrders.length,
      timestamp: new Date().toLocaleTimeString()
    });

    if (!autoPrintEnabled || !selectedPrinter) {
      console.log('🖨️ Auto-print desabilitado ou impressora não selecionada', {
        autoPrintEnabled,
        selectedPrinter
      });
      return;
    }

    // Detectar novos pedidos comparando arrays
    const previousOrderIds = new Set(previousOrders.map(order => order.id));
    const newOrders = currentOrders.filter(order => !previousOrderIds.has(order.id));

    console.log('🔍 ANÁLISE DE NOVOS PEDIDOS:', {
      previousOrderIds: Array.from(previousOrderIds),
      currentOrderIds: currentOrders.map(o => o.id),
      newOrderIds: newOrders.map(o => o.id),
      newOrdersCount: newOrders.length
    });

    if (newOrders.length > 0) {
      console.log('🖨️ Novos pedidos completos detectados para auto-impressão:', newOrders.map(o => o.id));

      for (const order of newOrders) {
        try {
          console.log(`🖨️ Enviando pedido ${order.id} para impressão automática`);
          
          const response = await fetch('http://localhost:3002/printer/print-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId: order.id }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Pedido ${order.id} impresso automaticamente:`, result);
            setLastProcessedOrderId(order.id);
          } else {
            const error = await response.json();
            console.error(`❌ Erro ao imprimir pedido ${order.id}:`, error);
          }
        } catch (error) {
          console.error(`❌ Erro na requisição de impressão para pedido ${order.id}:`, error);
        }

        // Pequeno delay entre impressões para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      console.log('🖨️ Nenhum novo pedido detectado - Arrays são idênticos');
    }
  }, [autoPrintEnabled, selectedPrinter]);

  return {
    autoPrintEnabled,
    setAutoPrintEnabled,
    processNewOrders,
    lastProcessedOrderId,
  };
};
