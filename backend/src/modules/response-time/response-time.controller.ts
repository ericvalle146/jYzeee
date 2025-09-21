import { Controller, Get, Post, Body } from '@nestjs/common';
import { ResponseTimeService } from './response-time.service';

export interface ResponseTimeData {
  tempoResposta?: number;
}

@Controller('api/response-time')
export class ResponseTimeController {
  constructor(private readonly responseTimeService: ResponseTimeService) {}

  @Post()
  async saveResponseTime(@Body() data: ResponseTimeData) {
    return this.responseTimeService.saveResponseTime(data);
  }

  @Get()
  async getResponseTime() {
    return this.responseTimeService.getResponseTime();
  }

  @Get('export')
  async exportResponseTime() {
    const config = await this.responseTimeService.getResponseTime();
    return {
      success: true,
      message: 'Tempo de resposta exportado com sucesso',
      data: {
        tempoResposta: config.tempoResposta || null
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('api-format')
  async getResponseTimeApiFormat() {
    const config = await this.responseTimeService.getResponseTime();
    return {
      tempoResposta: config.tempoResposta ? config.tempoResposta.toString() : ""
    };
  }
}
