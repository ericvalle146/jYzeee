/**
 * INIT-01: Multi-Instance WhatsApp Service
 * 
 * Novo serviço que suporta múltiplas instâncias WhatsApp
 * Substitui o evolutionApiService para usar a nova arquitetura backend
 */

import { API_CONFIG } from '@/config/api';

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface HealthCheckResponse {
  totalInstances: number;
  connectedInstances: number;
  disconnectedInstances: number;
  instances: WhatsAppInstance[];
  apiConfiguration: {
    configured: boolean;
    baseUrl: string;
    hasApiKey: boolean;
  };
  serverTime: string;
}

class WhatsAppMultiInstanceService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BACKEND_API;
    console.log('🔧 WhatsApp Multi-Instance Service initialized with backend:', this.baseUrl);
  }

  /**
   * Make HTTP request to backend API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🔍 Making request to: ${url}`, {
      method: options.method || 'GET',
      endpoint
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error [${response.status}]:`, data);
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log(`✅ Request successful:`, data);
      return data;

    } catch (error) {
      console.error(`❌ Request failed:`, error);
      throw error;
    }
  }

  /**
   * INIT-02: Generate QR Code for specific client
   * Uses intelligent flow that checks status first
   */
  async generateQRCode(clientId: string): Promise<QRCodeResponse> {
    console.log(`📱 Generating QR Code for client: ${clientId}`);
    
    if (!clientId || clientId.trim() === '') {
      throw new Error('Client ID is required');
    }

    try {
      const response = await this.makeRequest<QRCodeResponse>('/whatsapp/qr-code', {
        method: 'POST',
        body: JSON.stringify({ clientId: clientId.trim() }),
      });

      if (response.success && response.data) {
        console.log(`✅ QR Code result for client ${clientId}:`, response.data.status);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate QR Code');
      }

    } catch (error) {
      console.error(`❌ Error generating QR Code for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Check status of specific client's WhatsApp instance
   */
  async checkInstanceStatus(clientId: string): Promise<InstanceStatusResponse> {
    console.log(`📊 Checking status for client: ${clientId}`);
    
    if (!clientId || clientId.trim() === '') {
      throw new Error('Client ID is required');
    }

    try {
      const response = await this.makeRequest<InstanceStatusResponse>(`/whatsapp/status/${clientId.trim()}`);

      if (response.success && response.data) {
        console.log(`✅ Status for client ${clientId}:`, response.data.status);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to check instance status');
      }

    } catch (error) {
      console.error(`❌ Error checking status for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active WhatsApp instances
   */
  async getAllInstances(): Promise<WhatsAppInstance[]> {
    console.log('📋 Retrieving all instances');

    try {
      const response = await this.makeRequest<WhatsAppInstance[]>('/whatsapp/instances');

      if (response.success && response.data) {
        console.log(`✅ Retrieved ${response.data.length} instances`);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to retrieve instances');
      }

    } catch (error) {
      console.error('❌ Error retrieving instances:', error);
      throw error;
    }
  }

  /**
   * Delete specific client's WhatsApp instance
   */
  async deleteInstance(clientId: string): Promise<{ success: boolean; message: string }> {
    console.log(`🗑️ Deleting instance for client: ${clientId}`);
    
    if (!clientId || clientId.trim() === '') {
      throw new Error('Client ID is required');
    }

    try {
      const response = await this.makeRequest(`/whatsapp/instance/${clientId.trim()}`, {
        method: 'DELETE',
      });

      console.log(`✅ Delete result for client ${clientId}:`, response.success);
      return {
        success: response.success,
        message: response.message
      };

    } catch (error) {
      console.error(`❌ Error deleting instance for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * INIT-04: Get health check information
   */
  async getHealthCheck(): Promise<HealthCheckResponse> {
    console.log('🏥 Performing health check');

    try {
      const response = await this.makeRequest<HealthCheckResponse>('/whatsapp/health');

      if (response.success && response.data) {
        console.log(`✅ Health check completed - ${response.data.connectedInstances}/${response.data.totalInstances} instances connected`);
        return response.data;
      } else {
        throw new Error(response.message || 'Health check failed');
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get API configuration status
   */
  async getConfigStatus(): Promise<{
    configured: boolean;
    baseUrl: string;
    hasApiKey: boolean;
  }> {
    console.log('⚙️ Checking API configuration');

    try {
      const response = await this.makeRequest('/whatsapp/config');

      if (response.data) {
        console.log('✅ Configuration status retrieved:', response.data.configured);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to check configuration');
      }

    } catch (error) {
      console.error('❌ Error checking configuration:', error);
      throw error;
    }
  }

  /**
   * Trigger manual health check via monitoring service
   */
  async triggerHealthCheck(): Promise<HealthCheckResponse> {
    console.log('🔍 Triggering manual health check');

    try {
      const response = await this.makeRequest<HealthCheckResponse>('/monitoring/health-check', {
        method: 'POST',
      });

      if (response.success && response.data) {
        console.log('✅ Manual health check completed');
        return response.data;
      } else {
        throw new Error(response.message || 'Manual health check failed');
      }

    } catch (error) {
      console.error('❌ Manual health check failed:', error);
      throw error;
    }
  }

  /**
   * Test alert system
   */
  async testAlertSystem(): Promise<{ message: string }> {
    console.log('🧪 Testing alert system');

    try {
      const response = await this.makeRequest('/monitoring/test-alert', {
        method: 'POST',
      });

      if (response.success) {
        console.log('✅ Test alert sent successfully');
        return response.data || { message: 'Test alert sent' };
      } else {
        throw new Error(response.message || 'Failed to send test alert');
      }

    } catch (error) {
      console.error('❌ Failed to test alert system:', error);
      throw error;
    }
  }

  /**
   * Get monitoring status
   */
  async getMonitoringStatus(): Promise<{
    isActive: boolean;
    alertChannelsCount: number;
    trackedInstances: number;
    healthHistorySize: number;
  }> {
    console.log('📊 Getting monitoring status');

    try {
      const response = await this.makeRequest('/monitoring/status');

      if (response.success && response.data) {
        console.log('✅ Monitoring status retrieved');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get monitoring status');
      }

    } catch (error) {
      console.error('❌ Error getting monitoring status:', error);
      throw error;
    }
  }
}

export const whatsappMultiInstanceService = new WhatsAppMultiInstanceService();
export default whatsappMultiInstanceService;
