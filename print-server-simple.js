#!/usr/bin/env node

/**
 * 🖨️ SERVIDOR LOCAL DE IMPRESSÃO - VERSÃO SIMPLES
 * 
 * Este aplicativo serve APENAS para impressão local.
 * Todo o resto (site, backend, banco) fica na VPS.
 * 
 * Funcionalidades:
 * - Auto-start quando abre o app
 * - Servidor HTTP local na porta 3000
 * - Recebe comandos de impressão da VPS
 * - Imprime direto na USB
 * - Interface mínima para configuração
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Importar serviço de impressão Linux (via lp)
const linuxPrinter = require('./linux-printer-service');

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 SERVIDOR LOCAL DE IMPRESSÃO INICIANDO...');
console.log('========================================');

/**
 * 📡 ENDPOINT PRINCIPAL - RECEBE PEDIDOS DA VPS
 */
app.post('/print', async (req, res) => {
  try {
    const { orderData, text } = req.body;
    
    console.log(`📋 Pedido recebido da VPS: #${orderData?.id || 'N/A'}`);
    
    // Imprimir diretamente
    const result = await linuxPrinter.printOrder(orderData);
    
    if (result.success) {
      console.log('✅ Pedido impresso com sucesso!');
      res.json({ success: true, message: 'Impresso com sucesso' });
    } else {
      console.error('❌ Falha na impressão:', result.message);
      res.status(500).json({ success: false, message: result.message });
    }
    
  } catch (error) {
    console.error('❌ Erro no endpoint de impressão:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🔧 ENDPOINT DE CONFIGURAÇÃO
 */
app.get('/config', async (req, res) => {
  try {
    const printers = await linuxPrinter.detectSystemPrinters();
    const status = await linuxPrinter.getPrinterStatus();
    
    res.json({
      success: true,
      printers,
      status,
      serverInfo: {
        port: PORT,
        running: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🧪 ENDPOINT DE TESTE
 */
app.post('/test', async (req, res) => {
  try {
    const result = await linuxPrinter.testPrint();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 📋 STATUS DO SERVIDOR
 */
app.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor de impressão funcionando',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

/**
 * 🌐 INTERFACE SIMPLES PARA CONFIGURAÇÃO
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🖨️ Servidor de Impressão Local</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { padding: 15px; background: #d4edda; color: #155724; border-radius: 5px; margin: 20px 0; }
            .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #0056b3; }
            .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🖨️ Servidor de Impressão Local</h1>
            <div class="status">
                ✅ Servidor funcionando na porta ${PORT}
            </div>
            
            <div class="info">
                <h3>📡 Como usar:</h3>
                <p><strong>1.</strong> Este servidor recebe comandos da sua VPS</p>
                <p><strong>2.</strong> Imprime automaticamente na impressora USB</p>
                <p><strong>3.</strong> Mantenha este aplicativo sempre aberto</p>
            </div>
            
            <h3>🔧 Controles:</h3>
            <button class="btn" onclick="detectPrinters()">🔍 Detectar Impressoras</button>
            <button class="btn" onclick="testPrint()">🧪 Teste de Impressão</button>
            <button class="btn" onclick="checkStatus()">📊 Verificar Status</button>
            
            <div id="result" style="margin-top: 20px;"></div>
        </div>
        
        <script>
            async function detectPrinters() {
                const response = await fetch('/config');
                const data = await response.json();
                document.getElementById('result').innerHTML = 
                    '<h4>Impressoras detectadas:</h4><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
            
            async function testPrint() {
                const response = await fetch('/test', { method: 'POST' });
                const data = await response.json();
                document.getElementById('result').innerHTML = 
                    '<h4>Resultado do teste:</h4>' + 
                    (data.success ? '✅ ' + data.message : '❌ ' + data.message);
            }
            
            async function checkStatus() {
                const response = await fetch('/status');
                const data = await response.json();
                document.getElementById('result').innerHTML = 
                    '<h4>Status:</h4><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
        </script>
    </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
✅ SERVIDOR DE IMPRESSÃO LOCAL INICIADO!
==========================================
🌐 URL: http://localhost:${PORT}
📡 Aguardando comandos da VPS...
🖨️ Impressora: Pronta para uso
📅 Iniciado em: ${new Date().toLocaleString()}

🔧 Endpoints disponíveis:
   GET  /          - Interface de configuração
   GET  /status    - Status do servidor  
   GET  /config    - Configurações da impressora
   POST /print     - Imprimir pedido (usado pela VPS)
   POST /test      - Teste de impressão
`);
  
  // Auto-detectar impressoras na inicialização
  setTimeout(async () => {
    try {
      const printers = await linuxPrinter.detectSystemPrinters();
      console.log(`🖨️ ${printers.length} impressora(s) detectada(s) automaticamente`);
      
      // Auto-conectar à impressora térmica
      const thermalPrinter = printers.find(p => p.id === 'termica') || printers[0];
      if (thermalPrinter) {
        const result = await linuxPrinter.connectToPrinter(thermalPrinter.id);
        if (result.success) {
          console.log(`🔌 Conectado automaticamente: ${thermalPrinter.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro na inicialização automática:', error);
    }
  }, 2000);
});

module.exports = app;
