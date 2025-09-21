const API_BASE_URL = 'https://api.jyze.space';

export interface AgentConfigData {
  nomeAgente?: string;
  tempoEntrega?: number;
  valorFrete?: number;
}

export interface ResponseTimeData {
  tempoResposta?: number;
}

export class AgentConfigAPI {
  static async saveAgentConfig(data: Partial<AgentConfigData>) {
    const response = await fetch(`${API_BASE_URL}/api/agent-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAgentConfig(): Promise<AgentConfigData> {
    const response = await fetch(`${API_BASE_URL}/api/agent-config`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAgentConfigApiFormat(): Promise<{nomeAgente: string; tempoEntregaMinutos: number; valorFrete: number}> {
    const response = await fetch(`${API_BASE_URL}/api/agent-config/api-format`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async exportAgentConfig() {
    const response = await fetch(`${API_BASE_URL}/api/agent-config/export`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export class ResponseTimeAPI {
  static async saveResponseTime(data: Partial<ResponseTimeData>) {
    const response = await fetch(`${API_BASE_URL}/api/response-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async getResponseTime(): Promise<ResponseTimeData> {
    const response = await fetch(`${API_BASE_URL}/api/response-time`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async exportResponseTime() {
    const response = await fetch(`${API_BASE_URL}/api/response-time/export`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
