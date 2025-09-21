interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

interface QRCodeResponse {
  base64: string;
  code: string;
}

interface InstanceStatus {
  instance: {
    instanceName: string;
    status: 'open' | 'close' | 'connecting';
  };
}

interface CreateInstanceRequest {
  instanceName: string;
  integration?: 'WHATSAPP-BAILEYS';
  qrcode: boolean;
}

interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

class EvolutionApiService {
  private config: EvolutionApiConfig;

  constructor() {
    console.log('🔍 DEBUG: Inicializando EvolutionApiService');
    
    this.config = {
      baseUrl: import.meta.env.VITE_EVOLUTION_API_URL || '',
      apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '',
      instanceName: import.meta.env.VITE_WHATSAPP_INSTANCE_NAME || 'JyzeCliente',
    };

    console.log('🔍 DEBUG: Configuração Evolution API:', {
      baseUrl: this.config.baseUrl || 'NÃO DEFINIDA',
      apiKey: this.config.apiKey ? 'DEFINIDA' : 'NÃO DEFINIDA',
      instanceName: this.config.instanceName,
    });

    if (!this.config.baseUrl) {
      console.error('❌ ERRO: VITE_EVOLUTION_API_URL não está configurada no arquivo .env');
    }
    if (!this.config.apiKey) {
      console.error('❌ ERRO: VITE_EVOLUTION_API_KEY não está configurada no arquivo .env');
    }
  }

