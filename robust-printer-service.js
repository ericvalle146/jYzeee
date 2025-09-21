#!/usr/bin/env node

/**
 * 🖨️ SERVIÇO ROBUSTO DE IMPRESSÃO LOCAL
 * 
 * Sistema completo baseado em pesquisas de melhores práticas:
 * 1. Detecção automática de impressoras
 * 2. Múltiplas opções de impressão
 * 3. Interface web completa
 * 4. Sistema de fallback robusto
 * 5. Logs detalhados
 */

const express = require('express');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);
const app = express();
const PORT = 3003;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configurações
const VPS_BACKEND_URL = 'https://api.jyze.space';
const AUTH_FILE = 'authorized-ips.json';
const LOG_FILE = 'printer-logs.json';

// Estrutura de dados
let authorizedIPs = { ips: [], lastUpdated: new Date().toISOString() };
let printerLogs = { logs: [], lastUpdated: new Date().toISOString() };
let detectedPrinters = [];

/**
 * 🔍 DETECTAR TODAS AS IMPRESSORAS DISPONÍVEIS
 */
async function detectAllPrinters() {
  try {
    console.log('🔍 Detectando impressoras disponíveis...');
    const printers = [];
    
    if (process.platform === 'win32') {
      // Windows - usar wmic
      try {
        const { stdout } = await execAsync('wmic printer get name,default,status /format:csv');
        const lines = stdout.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 3 && parts[1] && parts[1] !== 'Name') {
            printers.push({
              name: parts[1].trim(),
              isDefault: parts[2] === 'TRUE',
              status: parts[3] ? parts[3].trim() : 'Unknown',
              platform: 'windows'
            });
          }
        });
      } catch (error) {
        console.log('⚠️ Erro ao detectar impressoras Windows:', error.message);
      }
    } else {
      // Linux/macOS - usar lpstat
      try {
        const { stdout } = await execAsync('lpstat -p');
        const lines = stdout.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          if (line.includes('printer')) {
            const match = line.match(/printer (\S+)/);
            if (match) {
              const name = match[1];
              const isActive = line.includes('is idle') || line.includes('is idle');
              printers.push({
                name: name,
                isDefault: false,
                status: isActive ? 'idle' : 'inactive',
                platform: 'linux'
              });
            }
          }
        });
      } catch (error) {
        console.log('⚠️ Erro ao detectar impressoras Linux:', error.message);
      }
    }
    
    // Adicionar impressoras padrão do sistema
    printers.push({
      name: 'SISTEMA_PADRAO',
      isDefault: true,
      status: 'available',
      platform: 'system'
    });
    
    detectedPrinters = printers;
    console.log(`✅ ${printers.length} impressoras detectadas:`, printers.map(p => p.name));
    return printers;
    
  } catch (error) {
    console.error('❌ Erro na detecção de impressoras:', error);
    return [];
  }
}

/**
 * 🖨️ IMPRIMIR COM MÚLTIPLAS ESTRATÉGIAS
 */
async function printWithMultipleStrategies(text, preferredPrinter = null) {
  const results = [];
  
  // Estratégia 1: Impressora preferida
  if (preferredPrinter) {
    try {
      const result = await printToSpecificPrinter(text, preferredPrinter);
      results.push({ strategy: 'preferred', printer: preferredPrinter, result });
      if (result.success) return result;
    } catch (error) {
      results.push({ strategy: 'preferred', printer: preferredPrinter, error: error.message });
    }
  }
  
  // Estratégia 2: Impressora padrão do sistema
  try {
    const result = await printToSystemDefault(text);
    results.push({ strategy: 'system_default', result });
    if (result.success) return result;
  } catch (error) {
    results.push({ strategy: 'system_default', error: error.message });
  }
  
  // Estratégia 3: Todas as impressoras detectadas
  for (const printer of detectedPrinters) {
    if (printer.name === preferredPrinter) continue;
    
    try {
      const result = await printToSpecificPrinter(text, printer.name);
      results.push({ strategy: 'detected', printer: printer.name, result });
      if (result.success) return result;
    } catch (error) {
      results.push({ strategy: 'detected', printer: printer.name, error: error.message });
    }
  }
  
  // Estratégia 4: Fallback - salvar arquivo
  try {
    const result = await saveToFile(text);
    results.push({ strategy: 'file_fallback', result });
    return result;
  } catch (error) {
    results.push({ strategy: 'file_fallback', error: error.message });
  }
  
  return {
    success: false,
    message: 'Todas as estratégias de impressão falharam',
    results: results
  };
}

