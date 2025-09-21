import { Controller, Get, Post, Body } from '@nestjs/common';
import { AgentConfigService } from './agent-config.service';

export interface AgentConfigData {
  nomeAgente?: string;
  tempoEntrega?: number;
  valorFrete?: number;
}

@Controller('api/agent-config')
export class AgentConfigController {
  constructor(private readonly agentConfigService: AgentConfigService) {}

  @Post()
  async saveAgentConfig(@Body() data: AgentConfigData) {
    return this.agentConfigService.saveAgentConfig(data);
  }

  @Get()
  async getAgentConfig() {
    return this.agentConfigService.getAgentConfig();
  }

  @Get('export')
  async exportAgentConfig() {
    const config = await this.agentConfigService.getAgentConfig();
    return {
      success: true,
      message: 'Configurações do agente exportadas com sucesso',
      data: {
        nomeAgente: config.nomeAgente || null,
        tempoEntrega: config.tempoEntrega || null,
        valorFrete: config.valorFrete || null
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('api-format')
  async getAgentConfigApiFormat() {
    const config = await this.agentConfigService.getAgentConfig();
    return {
      nomeAgente: config.nomeAgente || '',
      tempoEntregaMinutos: config.tempoEntrega || 0,
      valorFrete: config.valorFrete || 0
    };
  }
}
