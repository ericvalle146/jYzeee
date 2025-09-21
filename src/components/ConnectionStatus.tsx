import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export const ConnectionStatus: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkBackend = async () => {
    try {
      setBackendStatus('checking');
      const response = await fetch(`http://localhost:3002/customers/stats`, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'online': return '✅ Backend Online';
      case 'offline': return '❌ Backend Offline';
      case 'checking': return '🔄 Verificando...';
      default: return '❓ Desconhecido';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      <Badge variant="outline" className="text-xs">
        {getStatusText()}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {lastCheck.toLocaleTimeString('pt-BR')}
      </span>
      <button 
        onClick={checkBackend}
        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        🔄 Testar
      </button>
    </div>
  );
};
