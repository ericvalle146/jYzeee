/**
 * CONFIGURAÇÃO CENTRALIZADA DE APIS
 * 
 * Configurações principais do frontend para comunicação com os serviços.
 * N8N e Evolution API são configurados via .env no backend.
 */

// URLs BASE
export const API_CONFIG = {
  // Backend principal (LOCAL)
  BACKEND_URL: 'http://localhost:3002',
  BACKEND_API: 'http://localhost:3002',
  
  // Frontend 
  FRONTEND_URL: 'https://jyze.space',
  
  // Timeouts padrão
  DEFAULT_TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000, // 3 segundos
} as const;

// Helper functions
export const getApiUrl = (endpoint: string) => `${API_CONFIG.BACKEND_API}${endpoint}`;

// Status de conectividade
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_CONFIG.BACKEND_API}/printer/status`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

// Export default para compatibilidade
export default API_CONFIG;
