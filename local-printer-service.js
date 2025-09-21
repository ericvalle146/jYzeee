#!/usr/bin/env node

/**
 * 🖨️ SERVIÇO LOCAL DE IMPRESSÃO
 * 
 * Este serviço roda localmente e:
 * 1. Recebe webhooks da VPS para impressão
 * 2. Imprime na impressora local
 * 3. Confirma impressão de volta para VPS
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = 3003;

// Middleware
app.use(express.json());

// Configurações
const VPS_BACKEND_URL = 'https://api.jyze.space';
const LOCAL_PRINTER_NAME = 'EPSON_TM_T20'; // Ajuste para sua impressora

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
    const fs = require('fs');
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
 * 📡 WEBHOOK PARA IMPRESSÃO
 */
app.post('/print', async (req, res) => {
  try {
    console.log('📡 Webhook de impressão recebido:', req.body);
    
    const { orderData, printText, orderId } = req.body;
    
    if (!printText) {
      return res.status(400).json({
        success: false,
        message: 'Texto de impressão não fornecido'
      });
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
            printedBy: 'local-service'
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
 * 🔍 ENDPOINT DE STATUS
 */
app.get('/status', async (req, res) => {
  try {
    const printers = await detectLocalPrinters();
    
    res.json({
      success: true,
      message: 'Serviço local de impressão funcionando',
      platform: process.platform,
      printers: printers ? 'Detectadas' : 'Erro na detecção',
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
Serviço: Local Printer Service
Status: ✅ FUNCIONANDO

Este é um teste do sistema de impressão local.
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀 SERVIÇO LOCAL DE IMPRESSÃO INICIADO
=====================================
📍 URL: http://localhost:${PORT}
🔍 Status: http://localhost:${PORT}/status
🧪 Teste: POST http://localhost:${PORT}/test-print
🖨️ Impressão: POST http://localhost:${PORT}/print

📋 Configurações:
- VPS Backend: ${VPS_BACKEND_URL}
- Impressora Local: ${LOCAL_PRINTER_NAME}
- Plataforma: ${process.platform}

✅ Aguardando webhooks de impressão...
  `);
});

// Detectar impressoras na inicialização
detectLocalPrinters();