  private getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.config.apiKey,
    };
    
    console.log('🔍 DEBUG: Headers preparados:', {
      'Content-Type': headers['Content-Type'],
      'apikey': headers.apikey ? `${headers.apikey.substring(0, 8)}...` : 'NÃO DEFINIDA'
    });
    
    return headers;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    console.log('🔍 DEBUG: Fazendo requisição para:', url);
    console.log('🔍 DEBUG: Método:', options.method || 'GET');
    console.log('🔍 DEBUG: Headers:', this.getHeaders());
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      console.log('🔍 DEBUG: Status da resposta:', response.status);
      console.log('🔍 DEBUG: Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ERRO: Resposta da API:', errorText);
        console.error('❌ ERRO: Status:', response.status);
        console.error('❌ ERRO: Status Text:', response.statusText);
        
        // Tentar parsear o erro como JSON para melhor diagnóstico
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ ERRO: Detalhes do erro (JSON):', errorJson);
          
          if (errorJson.response && errorJson.response.message) {
            throw new Error(`Evolution API Error: ${response.status} - ${errorJson.response.message.join(', ')}`);
          }
        } catch (parseError) {
          console.log('⚠️ DEBUG: Erro não é JSON válido, usando texto original');
        }
        
        throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ DEBUG: Dados recebidos:', data);
      return data;
    } catch (error) {
      console.error('❌ ERRO: Erro na requisição:', error);
      throw error;
    }
  }

  // Criar uma nova instância
  async createInstance(): Promise<CreateInstanceResponse> {
    console.log('🔍 DEBUG: Criando nova instância...');
    console.log('🔍 DEBUG: Nome da instância:', this.config.instanceName);
    
    // Tentar primeiro sem o campo integration (formato mais simples)
    let requestData: CreateInstanceRequest = {
      instanceName: this.config.instanceName,
      qrcode: true,
    };

    console.log('🔍 DEBUG: Payload da requisição (tentativa 1 - sem integration):', requestData);
    
    try {
      return await this.makeRequest<CreateInstanceResponse>('/instance/create', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } catch (error) {
      console.log('⚠️ DEBUG: Primeira tentativa falhou, tentando com integration: WHATSAPP-BAILEYS');
      
      // Se falhar, tentar com integration: WHATSAPP-BAILEYS
      requestData = {
        instanceName: this.config.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      };

      console.log('🔍 DEBUG: Payload da requisição (tentativa 2 - com WHATSAPP-BAILEYS):', requestData);
      
      return this.makeRequest<CreateInstanceResponse>('/instance/create', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    }
  }

  // Obter QR Code da instância (reiniciando se necessário)
  async getQRCode(): Promise<QRCodeResponse> {
    console.log('🔍 DEBUG: Solicitando QR Code...');
    
    try {
      // Primeiro, tentar reiniciar a instância para forçar novo QR Code
      console.log('🔍 DEBUG: Reiniciando instância para gerar novo QR Code...');
      const restartResponse = await this.makeRequest<any>(`/instance/restart/${this.config.instanceName}`, {
        method: 'PUT',
      });
      
      console.log('🔍 DEBUG: Resposta do restart:', restartResponse);
      
      // Verificar se o restart retornou QR Code diretamente
      let base64String = this.extractQRCodeFromResponse(restartResponse);
      
      if (base64String) {
        console.log('✅ DEBUG: QR Code obtido diretamente do restart');
        return { base64: base64String, code: base64String };
      }
      
      // Se não obteve QR Code do restart, tentar endpoints específicos
      console.log('🔍 DEBUG: QR Code não retornado no restart, tentando endpoints específicos...');
      
      const endpoints = [
        `/instance/connect/${this.config.instanceName}`,
        `/instance/${this.config.instanceName}/connect`,
        `/instance/qrcode/${this.config.instanceName}`,
        `/instance/${this.config.instanceName}/qrcode`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 DEBUG: Tentando endpoint: ${endpoint}`);
          const response = await this.makeRequest<any>(endpoint);
          
          console.log('🔍 DEBUG: Resposta completa:', response);
          
          base64String = this.extractQRCodeFromResponse(response);
          
          if (base64String) {
            console.log('✅ DEBUG: QR Code encontrado no endpoint:', endpoint);
            return { base64: base64String, code: base64String };
          } else {
            console.log('⚠️ DEBUG: QR Code não encontrado, tentando próximo endpoint...');
          }
        } catch (error) {
          console.log(`⚠️ DEBUG: Endpoint ${endpoint} falhou:`, error);
          continue;
        }
      }
      
      console.error('❌ ERRO: QR Code não encontrado em nenhum endpoint após restart');
      throw new Error('QR Code não encontrado. A instância pode estar conectada ou em estado inválido.');
      
    } catch (error) {
      console.error('❌ ERRO: Falha ao reiniciar instância:', error);
      throw new Error(`Erro ao gerar QR Code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Método auxiliar para extrair QR Code de diferentes estruturas de resposta
  private extractQRCodeFromResponse(response: any): string | null {
    console.log('🔍 DEBUG: Extraindo QR Code da resposta...');
    console.log('🔍 DEBUG: Estrutura da resposta:', Object.keys(response));
    
    if (response.base64) {
      console.log('✅ DEBUG: QR Code encontrado em response.base64');
      return response.base64;
    } else if (response.qrcode?.base64) {
      console.log('✅ DEBUG: QR Code encontrado em response.qrcode.base64');
      return response.qrcode.base64;
    } else if (response.instance?.qrcode?.base64) {
      console.log('✅ DEBUG: QR Code encontrado em response.instance.qrcode.base64');
      return response.instance.qrcode.base64;
    } else if (response.instance?.qrCode) {
      console.log('✅ DEBUG: QR Code encontrado em response.instance.qrCode');
      return response.instance.qrCode;
    } else if (response.qrCode) {
      console.log('✅ DEBUG: QR Code encontrado em response.qrCode');
      return response.qrCode;
    }
    
    console.log('⚠️ DEBUG: QR Code não encontrado na estrutura da resposta');
    return null;
  }

  // Verificar status da instância
  async getInstanceStatus(): Promise<InstanceStatus> {
    return this.makeRequest<InstanceStatus>(`/instance/connectionState/${this.config.instanceName}`);
  }

  // Reconectar instância
  async reconnectInstance(): Promise<QRCodeResponse> {
    return this.makeRequest<QRCodeResponse>(`/instance/restart/${this.config.instanceName}`, {
      method: 'PUT',
    });
  }

  // Deletar instância
  async deleteInstance(): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(`/instance/delete/${this.config.instanceName}`, {
      method: 'DELETE',
    });
  }

  // Verificar se a instância existe
  async instanceExists(): Promise<boolean> {
    try {
      await this.getInstanceStatus();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obter informações da instância
  async getInstanceInfo(): Promise<any> {
    return this.makeRequest<any>(`/instance/fetchInstances?instanceName=${this.config.instanceName}`);
  }

  // Configurações atuais
  getConfig() {
    return {
      ...this.config,
      apiKey: this.config.apiKey ? '***' : '', // Mascarar API key para logs
    };
  }
}

export const evolutionApiService = new EvolutionApiService();
export type { EvolutionApiConfig, QRCodeResponse, InstanceStatus, CreateInstanceResponse };
