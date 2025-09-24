import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UnifiedPrinterService } from './unified-printer.service';
import { UnifiedPrinterController } from './unified-printer.controller';
import { OrdersService } from './modules/orders/orders.service';
import { OrdersController } from './orders.controller';
import { CustomersService } from './customers.service';
import { AutoPrintService } from './auto-print.service';
import { WorkflowsController } from './workflows.controller';
import { MessagesController } from './messages.controller';
import { SalesModule } from './modules/sales/sales.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AgentConfigModule } from './modules/agent-config/agent-config.module';
import { ResponseTimeModule } from './modules/response-time/response-time.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { LoggingModule } from './modules/logging/logging.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SalesModule,
    CustomersModule,
    AgentConfigModule,
    ResponseTimeModule,
    ProdutosModule,
    LoggingModule,
    WhatsAppModule,
    MonitoringModule,
  ],
  controllers: [
    AppController,
    UnifiedPrinterController, 
    OrdersController, 
    WorkflowsController,
    MessagesController
  ],
  providers: [UnifiedPrinterService, OrdersService, CustomersService, AutoPrintService],
})
export class AppModule {}
