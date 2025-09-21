import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export interface SystemPrinter {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive' | 'error';
  isDefault: boolean;
  type: 'system' | 'usb' | 'thermal';
  devicePath?: string;
  description?: string;
  connection?: string;
  canActivate?: boolean;
}

export interface PrintResult {
  success: boolean;
  message: string;
  printerId?: string;
  error?: string;
}

@Injectable()
export class UnifiedPrinterService {
  private readonly logger = new Logger(UnifiedPrinterService.name);

  /**
   * 🔍 DETECTAR TODAS AS IMPRESSORAS DO SISTEMA
   * Busca impressoras em múltiplas fontes e retorna lista completa
   */
  async detectAllPrinters(): Promise<SystemPrinter[]> {
    this.logger.log('🔍 INICIANDO DETECÇÃO COMPLETA DE IMPRESSORAS');
    const allPrinters: SystemPrinter[] = [];

    try {
      // 1. Impressoras configuradas no CUPS (Linux/macOS)
      const systemPrinters = await this.detectSystemPrinters();
      allPrinters.push(...systemPrinters);

      // 2. Dispositivos USB diretos
      const usbPrinters = await this.detectUSBPrinters();
      allPrinters.push(...usbPrinters);

      // 3. Remover duplicatas
      const uniquePrinters = this.removeDuplicates(allPrinters);

      this.logger.log(`✅ TOTAL: ${uniquePrinters.length} impressoras detectadas`);
      return uniquePrinters;

    } catch (error) {
      this.logger.error('❌ Erro na detecção:', error);
      return [];
    }
  }

  /**
   * 🖨️ DETECTAR IMPRESSORAS DO SISTEMA (CUPS)
   */
  private async detectSystemPrinters(): Promise<SystemPrinter[]> {
    const printers: SystemPrinter[] = [];

    try {
      // Obter lista de impressoras
      const { stdout: printerList } = await execAsync('lpstat -p');
      const { stdout: defaultPrinter } = await execAsync('lpstat -d').catch(() => ({ stdout: '' }));

      const defaultName = defaultPrinter.match(/destino padrão do sistema: (.+)/)?.[1]?.trim();

      // Processar cada linha da lista
      const lines = printerList.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/impressora (.+?) está (.+?);/);
        if (match) {
          const [, name, statusText] = match;
          const isInactive = statusText.includes('inativa');
          
          // Obter detalhes da impressora
          const details = await this.getPrinterDetails(name);
          
          printers.push({
            id: `system_${name}`,
            name: name,
            status: isInactive ? 'inactive' : 'online',
            isDefault: name === defaultName,
            type: 'system',
            description: details.description,
            connection: details.connection,
            canActivate: isInactive
          });
        }
      }

