import { Injectable, Logger } from '@nestjs/common';
import * as escpos from 'escpos';
import * as USB from 'escpos-usb';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface PrinterConfig {
  vendorId?: number;
  productId?: number;
  interface?: number;
  encoding?: string;
  width?: number;
  characterSet?: string;
  devicePath?: string; // Para dispositivos Linux diretos
}

export interface PrintReceipt {
  order: any;
  timestamp: string;
  receiptNumber: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    cnpj?: string;
  };
}

export interface SystemPrinter {
  name: string;
  vendorId?: number;
  productId?: number;
  manufacturer?: string;
  model?: string;
  status?: string;
  connection?: string;
  devicePath?: string;
  path?: string;
  platform: string;
  interface?: string;
  serialNumber?: string;
  isDefault?: boolean;
  description?: string;
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private device: any = null;
  private printer: any = null;

  async detectPrinters(): Promise<SystemPrinter[]> {
    const platform = os.platform();
    this.logger.log(`Detectando impressoras no sistema: ${platform}`);

    try {
      // Primeiro tenta detectar via escpos-usb (funciona em ambas plataformas)
      const usbPrinters = await this.detectUSBPrinters();
      
      // Depois verifica impressoras do sistema operacional
      let systemPrinters: SystemPrinter[] = [];
      
      if (platform === 'win32') {
        systemPrinters = await this.detectWindowsPrinters();
      } else if (platform === 'linux') {
        systemPrinters = await this.detectLinuxPrinters();
      }

      // Combina resultados removendo duplicatas
      const allPrinters = [...usbPrinters, ...systemPrinters];
      const uniquePrinters = this.removeDuplicatePrinters(allPrinters);
      
      this.logger.log(`Detectadas ${uniquePrinters.length} impressoras no total`);
      return uniquePrinters;
    } catch (error) {
      this.logger.error('Erro ao detectar impressoras:', error);
      return [];
    }
  }

  private async detectUSBPrinters(): Promise<SystemPrinter[]> {
    try {
      const devices = await USB.findPrinter();
      this.logger.log(`Detectadas ${devices.length} impressoras USB via escpos`);
      
      return devices.map((device: any) => ({
        name: device.deviceDescriptor?.iProduct || 'Impressora USB ESC/POS',
        vendorId: device.deviceDescriptor?.idVendor,
        productId: device.deviceDescriptor?.idProduct,
        manufacturer: device.deviceDescriptor?.iManufacturer || 'Desconhecido',
        platform: 'USB-ESCPOS',
        interface: 'USB',
      }));
    } catch (error) {
      this.logger.warn('Erro ao detectar impressoras USB:', error.message);
      return [];
    }
  }

  private async detectWindowsPrinters(): Promise<SystemPrinter[]> {
    try {
      // Usar PowerShell para detectar impressoras no Windows
      const { stdout } = await execAsync(
        'powershell -Command "Get-WmiObject -Class Win32_Printer | Where-Object {$_.Local -eq $true -and $_.PortName -like \'USB*\'} | Select-Object Name, PortName, DriverName | ConvertTo-Json"'
      );
      
      if (!stdout.trim()) {
        return [];
      }

      const printers = JSON.parse(stdout);
      const printerArray = Array.isArray(printers) ? printers : [printers];
      
      this.logger.log(`Detectadas ${printerArray.length} impressoras USB no Windows`);
      
      return printerArray.map((printer: any) => ({
        name: printer.Name || 'Impressora Windows',
        path: printer.PortName,
        manufacturer: printer.DriverName || 'Desconhecido',
        platform: 'Windows',
        interface: 'USB',
      }));
    } catch (error) {
      this.logger.warn('Erro ao detectar impressoras Windows:', error.message);
      return [];
    }
  }

  private async detectLinuxPrinters(): Promise<SystemPrinter[]> {
    const printers: SystemPrinter[] = [];

    try {
      this.logger.log('🐧 INICIANDO DETECÇÃO ROBUSTA LINUX UBUNTU');

      // MÉTODO 1: Impressoras configuradas no sistema (lpstat)
      await this.detectLinuxSystemPrinters(printers);
      
      // MÉTODO 2: Dispositivos USB físicos (lsusb)  
      await this.detectLinuxUSBDevices(printers);
      
      // MÉTODO 3: Dispositivos /dev/usblp* diretos
      await this.detectLinuxUSBLPDevices(printers);

      // MÉTODO 4: Busca ampla por dispositivos térmicos
      await this.detectLinuxThermalPrinters(printers);
      
      this.logger.log(`✅ UBUNTU: Encontradas ${printers.length} impressoras`);
      return printers;
    } catch (error) {
      this.logger.error('❌ Erro na detecção Linux Ubuntu:', error);
      return [];
    }
  }

