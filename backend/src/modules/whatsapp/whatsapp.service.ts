import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { StructuredLoggingService } from '../logging/logging.service';

export interface WhatsAppInstance {
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'unknown';
  lastCheck: Date;
  clientId?: string;
  isActive: boolean;
}

export interface QRCodeResponse {
  instanceName: string;
  qrCode?: string;
  status: 'generated' | 'already_connected' | 'error';
  message: string;
}

export interface InstanceStatusResponse {
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'unknown';
  lastUpdate: Date;
}

@Injectable()
export class WhatsAppService {
  private readonly evolutionApiClient: AxiosInstance;
  private readonly instances = new Map<string, WhatsAppInstance>();
  
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: StructuredLoggingService
  ) {
    const evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL');
    const evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
    
    this.evolutionApiClient = axios.create({
      baseURL: evolutionApiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
    });

    this.logger.log('🔧 WhatsApp Service initialized', {
      operation: 'service-init',
      evolutionApiUrl,
      hasApiKey: !!evolutionApiKey
    });
    
    if (!evolutionApiKey) {
      this.logger.warn('⚠️ EVOLUTION_API_KEY not configured - service may not work properly', {
        operation: 'service-init'
      });
    }
  }

  /**
   * INIT-01: Multi-Instance Support
   * Generates unique instance name based on client ID
   */
  private generateInstanceName(clientId: string): string {
    return `jyze_client_${clientId}`;
  }

  /**
   * INIT-02: Intelligent QR Code Generation
   * Checks status first, only generates QR if needed
   */
  async generateQRCode(clientId: string): Promise<QRCodeResponse> {
    const instanceName = this.generateInstanceName(clientId);
    
    this.logger.logWhatsAppOperation('qr-generation', instanceName, clientId, 'Starting QR Code generation process');

    try {
      // Step 1: Check current status first
      const currentStatus = await this.checkInstanceStatus(clientId);
      
      if (currentStatus.status === 'open') {
        this.logger.logWhatsAppOperation('qr-generation', instanceName, clientId, 'Instance already connected, no QR Code needed', 'info', {
          currentStatus: currentStatus.status
        });
        return {
          instanceName,
          status: 'already_connected',
          message: 'WhatsApp instance is already connected'
        };
      }

      // Step 2: If not connected, proceed with QR generation
      this.logger.logWhatsAppOperation('qr-generation', instanceName, clientId, 'Instance not connected, generating QR Code', 'info', {
        currentStatus: currentStatus.status
      });
      
      // Try to get QR Code (restart instance if needed)
      const qrResponse = await this.requestQRCodeFromEvolution(instanceName);
      
      if (qrResponse) {
        // Update local instance tracking
        this.instances.set(instanceName, {
          instanceName,
          status: 'connecting',
          lastCheck: new Date(),
          clientId,
          isActive: true
        });

        this.logger.log(`✅ [${instanceName}] QR Code generated successfully`);
        return {
          instanceName,
          qrCode: qrResponse,
          status: 'generated',
          message: 'QR Code generated successfully. Please scan with WhatsApp.'
        };
      } else {
        throw new Error('QR Code not found in Evolution API response');
      }

    } catch (error) {
      this.logger.error(`❌ [${instanceName}] Error generating QR Code:`, error.message);
      
      return {
        instanceName,
        status: 'error',
        message: `Failed to generate QR Code: ${error.message}`
      };
    }
  }

  /**
   * Request QR Code from Evolution API with intelligent retry
   */
  private async requestQRCodeFromEvolution(instanceName: string): Promise<string | null> {
    try {
      // First, try to restart instance to force new QR Code
      this.logger.log(`🔄 [${instanceName}] Restarting instance to generate fresh QR Code`);
      
      const restartResponse = await this.evolutionApiClient.put(`/instance/restart/${instanceName}`);
      
      // Check if restart returned QR Code directly
      let qrCode = this.extractQRCodeFromResponse(restartResponse.data);
      
      if (qrCode) {
        this.logger.log(`✅ [${instanceName}] QR Code obtained from restart`);
        return qrCode;
      }

      // If not, try specific QR endpoints
      const qrEndpoints = [
        `/instance/connect/${instanceName}`,
        `/instance/${instanceName}/connect`,
        `/instance/qrcode/${instanceName}`,
        `/instance/${instanceName}/qrcode`
      ];

      for (const endpoint of qrEndpoints) {
        try {
          this.logger.log(`🔍 [${instanceName}] Trying endpoint: ${endpoint}`);
          const response = await this.evolutionApiClient.get(endpoint);
          
          qrCode = this.extractQRCodeFromResponse(response.data);
          
          if (qrCode) {
            this.logger.log(`✅ [${instanceName}] QR Code found at: ${endpoint}`);
            return qrCode;
          }
        } catch (endpointError) {
          this.logger.warn(`⚠️ [${instanceName}] Endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }

      // If all endpoints fail, try creating new instance
      this.logger.log(`🆕 [${instanceName}] All endpoints failed, creating new instance`);
      return await this.createNewInstance(instanceName);

    } catch (error) {
      this.logger.error(`❌ [${instanceName}] Failed to get QR Code from Evolution API:`, error.message);
      throw error;
    }
  }

  /**
   * Create new instance if all else fails
   */
  private async createNewInstance(instanceName: string): Promise<string | null> {
    try {
      const createResponse = await this.evolutionApiClient.post('/instance/create', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      const qrCode = this.extractQRCodeFromResponse(createResponse.data);
      
      if (qrCode) {
        this.logger.log(`✅ [${instanceName}] New instance created with QR Code`);
        return qrCode;
      } else {
        this.logger.error(`❌ [${instanceName}] New instance created but no QR Code found`);
        return null;
      }
    } catch (error) {
      this.logger.error(`❌ [${instanceName}] Failed to create new instance:`, error.message);
      throw error;
    }
  }

  /**
   * Extract QR Code from various Evolution API response formats
   */
  private extractQRCodeFromResponse(response: any): string | null {
    // Try different possible locations for QR Code in response
    if (response.base64) {
      return response.base64;
    }
    if (response.qrcode?.base64) {
      return response.qrcode.base64;
    }
    if (response.instance?.qrcode?.base64) {
      return response.instance.qrcode.base64;
    }
    if (response.instance?.qrCode) {
      return response.instance.qrCode;
    }
    if (response.qrCode) {
      return response.qrCode;
    }
    
    return null;
  }

  /**
   * Check status of specific instance
   */
  async checkInstanceStatus(clientId: string): Promise<InstanceStatusResponse> {
    const instanceName = this.generateInstanceName(clientId);
    
    try {
      const response = await this.evolutionApiClient.get(`/instance/connectionState/${instanceName}`);
      
      const status = response.data?.instance?.status || 'unknown';
      const now = new Date();
      
      // Update local tracking
      this.instances.set(instanceName, {
        instanceName,
        status,
        lastCheck: now,
        clientId,
        isActive: status === 'open'
      });

      this.logger.log(`📊 [${instanceName}] Status check: ${status}`);
      
      return {
        instanceName,
        status,
        lastUpdate: now
      };
      
    } catch (error) {
      this.logger.error(`❌ [${instanceName}] Failed to check status:`, error.message);
      
      return {
        instanceName,
        status: 'unknown',
        lastUpdate: new Date()
      };
    }
  }

  /**
   * Get all active instances
   */
  async getAllInstances(): Promise<WhatsAppInstance[]> {
    return Array.from(this.instances.values());
  }

  /**
   * Delete specific instance
   */
  async deleteInstance(clientId: string): Promise<{ success: boolean; message: string }> {
    const instanceName = this.generateInstanceName(clientId);
    
    try {
      await this.evolutionApiClient.delete(`/instance/delete/${instanceName}`);
      
      // Remove from local tracking
      this.instances.delete(instanceName);
      
      this.logger.log(`🗑️ [${instanceName}] Instance deleted successfully`);
      
      return {
        success: true,
        message: 'Instance deleted successfully'
      };
      
    } catch (error) {
      this.logger.error(`❌ [${instanceName}] Failed to delete instance:`, error.message);
      
      return {
        success: false,
        message: `Failed to delete instance: ${error.message}`
      };
    }
  }

  /**
   * INIT-04: Health check for monitoring
   * Check health of all active instances
   */
  async performHealthCheck(): Promise<{
    totalInstances: number;
    connectedInstances: number;
    disconnectedInstances: number;
    instances: WhatsAppInstance[];
  }> {
    this.logger.log('🏥 Performing health check on all instances');
    
    const instances = Array.from(this.instances.values());
    let connectedCount = 0;
    let disconnectedCount = 0;

    // Update status for all instances
    for (const instance of instances) {
      try {
        const status = await this.checkInstanceStatus(instance.clientId!);
        if (status.status === 'open') {
          connectedCount++;
        } else {
          disconnectedCount++;
        }
      } catch (error) {
        this.logger.error(`❌ Health check failed for ${instance.instanceName}:`, error.message);
        disconnectedCount++;
      }
    }

    const result = {
      totalInstances: instances.length,
      connectedInstances: connectedCount,
      disconnectedInstances: disconnectedCount,
      instances: Array.from(this.instances.values())
    };

    this.logger.log(`📊 Health check complete: ${connectedCount}/${instances.length} instances connected`);
    
    return result;
  }

  /**
   * Get Evolution API configuration status
   */
  getApiStatus(): {
    configured: boolean;
    baseUrl: string;
    hasApiKey: boolean;
  } {
    const evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL');
    const evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
    
    return {
      configured: !!evolutionApiUrl && !!evolutionApiKey,
      baseUrl: evolutionApiUrl,
      hasApiKey: !!evolutionApiKey
    };
  }
}