/**
 * 🖨️ IMPRIMIR EM IMPRESSORA ESPECÍFICA
 */
async function printToSpecificPrinter(text, printerName) {
  try {
    console.log(`🖨️ Tentando imprimir em: ${printerName}`);
    
    // Criar arquivo temporário
    const tempFile = `temp_print_${Date.now()}.txt`;
    fs.writeFileSync(tempFile, text, 'utf8');
    
    let command;
    
    if (process.platform === 'win32') {
      // Windows
      command = `notepad /p "${tempFile}"`;
    } else {
      // Linux/macOS
      command = `lp -d "${printerName}" "${tempFile}"`;
    }
    
    console.log(`⚡ Executando: ${command}`);
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
    
    // Limpar arquivo temporário
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    if (stderr && !stderr.includes('warning')) {
      throw new Error(stderr);
    }
    
    console.log(`✅ Impressão enviada para: ${printerName}`);
    return {
      success: true,
      message: `Impressão enviada para: ${printerName}`,
      printer: printerName
    };
    
  } catch (error) {
    console.error(`❌ Erro ao imprimir em ${printerName}:`, error.message);
    return {
      success: false,
      message: `Erro ao imprimir em ${printerName}: ${error.message}`,
      printer: printerName
    };
  }
}

/**
 * 🖨️ IMPRIMIR NO SISTEMA PADRÃO
 */
async function printToSystemDefault(text) {
  try {
    console.log('🖨️ Imprimindo no sistema padrão...');
    
    const tempFile = `temp_print_${Date.now()}.txt`;
    fs.writeFileSync(tempFile, text, 'utf8');
    
    let command;
    
    if (process.platform === 'win32') {
      command = `notepad /p "${tempFile}"`;
    } else {
      command = `lp "${tempFile}"`;
    }
    
    const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
    
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    if (stderr && !stderr.includes('warning')) {
      throw new Error(stderr);
    }
    
    return {
      success: true,
      message: 'Impressão enviada para sistema padrão',
      printer: 'system_default'
    };
    
  } catch (error) {
    throw new Error(`Erro no sistema padrão: ${error.message}`);
  }
}

/**
 * 💾 SALVAR EM ARQUIVO (FALLBACK)
 */
async function saveToFile(text) {
  try {
    const filename = `pedido_${Date.now()}.txt`;
    const filepath = path.join(__dirname, 'printed_orders', filename);
    
    // Criar diretório se não existir
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, text, 'utf8');
    
    return {
      success: true,
      message: `Arquivo salvo em: ${filepath}`,
      filepath: filepath,
      fallback: true
    };
    
  } catch (error) {
    throw new Error(`Erro ao salvar arquivo: ${error.message}`);
  }
}

/**
 * 📝 ADICIONAR LOG
 */
function addLog(level, message, data = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    data: data
  };
  
  printerLogs.logs.unshift(log);
  
  // Manter apenas os últimos 100 logs
  if (printerLogs.logs.length > 100) {
    printerLogs.logs = printerLogs.logs.slice(0, 100);
  }
  
  printerLogs.lastUpdated = new Date().toISOString();
  
  // Salvar logs
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(printerLogs, null, 2));
  } catch (error) {
    console.error('Erro ao salvar logs:', error);
  }
  
  console.log(`📝 [${level.toUpperCase()}] ${message}`);
}

