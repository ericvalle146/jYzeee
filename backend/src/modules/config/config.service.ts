import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private envFilePath = path.join(process.cwd(), '../.env');

  // Função para ler o arquivo .env atual
  getConfiguration() {
    try {
      const envContent = fs.readFileSync(this.envFilePath, 'utf8');
      const parsed = this.parseEnvContent(envContent);
      
      return {
        n8n: {
          domain: parsed['N8N_DOMAIN'] || '',
          apiKey: parsed['N8N_API_KEY'] || ''
        },
        database: {
          domain: parsed['DATABASE_URL'] || '',
          apiKey: parsed['DATABASE_KEY'] || ''
        },
        evolution: {
          domain: parsed['EVOLUTION_DOMAIN'] || '',
          apiKey: parsed['EVOLUTION_API_KEY'] || ''
        },
        externalApis: {
          domain: parsed['EXTERNAL_API_DOMAIN'] || '',
          apiKey: parsed['EXTERNAL_API_KEY'] || ''
        }
      };
    } catch (error) {
      return {
        n8n: { domain: '', apiKey: '' },
        database: { domain: '', apiKey: '' },
        evolution: { domain: '', apiKey: '' },
        externalApis: { domain: '', apiKey: '' }
      };
    }
  }

  // Função para salvar uma seção específica
  async saveConfiguration(service: string, config: any) {
    try {
      const envVars = this.serviceConfigToEnvVars(service, config);
      await this.updateEnvFile(envVars);
      
      return {
        success: true,
        message: `Configuração ${service} salva com sucesso no arquivo .env`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao salvar configuração: ' + error.message
      };
    }
  }

  // Função para salvar todas as configurações
  async saveAllConfigurations(config: any) {
    try {
      const envVars = this.allConfigToEnvVars(config);
      await this.updateEnvFile(envVars);
      
      return {
        success: true,
        message: 'Todas as configurações foram salvas com sucesso no arquivo .env'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao salvar todas as configurações: ' + error.message
      };
    }
  }

  // Função para testar conexões
  async testConnection(service: string, config: any) {
    try {
      switch (service) {
        case 'n8n':
          return await this.testN8nConnection(config);
        case 'database':
          return await this.testDatabaseConnection(config);
        case 'evolution':
          return await this.testEvolutionConnection(config);
        case 'externalApis':
          return await this.testExternalApiConnection(config);
        default:
          return {
            success: false,
            message: `Serviço ${service} não reconhecido`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Funções de teste de conexão simplificadas
  private async testN8nConnection(config: any) {
    if (!config.domain || !config.apiKey) {
      return { success: false, message: 'Domínio e API Key são obrigatórios' };
    }

    try {
      const response = await fetch(`${config.domain}/api/v1/workflows`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true, message: 'N8N conectado com sucesso' };
      } else {
        return { success: false, message: 'Falha na autenticação com N8N' };
      }
    } catch (error) {
      return { success: false, message: 'Erro de conexão com N8N' };
    }
  }

  private async testDatabaseConnection(config: any) {
    if (!config.domain) {
      return { success: false, message: 'URL do banco é obrigatória' };
    }

    // Validação simples de URL de banco
    if (config.domain.includes('postgresql://') || config.domain.includes('mysql://')) {
      return { success: true, message: 'Configuração de banco válida' };
    } else {
      return { success: false, message: 'URL de banco inválida' };
    }
  }

  private async testEvolutionConnection(config: any) {
    if (!config.domain || !config.apiKey) {
      return { success: false, message: 'Domínio e API Key são obrigatórios' };
    }

    try {
      const response = await fetch(`${config.domain}/manager/instance`, {
        headers: {
          'apikey': config.apiKey
        }
      });

      if (response.ok) {
        return { success: true, message: 'Evolution API conectada com sucesso' };
      } else {
        return { success: false, message: 'Falha na autenticação com Evolution API' };
      }
    } catch (error) {
      return { success: false, message: 'Erro de conexão com Evolution API' };
    }
  }

  private async testExternalApiConnection(config: any) {
    if (!config.domain) {
      return { success: false, message: 'Domínio é obrigatório' };
    }

    try {
      const response = await fetch(config.domain, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      return { success: true, message: 'API externa acessível' };
    } catch (error) {
      return { success: false, message: 'Erro de conexão com API externa' };
    }
  }

  // Função para converter configuração de serviço específico em variáveis de ambiente
  private serviceConfigToEnvVars(service: string, config: any): Record<string, string> {
    const envVars: Record<string, string> = {};

    switch (service) {
      case 'n8n':
        envVars['N8N_DOMAIN'] = config.domain || '';
        envVars['N8N_API_KEY'] = config.apiKey || '';
        break;
      case 'database':
        envVars['DATABASE_URL'] = config.domain || '';
        envVars['DATABASE_KEY'] = config.apiKey || '';
        break;
      case 'evolution':
        envVars['EVOLUTION_DOMAIN'] = config.domain || '';
        envVars['EVOLUTION_API_KEY'] = config.apiKey || '';
        break;
      case 'externalApis':
        envVars['EXTERNAL_API_DOMAIN'] = config.domain || '';
        envVars['EXTERNAL_API_KEY'] = config.apiKey || '';
        break;
    }

    return envVars;
  }

  // Função para converter toda configuração em variáveis de ambiente
  private allConfigToEnvVars(config: any): Record<string, string> {
    const envVars: Record<string, string> = {};

    // N8N
    if (config.n8n) {
      envVars['N8N_DOMAIN'] = config.n8n.domain || '';
      envVars['N8N_API_KEY'] = config.n8n.apiKey || '';
    }

    // Database
    if (config.database) {
      envVars['DATABASE_URL'] = config.database.domain || '';
      envVars['DATABASE_KEY'] = config.database.apiKey || '';
    }

    // Evolution
    if (config.evolution) {
      envVars['EVOLUTION_DOMAIN'] = config.evolution.domain || '';
      envVars['EVOLUTION_API_KEY'] = config.evolution.apiKey || '';
    }

    // External APIs
    if (config.externalApis) {
      envVars['EXTERNAL_API_DOMAIN'] = config.externalApis.domain || '';
      envVars['EXTERNAL_API_KEY'] = config.externalApis.apiKey || '';
    }

    return envVars;
  }

  // Função para atualizar o arquivo .env
  private async updateEnvFile(newVars: Record<string, string>) {
    try {
      let envContent = '';
      
      // Lê o arquivo atual se existir
      if (fs.existsSync(this.envFilePath)) {
        envContent = fs.readFileSync(this.envFilePath, 'utf8');
      }

      // Parse das variáveis existentes
      const existingVars = this.parseEnvContent(envContent);

      // Merge das variáveis
      const updatedVars = { ...existingVars, ...newVars };

      // Gera o novo conteúdo
      const newContent = this.generateEnvContent(updatedVars);

      // Escreve o arquivo
      fs.writeFileSync(this.envFilePath, newContent, 'utf8');

      return true;
    } catch (error) {
      throw new Error('Erro ao atualizar arquivo .env: ' + error.message);
    }
  }

  // Função para fazer parse do conteúdo .env
  private parseEnvContent(content: string): Record<string, string> {
    const vars: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex);
          let value = trimmedLine.substring(equalIndex + 1);
          
          // Remove aspas se existirem
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          vars[key] = value;
        }
      }
    }

    return vars;
  }

  // Função para gerar conteúdo .env organizado
  private generateEnvContent(vars: Record<string, string>): string {
    let content = '# Configurações do Sistema - Gerado automaticamente\n\n';

    // Seção N8N
    content += '# N8N Automation\n';
    content += `N8N_DOMAIN=${vars['N8N_DOMAIN'] || ''}\n`;
    content += `N8N_API_KEY=${vars['N8N_API_KEY'] || ''}\n\n`;

    // Seção Database
    content += '# Database Configuration\n';
    content += `DATABASE_URL=${vars['DATABASE_URL'] || ''}\n`;
    content += `DATABASE_KEY=${vars['DATABASE_KEY'] || ''}\n\n`;

    // Seção Evolution
    content += '# Evolution API\n';
    content += `EVOLUTION_DOMAIN=${vars['EVOLUTION_DOMAIN'] || ''}\n`;
    content += `EVOLUTION_API_KEY=${vars['EVOLUTION_API_KEY'] || ''}\n\n`;

    // Seção APIs Externas
    content += '# External APIs\n';
    content += `EXTERNAL_API_DOMAIN=${vars['EXTERNAL_API_DOMAIN'] || ''}\n`;
    content += `EXTERNAL_API_KEY=${vars['EXTERNAL_API_KEY'] || ''}\n\n`;

    // Outras variáveis existentes
    const usedKeys = new Set(['N8N_DOMAIN', 'N8N_API_KEY', 'DATABASE_URL', 'DATABASE_KEY', 'EVOLUTION_DOMAIN', 'EVOLUTION_API_KEY', 'EXTERNAL_API_DOMAIN', 'EXTERNAL_API_KEY']);
    const otherKeys = Object.keys(vars).filter(key => !usedKeys.has(key));
    
    if (otherKeys.length > 0) {
      content += '# Other Configuration\n';
      for (const key of otherKeys) {
        content += `${key}=${vars[key]}\n`;
      }
    }

    return content;
  }
}
