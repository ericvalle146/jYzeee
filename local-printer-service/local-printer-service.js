#!/usr/bin/env node

/**
 * 🖨️ SERVIÇO LOCAL DE IMPRESSÃO COM AUTENTICAÇÃO POR IP
 * 
 * Este serviço roda localmente e:
 * 1. Detecta IP da pessoa que está usando o software
 * 2. Solicita permissão para acessar impressora local
 * 3. Controla acesso por IP autorizado
 * 4. Imprime apenas para IPs autorizados
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Carregar configurações centralizadas
const CONFIG = require('../printer.config.js');

const execAsync = promisify(exec);
const app = express();

// Configurações vindas do arquivo de config
const PORT = CONFIG.network.port;
const VPS_BACKEND_URL = CONFIG.vps.backendURL;
const LOCAL_PRINTER_NAME = CONFIG.printer.name;
const AUTH_FILE = 'authorized-ips.json';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Estrutura de dados para IPs autorizados
let authorizedIPs = {
  ips: [],
  lastUpdated: new Date().toISOString()
};

// Carregar IPs autorizados
function loadAuthorizedIPs() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf8');
      authorizedIPs = JSON.parse(data);
      console.log(`📋 IPs autorizados carregados: ${authorizedIPs.ips.length}`);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar IPs autorizados:', error);
  }
}

// Salvar IPs autorizados
function saveAuthorizedIPs() {
  try {
    authorizedIPs.lastUpdated = new Date().toISOString();
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authorizedIPs, null, 2));
    console.log('💾 IPs autorizados salvos');
  } catch (error) {
    console.error('❌ Erro ao salvar IPs autorizados:', error);
  }
}

// Verificar se IP está autorizado
function isIPAuthorized(ip) {
  // Auto-aprovar IPs da VPS
  if (CONFIG.isVPSAccess(ip)) {
    console.log(`✅ IP ${ip} auto-aprovado (VPS)`);
    return true;
  }
  
  // Verificar lista de IPs autorizados
  return authorizedIPs.ips.some(authorizedIP => 
    authorizedIP.ip === ip && authorizedIP.status === 'approved'
  );
}

// Obter IP real do cliente
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
}

/**
 * 🔍 DETECTAR IMPRESSORAS LOCAIS
 */
async function detectLocalPrinters() {
  try {
    console.log('🔍 Detectando impressoras locais...');
    
    // Windows
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('wmic printer get name,default');
      console.log('📋 Impressoras Windows:', stdout);
      return stdout;
    }
    
    // Linux/macOS
    const { stdout } = await execAsync('lpstat -p');
    console.log('📋 Impressoras Linux/macOS:', stdout);
    return stdout;
    
  } catch (error) {
    console.error('❌ Erro ao detectar impressoras:', error);
    return null;
  }
}

/**
 * 🖨️ IMPRIMIR TEXTO NA IMPRESSORA LOCAL
 */
