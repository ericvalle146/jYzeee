class LocalPrinterHandler {
  constructor() {
    this.isSupported = 'serial' in navigator || 'usb' in navigator;
    this.printer = null;
    this.isConnected = false;
  }

  // Detecta impressoras USB/Serial disponíveis
  async detectPrinters() {
    try {
      console.log('🔍 Procurando impressoras...');
      
      // Tenta USB primeiro
      if ('usb' in navigator) {
        const devices = await navigator.usb.getDevices();
        const printers = devices.filter(device => 
          device.vendorId === 0x04b8 || // Epson
          device.vendorId === 0x0483 || // STMicroelectronics (comum em térmicas)
          device.productName?.toLowerCase().includes('printer')
        );
        
        if (printers.length > 0) {
          return {
            success: true,
            method: 'usb',
            printers: printers.map(p => ({
              name: p.productName || 'Impressora USB',
              vendor: p.manufacturerName || 'Desconhecido',
              id: p.serialNumber || 'N/A'
            }))
          };
        }
      }

      // Fallback: Impressão via Web Print API
      return {
        success: true,
        method: 'web-api',
        printers: [{
          name: 'Impressora Padrão do Sistema',
          vendor: 'Sistema',
          id: 'default'
        }]
      };

    } catch (error) {
      console.error('❌ Erro na detecção:', error);
      return {
        success: false,
        error: error.message,
        method: 'none'
      };
    }
  }

  // Conecta com impressora USB
  async connectUSBPrinter() {
    try {
      if (!('usb' in navigator)) {
        throw new Error('USB não suportado neste navegador');
      }

      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0483 }, // STMicroelectronics
        ]
      });

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      this.printer = device;
      this.isConnected = true;

      console.log('✅ Impressora USB conectada:', device.productName);
      return { success: true, device: device.productName };

    } catch (error) {
      console.error('❌ Erro conexão USB:', error);
      return { success: false, error: error.message };
    }
  }

  // Gera comandos ESC/POS para recibo térmico
  generateESCPOS(orderData) {
    const ESC = '\x1B';
    const INIT = ESC + '@';
    const BOLD_ON = ESC + 'E\x01';
    const BOLD_OFF = ESC + 'E\x00';
    const CENTER = ESC + 'a\x01';
    const LEFT = ESC + 'a\x00';
    const CUT = ESC + 'd\x03' + ESC + 'i';
    
    let receipt = INIT;
    
    // Cabeçalho
    receipt += CENTER + BOLD_ON;
    receipt += '================================\n';
    receipt += '        JYZE DELIVERY\n';
    receipt += '================================\n';
    receipt += BOLD_OFF + LEFT;
    
    // Dados do pedido
    receipt += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
    receipt += `Pedido: #${orderData.id || 'N/A'}\n`;
    receipt += `Cliente: ${orderData.nome_cliente || 'N/A'}\n`;
    receipt += '--------------------------------\n';
    
    // Itens
    receipt += BOLD_ON + 'PEDIDO:\n' + BOLD_OFF;
    receipt += `${orderData.pedido || 'Sem detalhes'}\n`;
    
    if (orderData.observações) {
      receipt += '\nOBSERVAÇÕES:\n';
      receipt += `${orderData.observações}\n`;
    }
    
    receipt += '--------------------------------\n';
    
    // Endereço
    if (orderData.endereço) {
      receipt += BOLD_ON + 'ENDEREÇO:\n' + BOLD_OFF;
      receipt += `${orderData.endereço}\n`;
      receipt += '--------------------------------\n';
    }
    
    // Total
    receipt += CENTER + BOLD_ON;
    receipt += `TOTAL: R$ ${(orderData.valor || 0).toFixed(2)}\n`;
    receipt += `PAGAMENTO: ${orderData.tipo_pagamento || 'N/A'}\n`;
    receipt += BOLD_OFF + LEFT;
    
    // Rodapé
    receipt += '================================\n';
    receipt += CENTER;
    receipt += 'Obrigado pela preferência!\n';
    receipt += 'JYZE.AI - Delivery Inteligente\n';
    receipt += '================================\n';
    receipt += CUT;
    
    return new TextEncoder().encode(receipt);
  }

  // Imprime via USB (ESC/POS)
  async printViaUSB(orderData) {
    try {
      if (!this.isConnected || !this.printer) {
        const connection = await this.connectUSBPrinter();
        if (!connection.success) {
          throw new Error('Falha na conexão USB');
        }
      }

      const escpos = this.generateESCPOS(orderData);
      
      // Envia dados para impressora
      await this.printer.transferOut(1, escpos);
      
      console.log('✅ Impressão USB realizada');
      return { success: true, method: 'usb' };

    } catch (error) {
      console.error('❌ Erro impressão USB:', error);
      return { success: false, error: error.message };
    }
  }

  // Imprime via Web Print API (fallback)
  async printViaWebAPI(orderData) {
    try {
      const printContent = this.generateHTMLReceipt(orderData);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguarda carregar e imprime
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      };
      
      console.log('✅ Impressão via navegador iniciada');
      return { success: true, method: 'web-api' };

    } catch (error) {
      console.error('❌ Erro impressão web:', error);
      return { success: false, error: error.message };
    }
  }

  // Gera HTML para impressão via navegador
  generateHTMLReceipt(orderData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo - Pedido #${orderData.id}</title>
      <style>
        @media print {
          body { margin: 0; padding: 10px; font-family: monospace; font-size: 12px; }
          .no-print { display: none; }
        }
        body { width: 80mm; font-family: monospace; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="center bold">
        ================================<br>
        JYZE DELIVERY<br>
        ================================
      </div>
      
      <div class="line"></div>
      
      Data: ${new Date().toLocaleString('pt-BR')}<br>
      Pedido: #${orderData.id || 'N/A'}<br>
      Cliente: ${orderData.nome_cliente || 'N/A'}<br>
      
      <div class="line"></div>
      
      <div class="bold">PEDIDO:</div>
      ${orderData.pedido || 'Sem detalhes'}<br>
      
      ${orderData.observações ? `
      <br><div class="bold">OBSERVAÇÕES:</div>
      ${orderData.observações}<br>
      ` : ''}
      
      <div class="line"></div>
      
      ${orderData.endereço ? `
      <div class="bold">ENDEREÇO:</div>
      ${orderData.endereço}<br>
      <div class="line"></div>
      ` : ''}
      
      <div class="center bold">
        TOTAL: R$ ${(orderData.valor || 0).toFixed(2)}<br>
        PAGAMENTO: ${orderData.tipo_pagamento || 'N/A'}
      </div>
      
      <div class="line"></div>
      
      <div class="center">
        Obrigado pela preferência!<br>
        JYZE.AI - Delivery Inteligente
      </div>
      
      <div class="line"></div>
    </body>
    </html>
    `;
  }

  // Método principal para impressão
  async printOrder(orderData) {
    try {
      console.log('🖨️ Iniciando impressão do pedido:', orderData.id);
      
      // Tenta USB primeiro
      if (this.isSupported && 'usb' in navigator) {
        const usbResult = await this.printViaUSB(orderData);
        if (usbResult.success) {
          return usbResult;
        }
        console.warn('⚠️ USB falhou, tentando web API...');
      }
      
      // Fallback para Web API
      return await this.printViaWebAPI(orderData);
      
    } catch (error) {
      console.error('❌ Erro geral na impressão:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: 'Tente usar a função de impressão do navegador'
      };
    }
  }

  // Teste de impressão
  async testPrint() {
    const testOrder = {
      id: 'TEST-' + Date.now(),
      nome_cliente: 'Cliente Teste',
      pedido: '1x Pizza Margherita G + 1x Coca Cola 2L',
      observações: 'Teste de impressão - Sistema JYZE',
      valor: 45.90,
      tipo_pagamento: 'PIX',
      endereço: 'Endereço de teste, 123 - Centro - São Paulo'
    };

    return this.printOrder(testOrder);
  }
}

// Instância global
window.LocalPrinter = new LocalPrinterHandler();

// Exporta para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalPrinterHandler;
}
