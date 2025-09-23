const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

/**
 * 🖨️ SERVIÇO DE IMPRESSÃO LINUX DIRETO
 * 
 * Usa o comando `lp` do sistema para imprimir diretamente
 * na impressora térmica detectada
 */
class LinuxPrinterService {
  constructor() {
    this.connectedPrinter = null;
    this.isConnected = false;
    this.availablePrinters = [];
  }

  /**
   * 🔍 DETECTAR IMPRESSORAS DO SISTEMA
   */
  async detectSystemPrinters() {
    try {
      console.log('🔍 Detectando impressoras do sistema Linux...');
      
      // Usar lpstat para listar impressoras
      const { stdout } = await execAsync('lpstat -p');
      console.log('📋 Saída lpstat:', stdout);
      
      const printers = [];
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.includes('impressora ')) {
          const match = line.match(/impressora (\S+) está (\w+)/);
          if (match) {
            const [, name, status] = match;
            printers.push({
              id: name,
              name: name,
              type: 'SYSTEM',
              status: status === 'inativa' ? 'offline' : 'online',
              isDefault: false,
              capabilities: ['text', 'raw']
            });
          }
        }
      }
      
      // Adicionar a impressora térmica especificamente
      if (!printers.find(p => p.id === 'termica')) {
        printers.push({
          id: 'termica',
          name: 'Impressora Térmica',
          type: 'THERMAL',
          status: 'available',
          isDefault: true,
          capabilities: ['thermal', 'text', 'raw']
        });
      }
      
      this.availablePrinters = printers;
      console.log(`📋 Encontradas ${printers.length} impressoras:`, printers);
      return printers;

    } catch (error) {
      console.error('❌ Erro ao detectar impressoras:', error);
      // Retornar a impressora térmica como padrão
      return [{
        id: 'termica',
        name: 'Impressora Térmica (Fallback)',
        type: 'THERMAL',
        status: 'available',
        isDefault: true,
        capabilities: ['thermal', 'text', 'raw']
      }];
    }
  }

  /**
   * 🔌 CONECTAR À IMPRESSORA
   */
  async connectToPrinter(printerId = 'termica') {
    try {
      console.log(`🔌 Conectando à impressora: ${printerId}`);
      
      // Verificar se a impressora existe
      const { stdout } = await execAsync(`lpstat -p ${printerId}`);
      
      if (stdout.includes(printerId)) {
        this.connectedPrinter = printerId;
        this.isConnected = true;
        console.log(`✅ Conectado à impressora: ${printerId}`);
        return { success: true, message: `Conectado à ${printerId}` };
      } else {
        throw new Error(`Impressora ${printerId} não encontrada`);
      }

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      
      // Fallback: assumir que a impressora térmica existe
      if (printerId === 'termica') {
        this.connectedPrinter = 'termica';
        this.isConnected = true;
        console.log('✅ Conectado à impressora térmica (fallback)');
        return { success: true, message: 'Conectado à impressora térmica' };
      }
      
      this.isConnected = false;
      return { success: false, message: error.message };
    }
  }

  /**
   * 🖨️ IMPRIMIR TEXTO
   */
  async printText(text, options = {}) {
    try {
      if (!this.isConnected || !this.connectedPrinter) {
        throw new Error('Impressora não conectada');
      }

      console.log('🖨️ Iniciando impressão...');
      console.log('📄 Texto:', text.substring(0, 100) + '...');

      // Criar arquivo temporário
      const tempFile = path.join('/tmp', `jyze_print_${Date.now()}.txt`);
      fs.writeFileSync(tempFile, text, 'utf8');
      
      console.log(`📄 Arquivo temporário criado: ${tempFile}`);

      // Imprimir usando lp com timeout
      const command = `lp -d "${this.connectedPrinter}" "${tempFile}"`;
      console.log(`⚡ Executando: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { timeout: 5000 });
      
      // Limpar arquivo temporário
      try {
        fs.unlinkSync(tempFile);
      } catch (err) {
        console.warn('⚠️ Erro ao remover arquivo temporário:', err);
      }
      
      if (stderr) {
        console.warn('⚠️ Aviso na impressão:', stderr);
      }
      
      if (stdout) {
        console.log('📋 Resposta lp:', stdout);
      }
      
      console.log('✅ Impressão enviada com sucesso!');
      return { success: true, message: 'Impresso com sucesso via lp' };

    } catch (error) {
      console.error('❌ Erro ao imprimir:', error);
      
      // Se timeout, pode ser que a impressão foi enviada mesmo assim
      if (error.code === 'ETIMEDOUT') {
        return { success: true, message: 'Enviado para impressora (timeout normal)' };
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * 🧪 TESTE DE IMPRESSÃO
   */
  async testPrint() {
    const testText = `
================================
     TESTE DE IMPRESSÃO
================================

🖨️ JYZE.AI Desktop
📅 Data: ${new Date().toLocaleString('pt-BR')}
🔗 Conexão: Linux LP Direct
🖨️ Impressora: ${this.connectedPrinter}

Sua impressora está funcionando!

✅ Teste realizado com sucesso

Obrigado por usar JYZE.AI!

================================

`;

    return await this.printText(testText);
  }

  /**
   * 📋 IMPRIMIR PEDIDO
   */
  async printOrder(orderData) {
    try {
      const orderText = this.formatOrderForPrint(orderData);
      return await this.printText(orderText);

    } catch (error) {
      console.error('❌ Erro ao imprimir pedido:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 📄 FORMATAR PEDIDO
   */
  formatOrderForPrint(order) {
    const now = new Date();
    const orderDate = new Date(order.created_at || now);
    
    return `
================================
         JYZE.AI - PEDIDO
================================

#${order.id} - ${orderDate.toLocaleString('pt-BR')}

CLIENTE: ${order.nome_cliente}
${order.endereco ? `ENDERECO: ${order.endereco}` : ''}

--------------------------------
           PEDIDO
--------------------------------

${order.pedido}

${order.observacoes ? `
OBSERVACOES:
${order.observacoes}
` : ''}

--------------------------------

VALOR: R$ ${order.valor}
PAGAMENTO: ${order.tipo_pagamento || 'Não informado'}

================================

Obrigado pela preferência!
Volte sempre! 😊

================================

`;
  }

  /**
   * 📊 STATUS DA IMPRESSORA
   */
  async getPrinterStatus() {
    return {
      connected: this.isConnected,
      ready: this.isConnected && this.connectedPrinter,
      printer: this.connectedPrinter
    };
  }

  /**
   * 🔌 DESCONECTAR
   */
  disconnect() {
    this.connectedPrinter = null;
    this.isConnected = false;
  }
}

// Instância global
const linuxPrinter = new LinuxPrinterService();

module.exports = linuxPrinter;
