/**
 * 🖨️ CONFIGURAÇÕES DO SISTEMA DE IMPRESSÃO
 * 
 * Centralize todas as configurações aqui para facilitar o deploy
 */

// Carregar variáveis de ambiente se disponível
require('dotenv').config({ silent: true });

const PRINTER_CONFIG = {
  // ========================================
  // CONFIGURAÇÕES DE REDE LOCAL
  // ========================================
  network: {
    localIP: process.env.LOCAL_IP || '192.168.3.5',
    port: parseInt(process.env.LOCAL_PORT) || 3003,
    bindAddress: '0.0.0.0', // Aceita conexões de qualquer IP
  },

  // ========================================
  // CONFIGURAÇÕES DA IMPRESSORA
  // ========================================
  printer: {
    name: process.env.PRINTER_NAME || '5808L-V2024',
    queueDir: process.env.PRINT_QUEUE_DIR || '/tmp/jyze-print-queue',
    enableLogs: process.env.ENABLE_PRINT_LOGS === 'true' || true,
  },

  // ========================================
  // CONFIGURAÇÕES DE SEGURANÇA
  // ========================================
  security: {
    requireIPAuth: process.env.REQUIRE_IP_AUTH === 'true' || true,
    autoApproveLocalIPs: process.env.AUTO_APPROVE_LOCAL_IPS === 'true' || false,
    maxPendingIPs: parseInt(process.env.MAX_PENDING_IPS) || 50,
    vpsAccessToken: process.env.VPS_ACCESS_TOKEN || 'your_secure_token_here',
    webhookSecret: process.env.VPS_WEBHOOK_SECRET || 'your_webhook_secret_here',
  },

  // ========================================
  // CONFIGURAÇÕES VPS/BACKEND
  // ========================================
  vps: {
    backendURL: process.env.VPS_BACKEND_URL || 'https://api.jyze.space',
    enableWebhooks: process.env.ENABLE_VPS_WEBHOOKS === 'true' || true,
  },

  // ========================================
  // CONFIGURAÇÕES DE AMBIENTE
  // ========================================
  environment: {
    nodeEnv: process.env.NODE_ENV || 'development',
    debugMode: process.env.DEBUG_MODE === 'true' || true,
  },

  // ========================================
  // MÉTODOS ÚTEIS
  // ========================================
  getLocalURL() {
    return `http://${this.network.localIP}:${this.network.port}`;
  },

  getRemoteURL() {
    // Para deploy, use IP público ou domínio
    const publicIP = process.env.PUBLIC_IP || this.network.localIP;
    return `http://${publicIP}:${this.network.port}`;
  },

  // IPs da VPS que podem acessar (whitelist)
  getAllowedVPSIPs() {
    return [
      '31.97.162.165', // IP da VPS atual
      // Adicione outros IPs da VPS aqui
    ];
  },

  // Verificar se é acesso da VPS
  isVPSAccess(clientIP) {
    return this.getAllowedVPSIPs().includes(clientIP);
  }
};

module.exports = PRINTER_CONFIG;
