const express = require('express');
const fs = require('fs');
const path = require('path');

// Cria diretório de fila
const queueDir = '/tmp/jyze-print-queue';
if (!fs.existsSync(queueDir)) {
    fs.mkdirSync(queueDir, { recursive: true });
    console.log('📁 Diretório criado:', queueDir);
}

module.exports = function(app) {
    console.log('🖨️ Configurando endpoints de impressão...');
    
    // Endpoint para criar comando de impressão
    app.post('/api/printer/simple', (req, res) => {
        try {
            console.log('📥 Comando de impressão recebido');
            
            const { type, data } = req.body;
            const commandId = Date.now();
            const commandFile = path.join(queueDir, `print-${commandId}.json`);
            
            const command = {
                id: commandId,
                type: type || 'print_receipt',
                data: data,
                timestamp: new Date().toISOString()
            };
            
            fs.writeFileSync(commandFile, JSON.stringify(command, null, 2));
            
            console.log(`📝 Comando salvo: ${commandFile}`);
            
            res.json({
                success: true,
                message: 'Comando de impressão criado',
                commandId: commandId,
                downloadUrl: `http://31.97.162.165:3001/api/printer/get/${commandId}`,
                command: `curl -s http://31.97.162.165:3001/api/printer/get/${commandId} | node -e "const data=JSON.parse(require('fs').readFileSync(0)); require('fs').writeFileSync('/tmp/cmd.json', JSON.stringify(data)); console.log('Downloaded to /tmp/cmd.json')"`
            });
            
        } catch (error) {
            console.error('❌ Erro:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    
    // Endpoint para baixar comando
    app.get('/api/printer/get/:id', (req, res) => {
        try {
            const commandFile = path.join(queueDir, `print-${req.params.id}.json`);
            
            if (fs.existsSync(commandFile)) {
                const command = JSON.parse(fs.readFileSync(commandFile, 'utf8'));
                res.json(command);
                
                // Remove após 30 segundos
                setTimeout(() => {
                    try {
                        if (fs.existsSync(commandFile)) {
                            fs.unlinkSync(commandFile);
                            console.log(`🗑️ Comando removido: ${req.params.id}`);
                        }
                    } catch (e) {}
                }, 30000);
                
            } else {
                res.status(404).json({ success: false, message: 'Comando não encontrado' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    
    // Endpoint de teste
    app.post('/api/printer/test-simple', (req, res) => {
        const testData = {
            restaurantName: 'JYZE DELIVERY',
            orderId: 'SIMPLE-TEST-' + Date.now(),
            customer: 'TESTE ENDPOINT SIMPLES',
            items: [
                {
                    name: 'Pizza Margherita G',
                    quantity: 1,
                    price: 35.90
                }
            ],
            address: 'Endereço teste simples, 123',
            total: 35.90,
            paymentMethod: 'Dinheiro'
        };
        
        const commandId = Date.now();
        const commandFile = path.join(queueDir, `print-${commandId}.json`);
        
        const command = {
            id: commandId,
            type: 'print_receipt',
            data: testData,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(commandFile, JSON.stringify(command, null, 2));
        
        res.json({
            success: true,
            message: 'Teste de impressão criado',
            commandId: commandId,
            downloadUrl: `http://31.97.162.165:3001/api/printer/get/${commandId}`,
            executeCommand: `curl -s http://31.97.162.165:3001/api/printer/get/${commandId} > /tmp/print-${commandId}.json && node /home/eric/Vídeos/converse-sell-hub-34-main/process-print-command.js /tmp/print-${commandId}.json`
        });
    });
    
    // Status da fila
    app.get('/api/printer/queue', (req, res) => {
        try {
            const files = fs.readdirSync(queueDir)
                .filter(f => f.startsWith('print-'))
                .map(f => ({
                    file: f,
                    created: fs.statSync(path.join(queueDir, f)).birthtime
                }));
            
            res.json({
                success: true,
                queueDir: queueDir,
                jobs: files.length,
                files: files
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    
    console.log('✅ Endpoints de impressão configurados!');
    console.log('   POST /api/printer/simple');
    console.log('   GET  /api/printer/get/:id');
    console.log('   POST /api/printer/test-simple');
    console.log('   GET  /api/printer/queue');
};
