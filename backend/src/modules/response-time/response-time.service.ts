import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ResponseTimeData {
  tempoResposta?: number;
}

@Injectable()
export class ResponseTimeService {
  private responseTimeConfig: ResponseTimeData = {};
  private readonly configFilePath = path.join(process.cwd(), 'data', 'response-time-config.json');

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
        this.responseTimeConfig = JSON.parse(configData);
      }
    } catch (error) {
      this.responseTimeConfig = {};
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
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.responseTimeConfig, null, 2), 'utf8');
    } catch (error) {
    }
  }

  async saveResponseTime(data: Partial<ResponseTimeData>): Promise<{ success: boolean; message: string; data: ResponseTimeData }> {
    if (data.tempoResposta !== undefined) {
      this.responseTimeConfig.tempoResposta = data.tempoResposta;
      this.saveConfigToFile();
    }


    return {
      success: true,
      message: 'Tempo de resposta salvo com sucesso',
      data: this.responseTimeConfig
    };
  }

  async getResponseTime(): Promise<ResponseTimeData> {
    return this.responseTimeConfig;
  }

  async clearResponseTime(): Promise<{ success: boolean; message: string }> {
    this.responseTimeConfig = {};
    this.saveConfigToFile();
    return {
      success: true,
      message: 'Tempo de resposta limpo com sucesso'
    };
  }
}
