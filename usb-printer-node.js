/**
 * 🖨️ SERVIÇO DE IMPRESSÃO USB PARA NODE.JS PURO
 * 
 * Versão simplificada sem IPC do Electron
 */

// Configurar ESC/POS com USB adapter
let escpos, USB;

try {
  escpos = require('escpos');
  USB = require('escpos-usb');
  
  // Configurar adaptador USB para ESC/POS
  escpos.USB = USB;
  
  console.log('✅ ESC/POS e USB carregados com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar bibliotecas de impressão:', error);
  console.log('📦 Usando modo simulador...');
}

class USBThermalPrinter {
  constructor() {
    this.connectedPrinter = null;
    this.isConnected = false;
  }

  /**
   * 🔌 DETECTAR IMPRESSORAS USB
   */
  async detectUSBPrinters() {
    try {
      console.log('🔍 Detectando impressoras USB...');
      
      // SEMPRE usar simulador por enquanto para garantir que funciona
      console.log('🖨️ Usando simulador para garantir funcionamento...');
      return [{
        id: 'usb_simulator',
        name: 'Impressora Térmica Simulada',
        type: 'USB_SIMULATOR',
        vendorId: 0x0000,
        productId: 0x0000,
        manufacturer: 'Simulador JYZE.AI',
        status: 'available',
        isDefault: true,
        capabilities: ['thermal', 'escpos', 'cut', 'simulator']
      }];
      
      // TODO: Implementar detecção real quando as bibliotecas estiverem funcionando
      /*
      // Verificar se as bibliotecas estão carregadas
      if (!escpos || !USB) {
        console.log('⚠️ Bibliotecas ESC/POS não carregadas - retornando impressora simulada');
        return [{
          id: 'usb_simulator',
          name: 'Impressora USB Simulada',
          type: 'USB_SIMULATOR',
          vendorId: 0x0000,
          productId: 0x0000,
          manufacturer: 'Simulador JYZE.AI',
          status: 'available',
          isDefault: true,
          capabilities: ['thermal', 'escpos', 'cut', 'simulator']
        }];
      }
      
      // Detectar todas as impressoras USB ESC/POS
      const usbDevices = escpos.USB.findPrinter();
      */
      
      const printers = usbDevices.map((device, index) => ({
        id: `usb_${index}`,
        name: `Impressora USB ${index + 1}`,
        type: 'USB',
        vendorId: device.deviceDescriptor.idVendor,
        productId: device.deviceDescriptor.idProduct,
        manufacturer: device.deviceDescriptor.iManufacturer || 'Desconhecido',
        status: 'available',
        isDefault: index === 0,
        capabilities: ['thermal', 'escpos', 'cut']
      }));

      console.log(`📋 Encontradas ${printers.length} impressoras USB:`, printers);
      return printers;

    } catch (error) {
      console.error('❌ Erro ao detectar impressoras:', error);
      return [];
    }
  }

  /**
   * 🔗 CONECTAR À IMPRESSORA USB
   */
  async connectToPrinter(printerId) {
    try {
      console.log(`🔌 Conectando à impressora: ${printerId}`);
      
      // Se for simulador
      if (printerId === 'usb_simulator') {
        this.connectedPrinter = 'simulator';
        this.isConnected = true;
        console.log('✅ Conectado ao simulador de impressão!');
        return { success: true, message: 'Conectado ao simulador (teste)' };
      }
      
      // Verificar se as bibliotecas estão disponíveis
      if (!escpos || !USB) {
        throw new Error('Bibliotecas de impressão não carregadas');
      }
      
      // Encontrar dispositivo USB
      const usbDevices = escpos.USB.findPrinter();
      const deviceIndex = parseInt(printerId.replace('usb_', ''));
      const device = usbDevices[deviceIndex];
      
      if (!device) {
        throw new Error('Impressora USB não encontrada');
      }

      // Criar adapter USB
      const adapter = new USB(device);
      
      // Criar objeto ESC/POS
      this.connectedPrinter = new escpos.Printer(adapter);
      this.isConnected = true;
      
      console.log('✅ Conectado à impressora USB com sucesso!');
      return { success: true, message: 'Conectado com sucesso' };

    } catch (error) {
      console.error('❌ Erro ao conectar USB:', error);
      this.isConnected = false;
      return { success: false, message: error.message };
    }
  }

  /**
   * 🖨️ IMPRIMIR TEXTO FORMATADO
   */
  async printText(text, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Impressora não conectada');
      }

      console.log('🖨️ Iniciando impressão...');
      console.log('📄 Texto:', text.substring(0, 100) + '...');

      // Se for simulador, apenas fazer log
      if (this.connectedPrinter === 'simulator') {
        console.log('🖨️ === SIMULADOR DE IMPRESSÃO ===');
        console.log(text);
        console.log('🖨️ === FIM DO RECIBO ===');
        
        // Simular delay de impressão
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Impressão simulada concluída!');
        return { success: true, message: 'Impresso com sucesso (simulado)' };
      }

      // Impressão real com ESC/POS
      if (!this.connectedPrinter) {
        throw new Error('Impressora não configurada');
      }

      return new Promise((resolve, reject) => {
        this.connectedPrinter
          .font('a')
          .align('lt')
          .style('normal')
          .size(0, 0)
          .text(text)
          .text('\n\n\n') // Espaço para corte
          .cut()
          .close((error) => {
            if (error) {
              console.error('❌ Erro na impressão:', error);
              reject(error);
            } else {
              console.log('✅ Impressão concluída com sucesso!');
              resolve({ success: true, message: 'Impresso com sucesso' });
            }
          });
      });

    } catch (error) {
      console.error('❌ Erro ao imprimir:', error);
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
🔗 Conexão: USB Direta
📏 Largura: 58mm

Sua impressora térmica está 
funcionando perfeitamente!

✅ Teste realizado com sucesso

Obrigado por usar JYZE.AI!

================================
`;

    return await this.printText(testText);
  }

  /**
   * 📋 IMPRIMIR PEDIDO FORMATADO
   */
  async printOrder(orderData) {
    try {
      // Gerar texto formatado do pedido
      const orderText = this.formatOrderForThermalPrint(orderData);
      
      // Imprimir
      return await this.printText(orderText);

    } catch (error) {
      console.error('❌ Erro ao imprimir pedido:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 📄 FORMATAR PEDIDO PARA IMPRESSÃO TÉRMICA
   */
  formatOrderForThermalPrint(order) {
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
      ready: this.isConnected && this.connectedPrinter
    };
  }

  /**
   * 🔌 DESCONECTAR
   */
  disconnect() {
    if (this.connectedPrinter && this.connectedPrinter !== 'simulator') {
      try {
        this.connectedPrinter.close();
      } catch (error) {
        console.error('Erro ao desconectar:', error);
      }
    }
    this.connectedPrinter = null;
    this.isConnected = false;
  }
}

// Instância global
const usbPrinter = new USBThermalPrinter();

module.exports = usbPrinter;
