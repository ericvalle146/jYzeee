/**
 * 🔧 CONFIGURAÇÃO GLOBAL DA APLICAÇÃO
 * 
 * Configurações centralizadas e dinâmicas baseadas no ambiente
 */

// Detectar ambiente e tipo de aplicação
const getEnvironmentInfo = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return {
      isSSR: true,
      isProduction: false,
      isElectron: false,
      hostname: 'localhost',
      protocol: 'http:'
    };
  }

  return {
    isSSR: false,
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    isElectron: typeof window.process === 'object' && window.process?.type === 'renderer',
    hostname: window.location.hostname,
    protocol: window.location.protocol
  };
};

const env = getEnvironmentInfo();

// Configurações principais
export const APP_CONFIG = {
  // Informações do ambiente
  environment: {
    ...env,
    isDevelopment: !env.isProduction,
    isLocal: env.hostname === 'localhost' || env.hostname === '127.0.0.1'
  },

  // URLs de serviços
  services: {
    // Backend principal (NestJS) - Sempre usa api.jyze.space em produção
    backend: {
      url: env.isProduction && !env.isElectron 
        ? 'https://api.jyze.space'
        : 'http://localhost:3000',
      timeout: 10000,
      retries: 3
    },

    // Serviço de impressão via IP - Comunica diretamente via IP (não usa domínio)
    printer: {
      url: env.isProduction && !env.isElectron 
        ? `${env.protocol}//${env.hostname}:3003`
        : 'http://192.168.3.5:3003',
      timeout: 5000,
      retries: 2,
      healthCheckInterval: 30000
    },

    // Frontend - Sempre usa jyze.space em produção
    frontend: {
      url: env.isProduction 
        ? 'https://jyze.space'
        : 'http://localhost:8081'
    }
  },

  // Configurações de impressão
  printing: {
    defaultPrinter: '5808L-V2024',
    localIP: '192.168.3.5',
    vpsIPs: ['31.97.162.165'],
    queueDir: '/tmp/jyze-print-queue',
    enableLogs: true,
    retryAttempts: 2,
    retryDelay: 2000
  },

  // Timeouts e limites
  timeouts: {
    api: 10000,
    printer: 5000,
    upload: 30000,
    websocket: 5000
  },

  // Configurações de cache
  cache: {
    printerStatus: 10000, // 10 segundos
    orders: 30000, // 30 segundos
    settings: 300000 // 5 minutos
  }
} as const;

// Helper functions
export const getServiceUrl = (service: keyof typeof APP_CONFIG.services, endpoint = '') => {
  const serviceConfig = APP_CONFIG.services[service];
  return `${serviceConfig.url}${endpoint}`;
};

export const isProd = () => APP_CONFIG.environment.isProduction;
export const isDev = () => APP_CONFIG.environment.isDevelopment;
export const isElectron = () => APP_CONFIG.environment.isElectron;

// Função para detectar se está na VPS
export const isVPS = () => {
  return APP_CONFIG.environment.isProduction && 
         !APP_CONFIG.environment.isElectron &&
         !APP_CONFIG.environment.isLocal;
};

export default APP_CONFIG;
