// Configuração de ambiente - detecta se está rodando local ou na VPS
export const environment = {
  // Detecta se está no Electron ou no browser
  isElectron: typeof window !== 'undefined' && window.process?.type === 'renderer',
  
  // Detecta se está rodando localmente
  isLocal: typeof window !== 'undefined' && 
           (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1'),
  
  // URL do servidor de impressão local
  localPrintServer: 'http://localhost:3000',
  
  // Verifica se o servidor local está disponível
  async checkLocalPrintServer(): Promise<boolean> {
    if (!this.isElectron && !this.isLocal) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.localPrintServer}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
      });
      return response.ok;
    } catch (error) {
      console.log('Servidor de impressão local não disponível:', error);
      return false;
    }
  }
};

export type Environment = typeof environment;
