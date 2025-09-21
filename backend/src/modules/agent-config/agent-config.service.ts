import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentConfigData {
  nomeAgente?: string;
  tempoEntrega?: number;
  valorFrete?: number;
}

@Injectable()
export class AgentConfigService {
  private agentConfig: AgentConfigData = {};
  private readonly configFilePath = path.join(process.cwd(), 'data', 'agent-config.json');

  constructor() {
    this.loadConfigFromFile();
  }

  private loadConfigFromFile(): void {
    try {
      // Criar diretório data se não existir
      const dataDir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Carregar configuração do arquivo se existir
      if (fs.existsSync(this.configFilePath)) {
        const configData = fs.readFileSync(this.configFilePath, 'utf8');
        this.agentConfig = JSON.parse(configData);
      }
    } catch (error) {
      this.agentConfig = {};
    }
  }

  private saveConfigToFile(): void {
    try {
      // Criar diretório data se não existir
      const dataDir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Salvar configuração no arquivo
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.agentConfig, null, 2));
    } catch (error) {
    }
  }

  async saveAgentConfig(data: Partial<AgentConfigData>): Promise<{ success: boolean; message: string; data: AgentConfigData }> {
    // Atualiza apenas os campos que foram enviados
    if (data.nomeAgente !== undefined) {
      this.agentConfig.nomeAgente = data.nomeAgente;
    }
    
    if (data.tempoEntrega !== undefined) {
      this.agentConfig.tempoEntrega = data.tempoEntrega;
    }
    
    if (data.valorFrete !== undefined) {
      this.agentConfig.valorFrete = data.valorFrete;
    }

    // Salvar no arquivo para persistência
    this.saveConfigToFile();


    return {
      success: true,
      message: 'Configuração salva com sucesso',
      data: this.agentConfig
    };
  }

  async getAgentConfig(): Promise<AgentConfigData> {
    return this.agentConfig;
  }

  async clearAgentConfig(): Promise<{ success: boolean; message: string }> {
    this.agentConfig = {};
    this.saveConfigToFile();
    return {
      success: true,
      message: 'Configuração limpa com sucesso'
    };
  }
}
