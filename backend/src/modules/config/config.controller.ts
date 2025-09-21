import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfiguration() {
    return this.configService.getConfiguration();
  }

  @Post('save/:service')
  async saveConfiguration(@Param('service') service: string, @Body() config: any) {
    return this.configService.saveConfiguration(service, config);
  }

  @Post('save-all')
  async saveAllConfigurations(@Body() config: any) {
    return this.configService.saveAllConfigurations(config);
  }

  @Post('test/:service')
  async testConnection(@Param('service') service: string, @Body() config: any) {
    return this.configService.testConnection(service, config);
  }
}