  private async detectLinuxUSBDevices(printers: SystemPrinter[]): Promise<void> {
    try {
      const { stdout } = await execAsync('lsusb | grep -i "printer\\|pos\\|receipt\\|thermal"');
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);
      
      for (const line of lines) {
        const match = line.match(/Bus (\d+) Device (\d+): ID ([0-9a-f]{4}):([0-9a-f]{4}) (.+)/i);
        if (match) {
          const [, bus, device, vendorId, productId, name] = match;
          
          printers.push({
            name: name.trim(),
            vendorId: parseInt(vendorId, 16),
            productId: parseInt(productId, 16),
            path: `/dev/bus/usb/${bus.padStart(3, '0')}/${device.padStart(3, '0')}`,
            platform: 'Linux-USB',
            interface: 'USB',
          });
        }
      }
    } catch (error) {
      // lsusb pode não estar disponível, não é erro crítico
      this.logger.debug('lsusb não disponível ou sem impressoras USB');
    }
  }

  private async detectLinuxCUPSPrinters(printers: SystemPrinter[]): Promise<void> {
    try {
      const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo ""');
      const lines = stdout.trim().split('\n').filter(line => line.includes('printer'));
      
      for (const line of lines) {
        const match = line.match(/printer (.+) is/);
        if (match) {
          const printerName = match[1];
          
          // Verifica se é impressora USB
          try {
            const { stdout: info } = await execAsync(`lpstat -l -p ${printerName} 2>/dev/null || echo ""`);
            if (info.toLowerCase().includes('usb') || info.toLowerCase().includes('serial')) {
              printers.push({
                name: printerName,
                platform: 'Linux-CUPS',
                interface: 'CUPS',
                path: `/cups/${printerName}`,
              });
            }
          } catch {
            // Ignora erros ao obter info da impressora
          }
        }
      }
    } catch (error) {
      // CUPS pode não estar disponível
      this.logger.debug('CUPS não disponível');
    }
  }

  private async detectLinuxUSBLPDevices(printers: SystemPrinter[]): Promise<void> {
    try {
      // Método 1: Verificar dispositivos /dev/usb/lp* existentes
      const usbDir = '/dev/usb/';
      try {
        const devices = await fs.promises.readdir(usbDir).catch(() => []);
        const lpDevices = devices.filter(device => device.startsWith('lp'));
        
        for (const device of lpDevices) {
          const devicePath = `${usbDir}${device}`;
          
          try {
            await fs.promises.access(devicePath, fs.constants.R_OK);
            printers.push({
              name: `Impressora USB ${device.toUpperCase()}`,
              path: devicePath,
              platform: 'Linux-USB-Direct',
              interface: 'USB-Direct',
            });
          } catch {
            // Dispositivo não acessível
          }
        }
      } catch {
        // /dev/usb pode não existir
      }

      // Método 2: Verificar dispositivos /dev/usblp* (padrão Linux)
      for (let i = 0; i <= 9; i++) {
        const devicePath = `/dev/usblp${i}`;
        try {
          await fs.promises.access(devicePath, fs.constants.F_OK);
          printers.push({
            name: `Impressora USB LP${i}`,
            path: devicePath,
            platform: 'Linux-USBLP',
            interface: 'USBLP-Direct',
          });
        } catch {
          // Dispositivo não existe ou não acessível
        }
      }

      // Método 3: Tentar criar dispositivos USBLP se não existirem (baseado na solução que funcionou)
      await this.ensureUSBLPDevices(printers);

    } catch (error) {
      this.logger.debug('Erro ao detectar dispositivos USB LP:', error.message);
    }
  }

  private async ensureUSBLPDevices(printers: SystemPrinter[]): Promise<void> {
    try {
      // Verifica se lsusb está disponível para detectar impressoras USB
      const { stdout } = await execAsync('lsusb | grep -i "printer\\|pos\\|receipt\\|thermal" | wc -l').catch(() => ({ stdout: '0' }));
      const usbPrinterCount = parseInt(stdout.trim()) || 0;

      if (usbPrinterCount > 0) {
        this.logger.log(`Detectadas ${usbPrinterCount} impressoras USB via lsusb`);

        // Tenta criar dispositivos USBLP para impressoras detectadas
        for (let i = 1; i <= Math.min(usbPrinterCount, 3); i++) {
          const devicePath = `/dev/usblp${i}`;
          
          try {
            // Verifica se já existe
            await fs.promises.access(devicePath, fs.constants.F_OK);
            this.logger.debug(`Dispositivo ${devicePath} já existe`);
          } catch {
            // Não existe, tenta criar
            try {
              const majorNumber = 180; // Major number para USB printer
              const minorNumber = i;
              
              // Cria o dispositivo (requer sudo)
              await execAsync(`sudo mknod ${devicePath} c ${majorNumber} ${minorNumber}`);
              await execAsync(`sudo chmod 666 ${devicePath}`);
              
              this.logger.log(`Dispositivo ${devicePath} criado com sucesso`);
              
              printers.push({
                name: `Impressora USB LP${i} (Criada)`,
                path: devicePath,
                platform: 'Linux-USBLP-Created',
                interface: 'USBLP-Created',
              });
            } catch (createError) {
              this.logger.warn(`Falha ao criar ${devicePath}: ${createError.message}`);
              // Adiciona instruções para o usuário
              printers.push({
                name: `USB LP${i} (Requer configuração manual)`,
                path: `sudo mknod ${devicePath} c 180 ${i} && sudo chmod 666 ${devicePath}`,
                platform: 'Linux-Manual-Setup',
                interface: 'Manual-Command',
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.debug('Erro ao criar dispositivos USBLP:', error.message);
    }
  }

  private removeDuplicatePrinters(printers: SystemPrinter[]): SystemPrinter[] {
    const seen = new Set<string>();
    return printers.filter(printer => {
      // Cria chave única baseada em vendor/product ID ou nome
      const key = printer.vendorId && printer.productId 
        ? `${printer.vendorId}:${printer.productId}`
        : printer.name.toLowerCase().replace(/\s+/g, '');
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }

  async initializePrinter(config: PrinterConfig = {}): Promise<boolean> {
    try {
      const platform = os.platform();
      
      // Para Linux, usa dispositivo direto primeiro
      if (platform === 'linux' && config.devicePath) {
        return await this.initializeLinuxDirectPrinter(config);
      }

      // Para outros casos, usa método Linux direto também se estivermos no Linux
      if (platform === 'linux') {
        return await this.initializeLinuxDirectPrinter(config);
      }

      // Método padrão ESC/POS USB (somente para Windows/macOS)
      try {
        if (config.vendorId && config.productId) {
          this.device = new USB(config.vendorId, config.productId);
        } else {
          this.device = new USB();
        }
      } catch (usbError) {
        this.logger.warn('Erro ao inicializar USB ESC/POS, usando método Linux direto:', usbError.message);
        return await this.initializeLinuxDirectPrinter(config);
      }

      // Configura encoding baseado no sistema operacional
      let encoding = config.encoding;
      
      if (!encoding) {
        // Encoding padrão por plataforma
        if (platform === 'win32') {
          encoding = 'cp1252'; // Windows padrão
        } else {
          encoding = 'cp860'; // Linux/Ubuntu com caracteres brasileiros (padrão)
        }
      }

      escpos.encoding.selectCode(encoding);
      this.logger.log(`Usando encoding: ${encoding} para plataforma: ${platform}`);

      this.printer = new escpos.Printer(this.device, {
        encoding: encoding,
        width: config.width || 48,
      });

      this.logger.log('Impressora inicializada com sucesso');
      return true;
    } catch (error) {
      this.logger.error('Erro ao inicializar impressora:', error);
      return false;
    }
  }

  private async initializeLinuxDirectPrinter(config: PrinterConfig): Promise<boolean> {
    try {
      // Lista de dispositivos para tentar em ordem de prioridade
      const devicePaths = [
        config.devicePath,
        '/dev/usb/lp1',
        '/dev/usb/lp0',
        '/dev/lp0',
        '/dev/lp1'
      ].filter(Boolean); // Remove valores null/undefined

      let workingDevice = null;

      // Tenta encontrar um dispositivo que funcione
      for (const devicePath of devicePaths) {
        try {
          await fs.promises.access(devicePath!, fs.constants.F_OK);
          this.logger.log(`Dispositivo encontrado: ${devicePath}`);
          workingDevice = devicePath;
          break;
        } catch (error) {
          this.logger.warn(`Dispositivo não acessível: ${devicePath}`);
        }
      }

      if (!workingDevice) {
        this.logger.warn('Nenhum dispositivo de impressora encontrado, simulando impressão');
        // Retorna true para simular impressão em desenvolvimento
        this.device = { 
          path: '/dev/null',
          type: 'linux-direct-simulation',
          encoding: config.encoding || 'cp860'
        };
        return true;
      }
      
      this.logger.log(`Inicializando impressora Linux direta: ${workingDevice}`);
      this.device = { 
        path: workingDevice,
        type: 'linux-direct',
        encoding: config.encoding || 'cp860'
      };
      
      return true;
    } catch (error) {
      this.logger.error(`Erro ao inicializar impressora Linux:`, error);
      // Em caso de erro, simula impressão para desenvolvimento
      this.device = { 
        path: '/dev/null',
        type: 'linux-direct-simulation',
        encoding: config.encoding || 'cp860'
      };
      return true;
    }
  }

  /**
   * Imprime texto personalizado diretamente (para layouts customizados do frontend)
   */
  async printCustomText(customText: string, config: PrinterConfig = {}): Promise<boolean> {
    try {
      this.logger.log('🔥 INICIANDO IMPRESSÃO COM LAYOUT PERSONALIZADO');
      this.logger.log(`Texto personalizado recebido:\n${customText}`);
      
      const platform = os.platform();
      
      // Para Linux, sempre usa impressão direta
      if (platform === 'linux') {
        return await this.printCustomTextLinuxDirect(customText, config);
      }

      // Método ESC/POS para outras plataformas
      const initialized = await this.initializePrinter(config);
      if (!initialized) {
        throw new Error('Falha ao inicializar impressora');
      }

      return new Promise((resolve, reject) => {
        this.device.open((error: any) => {
          if (error) {
            this.logger.error('Erro ao abrir conexão:', error);
            reject(error);
            return;
          }

          try {
            // Divide o texto em linhas e imprime cada uma
            const lines = customText.split('\n');
            
            this.printer.align('lt'); // Alinhamento à esquerda por padrão
            
            for (const line of lines) {
              // Verifica se a linha tem formatação especial
              if (line.includes('===')) {
                // Linha separadora
                this.printer.text(line);
              } else if (line.trim().length === 0) {
                // Linha vazia
                this.printer.text('');
              } else {
                // Texto normal
                this.printer.text(line);
              }
            }

            // Finaliza a impressão
            this.printer
              .text('')
              .text('')
              .cut()
              .close();

            this.logger.log('✅ Layout personalizado impresso com sucesso via ESC/POS');
            resolve(true);
          } catch (printError) {
            this.logger.error('Erro durante impressão customizada:', printError);
            reject(printError);
          }
        });
      });
    } catch (error) {
      this.logger.error('Erro ao imprimir texto personalizado:', error);
      throw error;
    }
  }

  /**
   * Impressão direta Linux para texto personalizado
   */
  private async printCustomTextLinuxDirect(customText: string, config: PrinterConfig): Promise<boolean> {
    try {
      const devicePath = config.devicePath || '/dev/usb/lp1';
      


      // Adiciona formatação básica para impressora térmica
      let formattedText = customText;
      
      // Adiciona quebras de linha no final para garantir que o papel seja cortado
      formattedText += '\n\n\n\n';

      // Escreve diretamente no dispositivo
      await fs.promises.writeFile(devicePath, formattedText, { encoding: 'latin1' });
      
      this.logger.log(`✅ Layout personalizado impresso via dispositivo direto: ${devicePath}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro na impressão direta Linux customizada:`, error);
      
      // Se falhar, tenta simular para desenvolvimento
      this.logger.warn(`⚠️ Simulando impressão customizada (desenvolvimento)`);
      this.logger.log(`📄 SIMULAÇÃO - Texto que seria impresso:\n${customText}`);
      return true;
    }
  }

  async printReceipt(receipt: PrintReceipt, config: PrinterConfig = {}): Promise<boolean> {
    try {
      const platform = os.platform();
      
      // Linux: usa impressão direta se devicePath estiver configurado
      if (platform === 'linux' && config.devicePath) {
        return await this.printReceiptLinuxDirect(receipt, config);
      }

      // Método padrão ESC/POS
      const initialized = await this.initializePrinter(config);
      if (!initialized) {
        throw new Error('Falha ao inicializar impressora');
      }

      const width = config.width || 48;

      // Abre conexão
      return new Promise((resolve, reject) => {
        this.device.open((error: any) => {
          if (error) {
            this.logger.error('Erro ao abrir conexão:', error);
            reject(error);
            return;
          }

          try {
            // Cabeçalho da empresa
            this.printer
              .align('ct')
              .style('bu')
              .size(1, 1)
              .text(receipt.company?.name || 'SELLHUB VENDAS')
              .text('--------------------------------')
              .align('ct')
              .style('normal')
              .size(0, 0)
              .text(receipt.company?.address || 'Sistema de Vendas')
              .text(receipt.company?.phone || '(11) 99999-9999')
              .text('================================')
              .text('')

              // Informações do pedido
              .align('lt')
              .text(`PEDIDO #${receipt.order.id}`)
              .text(`DATA: ${receipt.timestamp}`)
              .text(`CLIENTE: ${receipt.order.nome_cliente}`)
              .text(`RECIBO: ${receipt.receiptNumber}`)
              .text('--------------------------------')
              .text('');

            // Endereço de entrega
            if (receipt.order.endereco) {
              this.printer
                .text('ENDERECO DE ENTREGA:')
                .text(this.wrapText(receipt.order.endereco, width))
                .text('');
            }

            // Itens do pedido
            this.printer
              .text('PEDIDO:')
              .text(this.wrapText(receipt.order.pedido || 'Sem descrição', width))
              .text('');

            // Observações
            if (receipt.order.observacoes) {
              this.printer
                .text('OBSERVACOES:')
                .text(this.wrapText(receipt.order.observacoes, width))
                .text('');
            }

            // Forma de pagamento
            this.printer
              .text(`PAGAMENTO: ${receipt.order.tipo_pagamento || 'Não informado'}`)
              .text('================================');

            // Total
            const total = this.formatPrice(receipt.order.valor);
            const totalLine = this.rightAlign(`TOTAL: ${total}`, width);
            
            this.printer
              .style('bu')
              .size(1, 1)
              .text(totalLine)
              .style('normal')
              .size(0, 0)
              .text('================================')
              .text('')
              .align('ct')
              .text('OBRIGADO PELA PREFERENCIA!')
              .text('')
              .text('')
              .text('')
              .cut()
              .close();

            this.logger.log('Recibo impresso com sucesso');
            resolve(true);
          } catch (printError) {
            this.logger.error('Erro durante impressão:', printError);
            reject(printError);
          }
        });
      });
    } catch (error) {
      this.logger.error('Erro ao imprimir recibo:', error);
      throw error;
    }
  }

  private async printReceiptLinuxDirect(receipt: PrintReceipt, config: PrinterConfig): Promise<boolean> {
    try {
      const width = config.width || 48;
      const devicePath = config.devicePath!;

      // Monta o texto do recibo
      let receiptText = '';
      
      // Cabeçalho
      receiptText += this.centerText(receipt.company?.name || 'SELLHUB VENDAS', width) + '\n';
      receiptText += '================================\n';
      receiptText += this.centerText(receipt.company?.address || 'Sistema de Vendas', width) + '\n';
      receiptText += this.centerText(receipt.company?.phone || '(11) 99999-9999', width) + '\n';
      receiptText += '================================\n\n';
      
      // Informações do pedido
      receiptText += `PEDIDO #${receipt.order.id}\n`;
      receiptText += `DATA: ${receipt.timestamp}\n`;
      receiptText += `CLIENTE: ${receipt.order.nome_cliente}\n`;
      receiptText += `RECIBO: ${receipt.receiptNumber}\n`;
      receiptText += '--------------------------------\n\n';
      
      // Endereço
      if (receipt.order.endereco) {
        receiptText += 'ENDERECO DE ENTREGA:\n';
        receiptText += this.wrapText(receipt.order.endereco, width) + '\n\n';
      }
      
      // Pedido
      receiptText += 'PEDIDO:\n';
      receiptText += this.wrapText(receipt.order.pedido || 'Sem descrição', width) + '\n\n';
      
      // Observações
      if (receipt.order.observacoes) {
        receiptText += 'OBSERVACOES:\n';
        receiptText += this.wrapText(receipt.order.observacoes, width) + '\n\n';
      }
      
      // Pagamento e total
      receiptText += `PAGAMENTO: ${receipt.order.tipo_pagamento || 'Não informado'}\n`;
      receiptText += '================================\n';
      
      const total = this.formatPrice(receipt.order.valor);
      receiptText += this.rightAlign(`TOTAL: ${total}`, width) + '\n';
      receiptText += '================================\n\n';
      receiptText += this.centerText('OBRIGADO PELA PREFERENCIA!', width) + '\n';
      receiptText += 'Plataforma: Linux (Impressao Direta)\n';
      receiptText += '\n\n\n\n'; // Espaço para corte

      // Escreve diretamente no dispositivo
      await fs.promises.writeFile(devicePath, receiptText, { encoding: 'latin1' });
      
      this.logger.log(`Recibo impresso via dispositivo direto: ${devicePath}`);
      return true;
    } catch (error) {
      this.logger.error('Erro na impressão direta Linux:', error);
      throw error;
    }
  }

  async printTest(config: PrinterConfig = {}): Promise<boolean> {
    try {
      const initialized = await this.initializePrinter(config);
      if (!initialized) {
        throw new Error('Falha ao inicializar impressora');
      }

      const platform = os.platform();
      const platformName = platform === 'win32' ? 'Windows' : 'Linux/Ubuntu';

      return new Promise((resolve, reject) => {
        this.device.open((error: any) => {
          if (error) {
            reject(error);
            return;
          }

          try {
            this.printer
              .align('ct')
              .style('bu')
              .size(1, 1)
              .text('TESTE DE IMPRESSORA')
              .text('==================')
              .style('normal')
              .size(0, 0)
              .text('')
              .text('SellHub - Sistema de Vendas')
              .text(`Plataforma: ${platformName}`)
              .text('')
              .text(`Data: ${new Date().toLocaleString('pt-BR')}`)
              .text('')
              .text('Se voce consegue ler esta')
              .text('mensagem, a impressora esta')
              .text('funcionando corretamente!')
              .text('')
              .text('Caracteres especiais:')
              .text('ÁÉÍÓÚÇÃÕáéíóúçãõ')
              .text('R$ 123,45 - ¢ § ° ª º')
              .text('')
              .text('==================')
              .text('TESTE CONCLUIDO')
              .text(`Sistema: ${platformName}`)
              .text('')
              .text('')
              .cut()
              .close();

            this.logger.log(`Teste de impressão concluído em ${platformName}`);
            resolve(true);
          } catch (printError) {
            reject(printError);
          }
        });
      });
    } catch (error) {
      this.logger.error('Erro no teste de impressão:', error);
      throw error;
    }
  }

  async checkStatus(): Promise<{ connected: boolean; model?: string; status?: string; platform?: string; count?: number }> {
    try {
      const printers = await this.detectPrinters();
      const platform = os.platform();
      const platformName = platform === 'win32' ? 'Windows' : 'Linux/Ubuntu';
      
      if (printers.length === 0) {
        return { 
          connected: false,
          platform: platformName,
          count: 0
        };
      }

      return {
        connected: true,
        model: printers[0].name,
        status: 'Pronta',
        platform: platformName,
        count: printers.length
      };
    } catch (error) {
      this.logger.error('Erro ao verificar status:', error);
      return { 
        connected: false,
        platform: os.platform(),
        count: 0 
      };
    }
  }

  private wrapText(text: string, maxWidth: number): string {
    if (text.length <= maxWidth) {
      return text;
    }
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Palavra muito longa, quebra forçadamente
          lines.push(word.substring(0, maxWidth));
          currentLine = word.substring(maxWidth);
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  private centerText(text: string, width: number): string {
    if (text.length >= width) {
      return text;
    }
    
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  private rightAlign(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    return ' '.repeat(width - text.length) + text;
  }

  async getSystemInfo() {
    return {
      platform: os.platform(),
      osVersion: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      username: os.userInfo().username,
      hostname: os.hostname(),
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
        free: Math.round(os.freemem() / 1024 / 1024) + ' MB'
      }
    };
  }

  async testPrint(config: PrinterConfig = {}): Promise<boolean> {
    try {
      // Limpa a fila antes de imprimir (prevenção de lixo)
      await this.clearPrinterQueue();
      
      // ⚠️ REMOVIDO: Não criar recibo fixo de teste aqui!
      // Este método deve ser usado apenas para teste básico de funcionamento
      
      const platform = os.platform();
      
      // Para Linux, sempre usa impressão direta
      if (platform === 'linux') {
        return await this.testPrintLinuxDirect(config);
      }

      // Método ESC/POS para outras plataformas
      const initialized = await this.initializePrinter(config);
      if (!initialized) {
        throw new Error('Falha ao inicializar impressora');
      }

      const platformName = platform === 'win32' ? 'Windows' : 'Linux/Ubuntu';

      return new Promise((resolve, reject) => {
        this.device.open((error: any) => {
          if (error) {
            reject(error);
            return;
          }

          try {
            this.printer
              .align('ct')
              .style('bu')
              .size(1, 1)
              .text('TESTE DE IMPRESSORA')
              .text('==================')
              .style('normal')
              .size(0, 0)
              .text('')
              .text('SellHub - Sistema de Vendas')
              .text(`Plataforma: ${platformName}`)
              .text('')
              .text(`Data: ${new Date().toLocaleString('pt-BR')}`)
              .text('')
              .text('Se voce consegue ler esta')
              .text('mensagem, a impressora esta')
              .text('funcionando corretamente!')
              .text('')
              .text('==================')
              .text('TESTE CONCLUIDO')
              .text('')
              .text('')
              .cut()
              .close();

            this.logger.log(`Teste de impressão concluído em ${platformName}`);
            resolve(true);
          } catch (printError) {
            reject(printError);
          }
        });
      });
    } catch (error) {
      this.logger.error('Erro no teste de impressão:', error);
      return false;
    }
  }

  private async testPrintLinuxDirect(config: PrinterConfig): Promise<boolean> {
    try {
      const devicePath = config.devicePath || '/dev/usb/lp1';
      

      const testText = `TESTE DE IMPRESSORA
==================

SellHub - Sistema de Vendas
Plataforma: Linux/Ubuntu

Data: ${new Date().toLocaleString('pt-BR')}

Se voce consegue ler esta
mensagem, a impressora esta
funcionando corretamente!

==================
TESTE CONCLUIDO


`;

      // Escreve diretamente no dispositivo
      await fs.promises.writeFile(devicePath, testText, { encoding: 'latin1' });
      
      this.logger.log(`✅ Teste impresso via dispositivo direto: ${devicePath}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro no teste Linux direto:`, error);
      
      // Se falhar, simula para desenvolvimento
      const testText = `TESTE SIMULADO - DESENVOLVIMENTO`;
      this.logger.warn(`⚠️ Simulando teste (desenvolvimento)`);
      this.logger.log(`📄 SIMULAÇÃO - Teste que seria impresso:\n${testText}`);
      return true;
    }
  }

  /**
   * Limpa a fila de impressão para evitar impressão de lixo
   */
  private async clearPrinterQueue(): Promise<void> {
    try {
      this.logger.log('🧹 Limpando fila de impressão...');
      
      // Cancela todos os trabalhos pendentes
      await execAsync('sudo cancel -a 2>/dev/null || true');
      
      // Aguarda um momento para garantir que a fila foi limpa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.logger.log('✅ Fila de impressão limpa');
    } catch (error) {
      this.logger.warn('⚠️ Erro ao limpar fila de impressão:', error.message);
    }
  }

  /**
   * Verifica se a impressora está realmente conectada e funcionando
   */
  private async validatePrinterConnection(devicePath?: string): Promise<boolean> {
    try {
      if (devicePath && devicePath.startsWith('/dev/')) {
        // Verifica se o dispositivo existe e é acessível
        await fs.promises.access(devicePath, fs.constants.W_OK);
        this.logger.log(`✅ Dispositivo ${devicePath} acessível`);
        return true;
      }
      
      // Verifica impressoras CUPS
      const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo ""');
      if (stdout.includes('habilitada') || stdout.includes('enabled')) {
        this.logger.log('✅ Impressora CUPS disponível');
        return true;
      }
      
      this.logger.warn('⚠️ Nenhuma impressora validada encontrada');
      return false;
    } catch (error) {
      this.logger.warn('⚠️ Erro na validação da impressora:', error.message);
      return false;
    }
  }

  private async detectLinuxSystemPrinters(printers: SystemPrinter[]): Promise<void> {
    try {
      this.logger.log('🔍 Verificando impressoras do sistema Ubuntu (CUPS/lpstat)...');
      
      // Comando para listar todas as impressoras configuradas
      const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || echo "CUPS_NAO_DISPONIVEL"');
      
      if (stdout.includes('CUPS_NAO_DISPONIVEL')) {
        this.logger.warn('⚠️ CUPS não disponível - tentando métodos alternativos');
        
        // Método alternativo: verifica /etc/cups/printers.conf
        try {
          const { stdout: cupsConf } = await execAsync('cat /etc/cups/printers.conf 2>/dev/null | grep "^<Printer" || echo "SEM_CONF"');
          if (!cupsConf.includes('SEM_CONF')) {
            this.logger.log('📄 Encontrou arquivo de configuração CUPS');
          }
        } catch (e) {
          this.logger.warn('Arquivo de configuração CUPS não acessível');
        }
        return;
      }

      const lines = stdout.split('\n');
      let defaultPrinter = '';
      
      // Encontra impressora padrão
      for (const line of lines) {
        if (line.includes('system default destination')) {
          const match = line.match(/system default destination: (\S+)/);
          if (match) defaultPrinter = match[1];
        }
      }

      // Processa cada impressora encontrada
      for (const line of lines) {
        if (line.startsWith('printer ')) {
          const match = line.match(/printer (\S+)/);
          if (match) {
            const printerName = match[1];
            const isEnabled = line.includes('enabled') || line.includes('idle');
            const isDefault = printerName === defaultPrinter;
            
            try {
              // Pega detalhes da impressora
              const { stdout: details } = await execAsync(`lpoptions -p ${printerName} -l 2>/dev/null || echo ""`);
              const { stdout: info } = await execAsync(`lpstat -l -p ${printerName} 2>/dev/null || echo ""`);
              
              printers.push({
                name: printerName,
                manufacturer: this.extractFromPrinterInfo(info, 'make') || 'Sistema Ubuntu',
                model: this.extractFromPrinterInfo(info, 'model') || printerName,
                status: isEnabled ? 'Ativa no Sistema' : 'Inativa',
                connection: 'CUPS (Ubuntu)',
                devicePath: '/dev/usblp0',
                platform: 'linux',
                isDefault,
                description: info.includes('Description:') ? info.split('Description: ')[1]?.split('\n')[0] : undefined
              });
              
              this.logger.log(`✅ Sistema: ${printerName} ${isDefault ? '(Padrão)' : ''}`);
            } catch (error) {
              this.logger.warn(`⚠️ Erro nos detalhes de ${printerName}: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro detectando impressoras do sistema:', error.message);
    }
  }

  private async detectLinuxThermalPrinters(printers: SystemPrinter[]): Promise<void> {
    try {
      this.logger.log('🔍 Busca específica por impressoras térmicas...');
      
      // Busca dispositivos que podem ser impressoras térmicas
      const commands = [
        'lsusb | grep -i "thermal\\|receipt\\|pos\\|zebra\\|citizen\\|bixolon"',
        'dmesg | grep -i "usb.*printer\\|thermal.*printer" | tail -3',
        'find /dev -name "*lp*" -o -name "*usb*" 2>/dev/null | grep -E "(lp|usb)" | head -5'
      ];

      for (const cmd of commands) {
        try {
          const { stdout } = await execAsync(cmd);
          if (stdout.trim()) {
            this.logger.log(`🔍 Resultado de "${cmd.split('|')[0]}...": ${stdout.trim().split('\n').length} linhas`);
            
            // Se encontrou dispositivos USB térmicos via lsusb
            if (cmd.includes('lsusb') && stdout.includes('ID ')) {
              const lines = stdout.split('\n');
              for (const line of lines) {
                if (line.includes('ID ')) {
                  const match = line.match(/ID ([0-9a-f]{4}):([0-9a-f]{4})/);
                  if (match) {
                    const [, vendorId, productId] = match;
                    const deviceName = line.split('ID ')[1]?.split(' ').slice(1).join(' ') || 'Impressora Térmica';
                    
                    // Verifica se já não existe
                    const exists = printers.some(p => 
                      p.vendorId === parseInt(vendorId, 16) && 
                      p.productId === parseInt(productId, 16)
                    );
                    
                    if (!exists) {
                      printers.push({
                        name: deviceName,
                        manufacturer: this.getVendorName(vendorId) || 'Térmica USB',
                        model: deviceName,
                        status: 'Térmica Detectada',
                        connection: 'USB Térmica',
                        vendorId: parseInt(vendorId, 16),
                        productId: parseInt(productId, 16),
                        devicePath: `/dev/usblp1`,
                        platform: 'linux',
                        isDefault: false
                      });
                      
                      this.logger.log(`🔥 Térmica: ${deviceName} (${vendorId}:${productId})`);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          // Ignora erros de comandos individuais
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro na busca térmica:', error.message);
    }
  }

  private getVendorName(vendorId: string): string {
    const vendors = {
      '04b8': 'Epson',
      '03f0': 'HP',
      '04a9': 'Canon',
      '04e8': 'Samsung',
      '0924': 'Xerox',
      '0482': 'Kyocera',
      '413c': 'Dell',
      '04f9': 'Brother',
      '0409': 'NEC',
      '1a86': 'QinHeng Electronics (CH340)',
      '0403': 'FTDI',
      '10c4': 'Cygnal Integrated Products',
      '067b': 'Prolific Technology',
      '1659': 'Thermal Printer',
      '0fe6': 'ICS Advent',
      '0519': 'Thermal POS'
    };
    
    return vendors[vendorId.toLowerCase()] || 'Fabricante Desconhecido';
  }

  private extractFromPrinterInfo(info: string, field: string): string | undefined {
    const lines = info.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(field.toLowerCase())) {
        const parts = line.split(':');
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    return undefined;
  }

  private formatPrice(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const formatted = `R$ ${num.toFixed(2).replace('.', ',')}`;
    return formatted;
  }
}
