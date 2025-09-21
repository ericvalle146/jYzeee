import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, Clock, AlertCircle, Settings } from 'lucide-react';
import { useGlobalAutoPrint } from '../contexts/GlobalAutoPrintContext';

export const GlobalAutoPrintControl: React.FC = () => {
  const {
    isEnabled,
    toggleAutoPrint,
    isProcessing,
    lastPrintedId,
    activationTimestamp,
    selectedPrinter,
    printers,
    isDetecting,
    detectPrinters,
  } = useGlobalAutoPrint();
  
  const printerConnected = selectedPrinter && printers.find(p => p.id === selectedPrinter)?.status === 'online';

  return (
    <div className="flex items-center space-x-3 px-3 py-2 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
      <Printer className="h-4 w-4 text-muted-foreground" />
      
      <div className="flex items-center space-x-2">
        <Switch
          id="global-auto-print"
          checked={isEnabled}
          onCheckedChange={toggleAutoPrint}
        />
        <Label htmlFor="global-auto-print" className="text-sm font-medium">
          Auto-impressão
        </Label>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-2">
        {isEnabled ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
            ATIVA
          </Badge>
        ) : (
          <Badge variant="secondary">
            INATIVA
          </Badge>
        )}

        {isProcessing && (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-1 animate-spin" />
            Imprimindo...
          </Badge>
        )}

        
        {!selectedPrinter && !isDetecting && (
          <button
            onClick={detectPrinters}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Detectar impressoras"
          >
            <Settings className="w-3 h-3 mr-1" />
            Detectar
          </button>
        )}

        {isDetecting && (
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-1 animate-spin" />
            Detectando...
          </Badge>
        )}
      </div>

      {/* Timestamp info */}
      {isEnabled && activationTimestamp && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          desde {new Date(activationTimestamp).toLocaleTimeString('pt-BR')}
        </div>
      )}

      {/* Last printed info */}
      {lastPrintedId && (
        <div className="text-xs text-muted-foreground">
          Último: #{lastPrintedId}
        </div>
      )}
    </div>
  );
};
