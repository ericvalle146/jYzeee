import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemPrinter {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive' | 'error';
  isDefault: boolean;
  type: 'ssh';
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
  authUrl?: string;
}

@Injectable()
export class UnifiedPrinterService {
  private readonly logger = new Logger(UnifiedPrinterService.name);
  private readonly SSH_USER = process.env.SSH_USER || 'eric';
  private readonly LOCAL_PRINTER_IP = process.env.SSH_HOST || '192.168.3.5';
  private readonly LOCAL_PRINTER_NAME = process.env.PRINTER_NAME || '5808L-V2024';
  private readonly SSH_PASSWORD = process.env.SSH_PASSWORD || 'eqrwiecr';

  /**
   * 🔍 DETECTAR IMPRESSORA SSH (SEMPRE UMA SÓ)
   */
  async detectAllPrinters(): Promise<SystemPrinter[]> {
    this.logger.log('🔍 VERIFICANDO IMPRESSORA SSH');
    
    try {
      const connectionTest = await this.testSshConnection();
      
      return [{
        id: 'ssh_printer',
        name: this.LOCAL_PRINTER_NAME,
        status: connectionTest.success ? 'online' : 'error',
        isDefault: true,
        type: 'ssh',
        description: `Impressora via SSH em ${this.LOCAL_PRINTER_IP}`,
        connection: `SSH ${this.SSH_USER}@${this.LOCAL_PRINTER_IP}`,
        canActivate: false
      }];

    } catch (error) {
      this.logger.error('❌ Erro na detecção SSH:', error);
      return [{
        id: 'ssh_printer',
        name: this.LOCAL_PRINTER_NAME,
        status: 'error',
        isDefault: true,
        type: 'ssh',
        description: `Impressora via SSH em ${this.LOCAL_PRINTER_IP} (ERRO)`,
        connection: `SSH ${this.SSH_USER}@${this.LOCAL_PRINTER_IP}`,
        canActivate: false
      }];
    }
  }

  /**
   * 🖨️ IMPRIMIR PEDIDO VIA SSH
   */
  async printOrder(printerId: string, orderData: any, printText: string, clientIP?: string): Promise<PrintResult> {
    try {
      this.logger.log(`🖨️ Imprimindo pedido ${orderData.id} via SSH`);

      // Sempre usar SSH - ignorar printerId
      const result = await this.printViaSsh(printText);
      
      if (result.success) {
        this.logger.log(`✅ Pedido ${orderData.id} impresso com sucesso via SSH`);
        return {
          success: true,
          message: `Pedido #${orderData.id} impresso via SSH`,
          printerId: 'ssh_printer'
        };
      } else {
        this.logger.error(`❌ Falha na impressão SSH do pedido ${orderData.id}: ${result.message}`);
        return {
          success: false,
          message: result.message,
          error: 'SSH_PRINT_FAILED'
        };
      }

    } catch (error) {
      this.logger.error(`💥 Erro SSH para pedido ${orderData.id}: ${error.message}`);
      return {
        success: false,
        message: `Erro SSH: ${error.message}`,
        error: 'SSH_CONNECTION_ERROR'
      };
    }
  }

  /**
   * 🔐 IMPRIMIR VIA SSH
   */
  private async printViaSsh(printText: string): Promise<{ success: boolean; message: string }> {
    // Escape single quotes in the print text
    const escapedText = printText.replace(/'/g, "'\\''");
    
    const command = `sshpass -p '${this.SSH_PASSWORD}' ssh -o StrictHostKeyChecking=no ${this.SSH_USER}@${this.LOCAL_PRINTER_IP} 'printf "%s\\n\\n" "${escapedText}" | lp -d "${this.LOCAL_PRINTER_NAME}"'`;
    
    this.logger.debug(`🔧 SSH Command: ${command.replace(this.SSH_PASSWORD, '***')}`);

    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Warning: Permanently added')) {
        this.logger.warn(`⚠️ SSH Print Warning: ${stderr}`);
      }
      
      this.logger.log(`📄 SSH Print Output: ${stdout}`);
      return { 
        success: true, 
        message: `Impressão enviada via SSH - ${stdout.trim()}` 
      };
    } catch (error) {
      this.logger.error(`💥 SSH Command Failed: ${error.message}`);
      return { 
        success: false, 
        message: `Falha SSH: ${error.message}` 
      };
    }
  }


  /**
   * ⚡ ATIVAR IMPRESSORA (SEMPRE ATIVA VIA SSH)
   */
  async activatePrinter(printerId: string): Promise<PrintResult> {
    // SSH printers are always "active" if connection works
    const connectionTest = await this.testSshConnection();
    
    if (connectionTest.success) {
      return {
        success: true,
        message: `Impressora SSH está ativa e pronta`,
        printerId
      };
    } else {
      return {
        success: false,
        message: connectionTest.message,
        error: 'SSH_CONNECTION_FAILED'
      };
    }
  }

  /**
   * 🔗 TESTAR CONEXÃO SSH
   */
  async testSshConnection(): Promise<{success: boolean; message: string}> {
    this.logger.log('🔗 Testing SSH connection...');
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const sshCommand = `sshpass -p '${this.SSH_PASSWORD}' ssh -o StrictHostKeyChecking=no ${this.SSH_USER}@${this.LOCAL_PRINTER_IP} 'echo "SSH connection test successful"'`;
      
      const { stdout, stderr } = await execAsync(sshCommand);
      
      if (stdout.includes('SSH connection test successful')) {
        this.logger.log('✅ SSH connection successful');
        return {
          success: true,
          message: 'Conexão SSH ativa e funcionando'
        };
      } else {
        throw new Error(stderr || 'Resposta SSH inválida');
      }
      
    } catch (error) {
      this.logger.error('❌ SSH Test Failed:', error.message);
      return {
        success: false,
        message: `Falha na conexão SSH: ${error.message}`
      };
    }
  }

  /**
   * 🧪 TESTAR IMPRESSORA SSH
   */
  async testPrint(printerId: string): Promise<PrintResult> {
    const testText = `TESTE DE IMPRESSÃO SSH
========================
Data: ${new Date().toLocaleString('pt-BR')}
Impressora: ${this.LOCAL_PRINTER_NAME}
IP: ${this.LOCAL_PRINTER_IP}
Sistema: JYZE DELIVERY
========================

✅ Se você está vendo isso,
a impressão via SSH está funcionando!

`;

    return await this.printOrder(printerId, { id: 'TEST' }, testText);
  }
}