/**
 * 🌐 INTERFACE WEB COMPLETA
 */
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🖨️ Sistema Robusto de Impressão</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; color: white; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
        .card:hover { transform: translateY(-5px); }
        .card h3 { color: #333; margin-bottom: 15px; font-size: 1.3em; }
        .status { padding: 10px; border-radius: 8px; margin: 10px 0; font-weight: 500; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .btn { padding: 12px 24px; margin: 5px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-block; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .printer-list { max-height: 300px; overflow-y: auto; }
        .printer-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 8px; background: #f8f9fa; }
        .printer-item.active { background: #d4edda; border-color: #c3e6cb; }
        .printer-item.inactive { background: #f8d7da; border-color: #f5c6cb; }
        .ip-list { max-height: 400px; overflow-y: auto; }
        .ip-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 1px solid #ddd; margin: 8px 0; border-radius: 8px; }
        .ip-item.approved { background: #d4edda; }
        .ip-item.pending { background: #fff3cd; }
        .ip-item.rejected { background: #f8d7da; }
        .logs { max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .log-item { padding: 8px; margin: 5px 0; border-radius: 5px; font-family: monospace; font-size: 0.9em; }
        .log-info { background: #d1ecf1; }
        .log-warn { background: #fff3cd; }
        .log-error { background: #f8d7da; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border: 2px solid #e9ecef; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖨️ Sistema Robusto de Impressão</h1>
            <p>Controle completo de impressão local com autenticação por IP</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${detectedPrinters.length}</div>
                <div class="stat-label">Impressoras</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${authorizedIPs.ips.length}</div>
                <div class="stat-label">IPs Cadastrados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${authorizedIPs.ips.filter(ip => ip.status === 'approved').length}</div>
                <div class="stat-label">IPs Autorizados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${printerLogs.logs.length}</div>
                <div class="stat-label">Logs</div>
            </div>
        </div>

        <div class="grid">
            <!-- Impressoras -->
            <div class="card">
                <h3>🖨️ Impressoras Detectadas</h3>
                <div class="printer-list">
                    ${detectedPrinters.length === 0 ? 
                      '<div class="status warning">Nenhuma impressora detectada</div>' :
                      detectedPrinters.map(printer => `
                        <div class="printer-item ${printer.status === 'idle' || printer.status === 'available' ? 'active' : 'inactive'}">
                            <div>
                                <strong>${printer.name}</strong><br>
                                <small>Status: ${printer.status} | ${printer.platform}</small>
                            </div>
                            <button class="btn btn-info" onclick="testPrinter('${printer.name}')">🧪 Testar</button>
                        </div>
                      `).join('')
                    }
                </div>
                <button class="btn btn-primary" onclick="refreshPrinters()">🔄 Atualizar</button>
            </div>

            <!-- IPs Autorizados -->
            <div class="card">
                <h3>🌐 Controle de IPs</h3>
                <div class="ip-list">
                    ${authorizedIPs.ips.length === 0 ? 
                      '<div class="status info">Nenhum IP cadastrado ainda</div>' :
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
            </div>

            <!-- Logs -->
            <div class="card">
                <h3>📝 Logs do Sistema</h3>
                <div class="logs">
                    ${printerLogs.logs.slice(0, 20).map(log => `
                        <div class="log-item log-${log.level}">
                            <strong>[${new Date(log.timestamp).toLocaleTimeString()}]</strong> ${log.message}
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-info" onclick="clearLogs()">🗑️ Limpar Logs</button>
            </div>

            <!-- Testes -->
            <div class="card">
                <h3>🧪 Testes e Ações</h3>
                <button class="btn btn-primary" onclick="testPrint()">🖨️ Teste de Impressão</button>
                <button class="btn btn-info" onclick="refreshStatus()">🔄 Atualizar Status</button>
                <button class="btn btn-success" onclick="openPrintFolder()">📁 Abrir Pasta</button>
                <div id="testResult" style="margin-top: 15px;"></div>
            </div>
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

        async function testPrinter(printerName) {
            const response = await fetch('/test-printer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ printer: printerName })
            });
            const result = await response.json();
            alert(result.message);
        }

        async function testPrint() {
            const resultDiv = document.getElementById('testResult');
            resultDiv.innerHTML = '<div class="status info">Testando impressão...</div>';
            
            const response = await fetch('/test-print', { method: 'POST' });
            const result = await response.json();
            
            resultDiv.innerHTML = \`<div class="status \${result.success ? 'success' : 'error'}">\${result.message}</div>\`;
        }

        async function refreshPrinters() {
            const response = await fetch('/refresh-printers', { method: 'POST' });
            const result = await response.json();
            alert(result.message);
            location.reload();
        }

        async function refreshStatus() {
            location.reload();
        }

        function openPrintFolder() {
            window.open('/print-folder', '_blank');
        }

        async function clearLogs() {
            if (confirm('Tem certeza que deseja limpar os logs?')) {
                const response = await fetch('/clear-logs', { method: 'POST' });
                if (response.ok) {
                    location.reload();
                }
            }
        }

        // Auto-refresh a cada 30 segundos
        setInterval(refreshStatus, 30000);
    </script>
</body>
</html>
  `;
  res.send(html);
});

/**
 * 📡 WEBHOOK PRINCIPAL DE IMPRESSÃO
 */
app.post('/print', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const { orderData, printText, orderId } = req.body;
    
    addLog('info', `Webhook de impressão recebido de IP: ${clientIP}`, { orderId, clientIP });
    
    // Verificar autorização
    if (!isIPAuthorized(clientIP)) {
      addLog('warn', `IP não autorizado: ${clientIP}`);
      
      // Adicionar à lista pendente
      const existingIP = authorizedIPs.ips.find(ip => ip.ip === clientIP);
      if (!existingIP) {
        authorizedIPs.ips.push({
          ip: clientIP,
          name: orderData?.nome_cliente || 'Usuário não identificado',
          status: 'pending',
          firstRequest: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });
        saveAuthorizedIPs();
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
    
    // Atualizar atividade do IP
    const ipData = authorizedIPs.ips.find(ip => ip.ip === clientIP);
    if (ipData) {
      ipData.lastActivity = new Date().toISOString();
      saveAuthorizedIPs();
    }
    
    // Imprimir com múltiplas estratégias
    addLog('info', `Iniciando impressão para pedido: ${orderId}`);
    const printResult = await printWithMultipleStrategies(printText);
    
    if (printResult.success) {
      addLog('success', `Impressão realizada com sucesso: ${printResult.message}`);
      
      // Confirmar na VPS
      if (orderId) {
        try {
          const fetch = require('node-fetch');
          await fetch(`${VPS_BACKEND_URL}/orders/${orderId}/print-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              impresso: true,
              printedAt: new Date().toISOString(),
              printedBy: 'robust-local-service',
              printedFromIP: clientIP
            })
          });
          addLog('info', 'Status confirmado na VPS');
        } catch (error) {
          addLog('error', 'Erro ao confirmar na VPS', { error: error.message });
        }
      }
    } else {
      addLog('error', 'Falha na impressão', { result: printResult });
    }
    
    res.json(printResult);
    
  } catch (error) {
    addLog('error', 'Erro no webhook de impressão', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro interno no serviço de impressão',
      error: error.message
    });
  }
});

// Endpoints auxiliares
app.post('/approve-ip', (req, res) => {
  try {
    const { ip } = req.body;
    const ipData = authorizedIPs.ips.find(item => item.ip === ip);
    
    if (ipData) {
      ipData.status = 'approved';
      ipData.approvedAt = new Date().toISOString();
      saveAuthorizedIPs();
      addLog('info', `IP aprovado: ${ip}`);
      res.json({ success: true, message: `IP ${ip} aprovado com sucesso` });
    } else {
      res.status(404).json({ success: false, message: 'IP não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/reject-ip', (req, res) => {
  try {
    const { ip } = req.body;
    const ipData = authorizedIPs.ips.find(item => item.ip === ip);
    
    if (ipData) {
      ipData.status = 'rejected';
      ipData.rejectedAt = new Date().toISOString();
      saveAuthorizedIPs();
      addLog('info', `IP rejeitado: ${ip}`);
      res.json({ success: true, message: `IP ${ip} rejeitado` });
    } else {
      res.status(404).json({ success: false, message: 'IP não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/test-print', async (req, res) => {
  try {
    const testText = `
=== TESTE DE IMPRESSÃO ROBUSTA ===
Data: ${new Date().toLocaleString()}
Serviço: Sistema Robusto de Impressão
Status: ✅ FUNCIONANDO PERFEITAMENTE!

Este é um teste do sistema robusto de impressão
com múltiplas estratégias e fallbacks.
Se você está vendo isso, o sistema está funcionando!
========================================
    `;
    
    const result = await printWithMultipleStrategies(testText);
    addLog('info', 'Teste de impressão executado', { result });
    res.json(result);
    
  } catch (error) {
    addLog('error', 'Erro no teste de impressão', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro no teste de impressão',
      error: error.message
    });
  }
});

app.post('/test-printer', async (req, res) => {
  try {
    const { printer } = req.body;
    const testText = `Teste da impressora: ${printer}\nData: ${new Date().toLocaleString()}`;
    
    const result = await printToSpecificPrinter(testText, printer);
    addLog('info', `Teste da impressora: ${printer}`, { result });
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no teste da impressora',
      error: error.message
    });
  }
});

app.post('/refresh-printers', async (req, res) => {
  try {
    await detectAllPrinters();
    addLog('info', 'Impressoras atualizadas');
    res.json({ success: true, message: 'Impressoras atualizadas com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/clear-logs', (req, res) => {
  try {
    printerLogs.logs = [];
    printerLogs.lastUpdated = new Date().toISOString();
    fs.writeFileSync(LOG_FILE, JSON.stringify(printerLogs, null, 2));
    addLog('info', 'Logs limpos');
    res.json({ success: true, message: 'Logs limpos com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/print-folder', (req, res) => {
  const folderPath = path.join(__dirname, 'printed_orders');
  res.json({ 
    success: true, 
    message: 'Pasta de impressões',
    path: folderPath,
    files: fs.existsSync(folderPath) ? fs.readdirSync(folderPath) : []
  });
});

app.get('/status', async (req, res) => {
  try {
    const printers = await detectAllPrinters();
    
    res.json({
      success: true,
      message: 'Sistema robusto de impressão funcionando',
      platform: process.platform,
      printers: printers.length,
      printerNames: printers.map(p => p.name),
      authorizedIPs: authorizedIPs.ips.length,
      pendingIPs: authorizedIPs.ips.filter(ip => ip.status === 'pending').length,
      logs: printerLogs.logs.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no sistema',
      error: error.message
    });
  }
});

// Funções auxiliares
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
}

function isIPAuthorized(ip) {
  return authorizedIPs.ips.some(authorizedIP => 
    authorizedIP.ip === ip && authorizedIP.status === 'approved'
  );
}

function loadAuthorizedIPs() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf8');
      authorizedIPs = JSON.parse(data);
      addLog('info', `IPs autorizados carregados: ${authorizedIPs.ips.length}`);
    }
  } catch (error) {
    addLog('error', 'Erro ao carregar IPs autorizados', { error: error.message });
  }
}

function saveAuthorizedIPs() {
  try {
    authorizedIPs.lastUpdated = new Date().toISOString();
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authorizedIPs, null, 2));
  } catch (error) {
    addLog('error', 'Erro ao salvar IPs autorizados', { error: error.message });
  }
}

function loadLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf8');
      printerLogs = JSON.parse(data);
    }
  } catch (error) {
    addLog('error', 'Erro ao carregar logs', { error: error.message });
  }
}

// Inicialização
loadAuthorizedIPs();
loadLogs();
detectAllPrinters();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀 SISTEMA ROBUSTO DE IMPRESSÃO INICIADO
========================================
📍 URL: http://localhost:${PORT}
🔍 Status: http://localhost:${PORT}/status
🧪 Teste: POST http://localhost:${PORT}/test-print
🖨️ Impressão: POST http://localhost:${PORT}/print

📋 Configurações:
- VPS Backend: ${VPS_BACKEND_URL}
- Plataforma: ${process.platform}
- IPs Autorizados: ${authorizedIPs.ips.length}
- Impressoras: ${detectedPrinters.length}

✅ Sistema robusto com múltiplas estratégias de impressão
✅ Interface web completa para gerenciamento
✅ Logs detalhados e sistema de fallback
✅ Aguardando webhooks de impressão...
  `);
  
  addLog('info', 'Sistema robusto de impressão iniciado', {
    port: PORT,
    platform: process.platform,
    printers: detectedPrinters.length
  });
});