async function printToLocalPrinter(text, printerName = LOCAL_PRINTER_NAME) {
  try {
    console.log(`🖨️ Imprimindo na impressora: ${printerName}`);
    console.log('📄 Conteúdo:', text);
    
    // Criar arquivo temporário
    const tempFile = `temp_print_${Date.now()}.txt`;
    fs.writeFileSync(tempFile, text, 'utf8');
    
    let command;
    
    // Windows
    if (process.platform === 'win32') {
      command = `notepad /p "${tempFile}"`;
    } else {
      // Linux/macOS
      command = `lp -d "${printerName}" "${tempFile}"`;
    }
    
    console.log(`⚡ Executando: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempFile);
    
    if (stderr) {
      console.error('⚠️ Aviso na impressão:', stderr);
    }
    
    console.log('✅ Impressão enviada com sucesso!');
    return { success: true, message: 'Impressão realizada com sucesso' };
    
  } catch (error) {
    console.error('❌ Erro na impressão:', error);
    return { success: false, message: error.message };
  }
}

/**
 * 🌐 INTERFACE WEB PARA GERENCIAR PERMISSÕES
 */
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🖨️ Gerenciador de Impressão Local</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .ip-list { margin: 20px 0; }
        .ip-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 5px; }
        .ip-item.approved { background: #d4edda; }
        .ip-item.pending { background: #fff3cd; }
        .ip-item.rejected { background: #f8d7da; }
        .btn { padding: 8px 16px; margin: 0 5px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-success { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn:hover { opacity: 0.8; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖨️ Gerenciador de Impressão Local</h1>
            <p>Controle de acesso por IP para impressão local</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3>${authorizedIPs.ips.length}</h3>
                <p>IPs Cadastrados</p>
            </div>
            <div class="stat-card">
                <h3>${authorizedIPs.ips.filter(ip => ip.status === 'approved').length}</h3>
                <p>IPs Autorizados</p>
            </div>
            <div class="stat-card">
                <h3>${authorizedIPs.ips.filter(ip => ip.status === 'pending').length}</h3>
                <p>Pendentes</p>
            </div>
        </div>

        <div class="ip-list">
            <h3>📋 Lista de IPs</h3>
            ${authorizedIPs.ips.length === 0 ? 
              '<div class="status warning">Nenhum IP cadastrado ainda</div>' :
              authorizedIPs.ips.map(ip => `
                <div class="ip-item ${ip.status}">
                    <div>
                        <strong>${ip.ip}</strong><br>
                        <small>${ip.name || 'Sem nome'} - ${ip.status === 'approved' ? '✅ Autorizado' : ip.status === 'pending' ? '⏳ Pendente' : '❌ Rejeitado'}</small><br>
                        <small>Última atividade: ${new Date(ip.lastActivity).toLocaleString()}</small>
                    </div>
                    <div>
                        ${ip.status === 'pending' ? `
                            <button class="btn btn-success" onclick="approveIP('${ip.ip}')">✅ Aprovar</button>
                            <button class="btn btn-danger" onclick="rejectIP('${ip.ip}')">❌ Rejeitar</button>
                        ` : ip.status === 'approved' ? `
                            <button class="btn btn-danger" onclick="rejectIP('${ip.ip}')">❌ Revogar</button>
                        ` : `
                            <button class="btn btn-success" onclick="approveIP('${ip.ip}')">✅ Aprovar</button>
                        `}
                    </div>
                </div>
              `).join('')
            }
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <button class="btn btn-info" onclick="location.reload()">🔄 Atualizar</button>
            <button class="btn btn-info" onclick="testPrint()">🧪 Testar Impressão</button>
        </div>
    </div>

    <script>
        async function approveIP(ip) {
            const response = await fetch('/approve-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            if (response.ok) {
                location.reload();
            }
        }

        async function rejectIP(ip) {
            const response = await fetch('/reject-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            if (response.ok) {
                location.reload();
            }
        }

        async function testPrint() {
            const response = await fetch('/test-print', { method: 'POST' });
            const result = await response.json();
            alert(result.message);
        }
    </script>
</body>
</html>
  `;
  res.send(html);
});

/**
 * 📡 WEBHOOK PARA IMPRESSÃO COM AUTENTICAÇÃO
 */
app.post('/print', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    console.log(`📡 Webhook de impressão recebido de IP: ${clientIP}`);
    console.log('📋 Dados:', req.body);
    
    // Verificar se IP está autorizado
    if (!isIPAuthorized(clientIP)) {
      console.log(`❌ IP ${clientIP} não autorizado`);
      
      // Adicionar IP à lista de pendentes se não existir
      const existingIP = authorizedIPs.ips.find(ip => ip.ip === clientIP);
      if (!existingIP) {
        authorizedIPs.ips.push({
          ip: clientIP,
          name: req.body.userName || 'Usuário não identificado',
          status: 'pending',
          firstRequest: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });
        saveAuthorizedIPs();
        console.log(`📝 IP ${clientIP} adicionado à lista de pendentes`);
      } else {
        existingIP.lastActivity = new Date().toISOString();
        saveAuthorizedIPs();
      }
      
      return res.status(403).json({
        success: false,
        message: `IP ${clientIP} não autorizado. Acesse http://localhost:${PORT} para autorizar.`,
        error: 'IP_NOT_AUTHORIZED',
        authUrl: `http://localhost:${PORT}`
      });
    }
    
    const { orderData, printText, orderId } = req.body;
    
    if (!printText) {
      return res.status(400).json({
        success: false,
        message: 'Texto de impressão não fornecido'
      });
    }
    
    // Atualizar última atividade do IP
    const ipData = authorizedIPs.ips.find(ip => ip.ip === clientIP);
    if (ipData) {
      ipData.lastActivity = new Date().toISOString();
      saveAuthorizedIPs();
    }
    
    // Imprimir localmente
    const printResult = await printToLocalPrinter(printText);
    
    // Confirmar impressão na VPS
    if (printResult.success && orderId) {
      try {
        const fetch = require('node-fetch');
        await fetch(`${VPS_BACKEND_URL}/orders/${orderId}/print-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            impresso: true,
            printedAt: new Date().toISOString(),
            printedBy: 'local-service',
            printedFromIP: clientIP
          })
        });
        console.log('✅ Status de impressão confirmado na VPS');
      } catch (error) {
        console.error('⚠️ Erro ao confirmar impressão na VPS:', error);
      }
    }
    
    res.json(printResult);
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no serviço de impressão'
    });
  }
});

/**
 * ✅ APROVAR IP
 */
app.post('/approve-ip', (req, res) => {
  try {
    const { ip } = req.body;
    const ipData = authorizedIPs.ips.find(item => item.ip === ip);
    
    if (ipData) {
      ipData.status = 'approved';
      ipData.approvedAt = new Date().toISOString();
      saveAuthorizedIPs();
      console.log(`✅ IP ${ip} aprovado`);
      res.json({ success: true, message: `IP ${ip} aprovado com sucesso` });
    } else {
      res.status(404).json({ success: false, message: 'IP não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ❌ REJEITAR IP
 */
app.post('/reject-ip', (req, res) => {
  try {
    const { ip } = req.body;
    const ipData = authorizedIPs.ips.find(item => item.ip === ip);
    
    if (ipData) {
      ipData.status = 'rejected';
      ipData.rejectedAt = new Date().toISOString();
      saveAuthorizedIPs();
      console.log(`❌ IP ${ip} rejeitado`);
      res.json({ success: true, message: `IP ${ip} rejeitado` });
    } else {
      res.status(404).json({ success: false, message: 'IP não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🔍 ENDPOINT DE STATUS
 */
app.get('/status', async (req, res) => {
  try {
    const printers = await detectLocalPrinters();
    
    res.json({
      success: true,
      message: 'Serviço local de impressão com autenticação funcionando',
      platform: process.platform,
      printers: printers ? 'Detectadas' : 'Erro na detecção',
      authorizedIPs: authorizedIPs.ips.length,
      pendingIPs: authorizedIPs.ips.filter(ip => ip.status === 'pending').length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no serviço local',
      error: error.message
    });
  }
});

/**
 * 🧪 ENDPOINT DE TESTE
 */
app.post('/test-print', async (req, res) => {
  try {
    const testText = `
=== TESTE DE IMPRESSÃO ===
Data: ${new Date().toLocaleString()}
Serviço: Local Printer Service com Auth
Status: ✅ FUNCIONANDO

Este é um teste do sistema de impressão local
com autenticação por IP.
Se você está vendo isso, o sistema está funcionando!
================================
    `;
    
    const result = await printToLocalPrinter(testText);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no teste de impressão',
      error: error.message
    });
  }
});

// Carregar IPs autorizados na inicialização
loadAuthorizedIPs();

// Iniciar servidor - aceita conexões de qualquer IP
app.listen(PORT, CONFIG.network.bindAddress, () => {
  const localIP = CONFIG.network.localIP;
  const vpsIPs = CONFIG.getAllowedVPSIPs();
  
  console.log(`
🚀 SERVIÇO LOCAL DE IMPRESSÃO COM AUTENTICAÇÃO INICIADO
=====================================================
📍 URL Local: http://localhost:${PORT}
🌐 URL Remota: ${CONFIG.getLocalURL()}
🔍 Status: ${CONFIG.getLocalURL()}/status
🧪 Teste: POST ${CONFIG.getLocalURL()}/test-print
🖨️ Impressão: POST ${CONFIG.getLocalURL()}/print

📋 Configurações:
- VPS Backend: ${VPS_BACKEND_URL}
- Impressora Local: ${LOCAL_PRINTER_NAME}
- Plataforma: ${process.platform}
- IPs Autorizados: ${authorizedIPs.ips.length}
- IP da Máquina: ${localIP}
- IPs VPS Auto-aprovados: ${vpsIPs.join(', ')}

🔒 Segurança:
- Autenticação por IP: ${CONFIG.security.requireIPAuth ? '✅ ATIVA' : '❌ INATIVA'}
- Auto-aprovar VPS: ✅ ATIVA
- Webhook Secret: ${CONFIG.security.webhookSecret !== 'your_webhook_secret_here' ? '✅ CONFIGURADO' : '⚠️ USAR PADRÃO'}

✅ Aguardando webhooks de impressão...
✅ Acesse ${CONFIG.getLocalURL()} para gerenciar permissões
  `);
});

// Detectar impressoras na inicialização
detectLocalPrinters();