      this.logger.log(`📋 Sistema: ${printers.length} impressoras encontradas`);
      return printers;

    } catch (error) {
      this.logger.warn('⚠️ Erro ao detectar impressoras do sistema:', error.message);
      return [];
    }
  }

  /**
   * 🔌 DETECTAR DISPOSITIVOS USB
   */
  private async detectUSBPrinters(): Promise<SystemPrinter[]> {
    const printers: SystemPrinter[] = [];

    try {
      // Verificar dispositivos /dev/usb/lp*
      const usbDevices = await this.findUSBDevices();
      
      for (const device of usbDevices) {
        const canWrite = await this.testDeviceAccess(device);
        
        printers.push({
          id: `usb_${device.replace('/dev/', '').replace('/', '_')}`,
          name: `Impressora USB (${device})`,
          status: canWrite ? 'online' : 'error',
          isDefault: false,
          type: 'usb',
          devicePath: device,
          description: `Dispositivo USB direto: ${device}`,
          connection: 'USB Direct'
        });
      }

      this.logger.log(`🔌 USB: ${printers.length} dispositivos encontrados`);
      return printers;

    } catch (error) {
      this.logger.warn('⚠️ Erro ao detectar USB:', error.message);
      return [];
    }
  }

  /**
   * 📝 OBTER DETALHES DE UMA IMPRESSORA
   */
  private async getPrinterDetails(printerName: string): Promise<{description: string, connection: string}> {
    try {
      const { stdout } = await execAsync(`lpstat -l -p "${printerName}"`);
      
      const descMatch = stdout.match(/Descrição: (.+)/);
      const connMatch = stdout.match(/Conexão: (.+)/);
      
      return {
        description: descMatch?.[1]?.trim() || printerName,
        connection: connMatch?.[1]?.trim() || 'Desconhecida'
      };
    } catch (error) {
      return {
        description: printerName,
        connection: 'Desconhecida'
      };
    }
  }

  /**
   * 🔍 ENCONTRAR DISPOSITIVOS USB
   */
  private async findUSBDevices(): Promise<string[]> {
    const devices: string[] = [];

    try {
      // Verificar /dev/usb/lp*
      if (fs.existsSync('/dev/usb')) {
        const files = fs.readdirSync('/dev/usb');
        for (const file of files) {
          if (file.startsWith('lp')) {
            devices.push(`/dev/usb/${file}`);
          }
        }
      }

      // Verificar /dev/usblp*
      const usbLpFiles = await execAsync('ls /dev/usblp* 2>/dev/null || true');
      if (usbLpFiles.stdout.trim()) {
        devices.push(...usbLpFiles.stdout.trim().split('\n'));
      }

    } catch (error) {
      // Silencioso - normal não ter dispositivos USB
    }

    return devices;
  }

  /**
   * 🧪 TESTAR ACESSO A DISPOSITIVO (SEM ESCREVER)
   */
  private async testDeviceAccess(devicePath: string): Promise<boolean> {
    try {
      // APENAS verificar se o dispositivo existe e é acessível para escrita
      // SEM escrever nada na impressora para evitar impressão automática
      await execAsync(`test -w ${devicePath}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🗑️ REMOVER DUPLICATAS
   */
  private removeDuplicates(printers: SystemPrinter[]): SystemPrinter[] {
    const seen = new Set<string>();
    return printers.filter(printer => {
      const key = `${printer.name}_${printer.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * ⚡ ATIVAR IMPRESSORA INATIVA
   */
  async activatePrinter(printerId: string): Promise<PrintResult> {
    try {
      // Extrair nome da impressora do ID
      const printerName = printerId.replace('system_', '');
      
      this.logger.log(`⚡ Tentando ativar impressora: ${printerName}`);
      
      // Comando para ativar impressora
      await execAsync(`cupsenable "${printerName}"`);
      
      // Verificar se foi ativada - aguardar um pouco para o sistema processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { stdout } = await execAsync(`lpstat -p "${printerName}"`);
      const isActive = !stdout.includes('inativa');
      const isEnabled = stdout.includes('habilitada');
      
      this.logger.log(`📊 Status da impressora ${printerName}: ${stdout.trim()}`);
      
      if (isActive) {
        this.logger.log(`✅ Impressora ${printerName} ativada com sucesso`);
        return {
          success: true,
          message: `Impressora ${printerName} foi ativada e está pronta para uso`,
          printerId
        };
      } else if (isEnabled) {
        // Impressora está habilitada mas inativa - problema de configuração
        this.logger.warn(`⚠️ Impressora ${printerName} está habilitada mas inativa - possível problema de configuração`);
        return {
          success: false,
          message: `Impressora ${printerName} está habilitada mas inativa. Verifique a configuração da impressora no sistema.`,
          error: 'PRINTER_CONFIGURATION_ISSUE'
        };
      } else {
        return {
          success: false,
          message: `Falha ao ativar impressora ${printerName}. Comando cupsenable não teve efeito.`,
          error: 'ACTIVATION_COMMAND_FAILED'
        };
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao ativar impressora:`, error);
      return {
        success: false,
        message: 'Erro ao ativar impressora',
        error: error.message
      };
    }
  }

  /**
   * 🖨️ IMPRIMIR PEDIDO
   */
  async printOrder(printerId: string, orderData: any, printText: string, clientIP?: string): Promise<PrintResult> {
    try {
      this.logger.log(`🖨️ Imprimindo pedido ${orderData.id} na impressora ${printerId}`);

      // Verificar se impressora está disponível
      const printers = await this.detectAllPrinters();
      const printer = printers.find(p => p.id === printerId);

      if (!printer) {
        return {
          success: false,
          message: 'Impressora não encontrada',
          error: 'ID de impressora inválido'
        };
      }

      // Se impressora está inativa, retornar erro em vez de ativar automaticamente
      if (printer.status === 'inactive') {
        this.logger.warn(`⚠️ Impressora inativa: ${printer.name}`);
        return {
          success: false,
          message: `Impressora ${printer.name} está inativa. Use o botão 'Ativar' para habilitá-la manualmente.`,
          error: 'PRINTER_INACTIVE'
        };
      }

      // 🚀 NOVA FUNCIONALIDADE: Enviar para serviço local se disponível
      const localPrintResult = await this.sendToLocalPrinterService(orderData, printText, clientIP);
      if (localPrintResult.success) {
        this.logger.log(`✅ Pedido ${orderData.id} enviado para impressão local`);
        return localPrintResult;
      }

      // Fallback: Imprimir localmente na VPS (se houver impressora)
      let printResult: PrintResult;

      if (printer.type === 'usb' && printer.devicePath) {
        printResult = await this.printToUSBDevice(printer.devicePath, printText);
      } else {
        printResult = await this.printToSystemPrinter(printer.name, printText);
      }

      if (printResult.success) {
        this.logger.log(`✅ Pedido ${orderData.id} impresso com sucesso`);
      } else {
        this.logger.error(`❌ Falha na impressão do pedido ${orderData.id}`);
      }

      return printResult;

    } catch (error) {
      this.logger.error('❌ Erro geral na impressão:', error);
      return {
        success: false,
        message: 'Erro interno na impressão',
        error: error.message
      };
    }
  }

  /**
   * 🚀 ENVIAR PARA SERVIÇO LOCAL DE IMPRESSÃO
   */
  private async sendToLocalPrinterService(orderData: any, printText: string, clientIP?: string): Promise<PrintResult> {
    try {
      // Lista de possíveis URLs do serviço local
      const localUrls = [
        'http://localhost:3003',
        'http://127.0.0.1:3003',
        'http://192.168.1.100:3003', // Ajuste para seu IP local
        'http://10.0.0.100:3003'     // Ajuste para seu IP local
      ];

      for (const baseUrl of localUrls) {
        try {
          this.logger.log(`🔗 Tentando conectar com serviço local: ${baseUrl}`);
          
          const response = await fetch(`${baseUrl}/print`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': clientIP || 'unknown',
              'X-Real-IP': clientIP || 'unknown'
            },
            body: JSON.stringify({
              orderData,
              printText,
              orderId: orderData.id,
              clientIP: clientIP || 'unknown',
              userName: orderData.nome_cliente || 'Usuário',
              timestamp: new Date().toISOString()
            }),
            timeout: 5000 // 5 segundos de timeout
          });

          if (response.ok) {
            const result = await response.json();
            this.logger.log(`✅ Serviço local respondeu: ${result.message}`);
            return {
              success: true,
              message: `Impressão enviada para serviço local: ${result.message}`,
              printerId: 'local-service'
            };
          } else if (response.status === 403) {
            const errorResult = await response.json();
            this.logger.warn(`⚠️ IP não autorizado: ${errorResult.message}`);
            return {
              success: false,
              message: errorResult.message,
              error: 'IP_NOT_AUTHORIZED',
              authUrl: errorResult.authUrl
            };
          }
        } catch (error) {
          this.logger.debug(`⚠️ Serviço local ${baseUrl} não disponível: ${error.message}`);
          continue;
        }
      }

      this.logger.warn('⚠️ Nenhum serviço local de impressão encontrado');
      return {
        success: false,
        message: 'Serviço local de impressão não disponível',
        error: 'LOCAL_SERVICE_UNAVAILABLE'
      };

    } catch (error) {
      this.logger.error('❌ Erro ao conectar com serviço local:', error);
      return {
        success: false,
        message: 'Erro ao conectar com serviço local',
        error: error.message
      };
    }
  }

  /**
   * 🔌 IMPRIMIR EM DISPOSITIVO USB
   */
  private async printToUSBDevice(devicePath: string, printText: string): Promise<PrintResult> {
    try {
      // Preparar texto para impressão térmica
      const thermalText = this.prepareThermalText(printText);
      
      // Escrever no dispositivo (sem flag -e que causa problemas)
      await execAsync(`echo "${thermalText}" > ${devicePath}`);
      
      return {
        success: true,
        message: `Impresso com sucesso em ${devicePath}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro ao imprimir em ${devicePath}`,
        error: error.message
      };
    }
  }

  /**
   * 🖨️ IMPRIMIR EM IMPRESSORA DO SISTEMA
   */
  private async printToSystemPrinter(printerName: string, printText: string): Promise<PrintResult> {
    try {
      // Criar arquivo temporário
      const tempFile = `/tmp/print_${Date.now()}.txt`;
      fs.writeFileSync(tempFile, printText);

      // Imprimir usando lp
      await execAsync(`lp -d "${printerName}" "${tempFile}"`);
      
      // Limpar arquivo temporário
      fs.unlinkSync(tempFile);

      return {
        success: true,
        message: `Impresso com sucesso na impressora ${printerName}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro ao imprimir na impressora ${printerName}`,
        error: error.message
      };
    }
  }

  /**
   * 📄 PREPARAR TEXTO PARA IMPRESSÃO TÉRMICA
   */
  private prepareThermalText(text: string): string {
    // 🧹 SANITIZAÇÃO: Remover sequências de controle indesejadas
    let sanitizedText = text;
    let seqRemoved = false;

    // Remover sequências problemáticas
    const originalLength = sanitizedText.length;
    sanitizedText = sanitizedText.replace(/\\x1DV\\x41\\x03/g, '');
    sanitizedText = sanitizedText.replace(/\x1D\x56\x41\x03/g, '');
    sanitizedText = sanitizedText.replace(/\\x1B@/g, '');
    sanitizedText = sanitizedText.replace(/\x1B@/g, '');
    sanitizedText = sanitizedText.replace(/-e \x1B@/g, '');
    sanitizedText = sanitizedText.replace(/-e /g, ''); // Remove flag -e solta
    sanitizedText = sanitizedText.replace(/\\x1D V \\x41 \\x03/g, '');
    
    if (sanitizedText.length !== originalLength) {
      seqRemoved = true;
    }

    // Retorna apenas o texto limpo + quebras de linha básicas (sem comandos ESC/POS)
    return `${sanitizedText}\n\n\n`;
  }

  /**
   * 🧪 TESTAR IMPRESSORA
   */
  async testPrint(printerId: string): Promise<PrintResult> {
    const testText = `TESTE DE IMPRESSÃO
========================
Data: ${new Date().toLocaleString('pt-BR')}
Impressora: ${printerId}
Sistema: JYZE DELIVERY
========================

✅ Se você está vendo isso,
a impressora está funcionando!

`;

    return await this.printOrder(printerId, { id: 'TEST' }, testText);
  }
}

