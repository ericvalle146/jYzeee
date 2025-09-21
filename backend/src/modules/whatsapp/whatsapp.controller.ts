import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  HttpStatus, 
  HttpException,
  Logger 
} from '@nestjs/common';
import { WhatsAppService, QRCodeResponse, InstanceStatusResponse, WhatsAppInstance } from './whatsapp.service';

export interface GenerateQRRequest {
  clientId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@Controller('api/whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * INIT-01 & INIT-02: Generate QR Code for specific client
   * POST /api/whatsapp/qr-code
   */
  @Post('qr-code')
  async generateQRCode(@Body() request: GenerateQRRequest): Promise<ApiResponse<QRCodeResponse>> {
    this.logger.log(`📱 QR Code requested for client: ${request.clientId}`);

    try {
      if (!request.clientId) {
        throw new HttpException('clientId is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.whatsappService.generateQRCode(request.clientId);
      
      return {
        success: result.status !== 'error',
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Error generating QR Code for client ${request.clientId}:`, error.message);
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate QR Code',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get status of specific client's WhatsApp instance
   * GET /api/whatsapp/status/:clientId
   */
  @Get('status/:clientId')
  async getInstanceStatus(@Param('clientId') clientId: string): Promise<ApiResponse<InstanceStatusResponse>> {
    this.logger.log(`📊 Status check requested for client: ${clientId}`);

    try {
      if (!clientId) {
        throw new HttpException('clientId is required', HttpStatus.BAD_REQUEST);
      }

      const status = await this.whatsappService.checkInstanceStatus(clientId);
      
      return {
        success: true,
        message: 'Status retrieved successfully',
        data: status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Error checking status for client ${clientId}:`, error.message);
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to check instance status',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all active WhatsApp instances
   * GET /api/whatsapp/instances
   */
  @Get('instances')
  async getAllInstances(): Promise<ApiResponse<WhatsAppInstance[]>> {
    this.logger.log('📋 All instances requested');

    try {
      const instances = await this.whatsappService.getAllInstances();
      
      return {
        success: true,
        message: `Retrieved ${instances.length} instances`,
        data: instances,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Error retrieving instances:', error.message);
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve instances',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete specific client's WhatsApp instance
   * DELETE /api/whatsapp/instance/:clientId
   */
  @Delete('instance/:clientId')
  async deleteInstance(@Param('clientId') clientId: string): Promise<ApiResponse<any>> {
    this.logger.log(`🗑️ Delete requested for client: ${clientId}`);

    try {
      if (!clientId) {
        throw new HttpException('clientId is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.whatsappService.deleteInstance(clientId);
      
      return {
        success: result.success,
        message: result.message,
        data: { clientId },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Error deleting instance for client ${clientId}:`, error.message);
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete instance',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * INIT-04: Health check endpoint for monitoring
   * GET /api/whatsapp/health
   */
  @Get('health')
  async healthCheck(): Promise<ApiResponse<any>> {
    this.logger.log('🏥 Health check requested');

    try {
      const healthData = await this.whatsappService.performHealthCheck();
      const apiStatus = this.whatsappService.getApiStatus();
      
      return {
        success: true,
        message: 'Health check completed',
        data: {
          ...healthData,
          apiConfiguration: apiStatus,
          serverTime: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Health check failed:', error.message);
      
      throw new HttpException(
        {
          success: false,
          message: 'Health check failed',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get Evolution API configuration status
   * GET /api/whatsapp/config
   */
  @Get('config')
  async getConfig(): Promise<ApiResponse<any>> {
    this.logger.log('⚙️ Configuration status requested');

    try {
      const apiStatus = this.whatsappService.getApiStatus();
      
      return {
        success: apiStatus.configured,
        message: apiStatus.configured ? 'API properly configured' : 'API configuration incomplete',
        data: apiStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Error checking configuration:', error.message);
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to check configuration',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
