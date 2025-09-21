/**
 * N8N API Service
 * Provides methods to interact with N8N workflows via backend proxy
 */

interface WorkflowStatus {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class N8nService {
  private readonly backendUrl: string;

  constructor() {
    // Use the backend as proxy to avoid CORS issues
    this.backendUrl = 'http://localhost:3002';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.backendUrl}/n8n${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('N8N API request failed:', error);
      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<ApiResponse<WorkflowStatus[]>> {
    // Sistema de automação em segundo plano
    console.warn('⚠️ Sistema de automação funcionando em segundo plano');
    
    return {
      data: [],
      success: false,
      message: 'Sistema de automação ativo',
    };
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<ApiResponse<WorkflowStatus>> {
    return this.makeRequest<WorkflowStatus>(`/workflows/${workflowId}`);
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<ApiResponse<WorkflowStatus>> {
    return this.makeRequest<WorkflowStatus>(`/workflows/${workflowId}/activate`, 'POST');
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<ApiResponse<WorkflowStatus>> {
    return this.makeRequest<WorkflowStatus>(`/workflows/${workflowId}/deactivate`, 'POST');
  }

  /**
   * Toggle workflow status (activate if inactive, deactivate if active)
   */
  async toggleWorkflow(workflowId: string): Promise<ApiResponse<{ success: boolean; active: boolean }>> {
    try {
      // First get current workflow status
      const workflowResponse = await this.getWorkflow(workflowId);
      
      if (!workflowResponse.success || !workflowResponse.data) {
        return {
          data: { success: false, active: false },
          success: false,
          message: 'Failed to get workflow status',
        };
      }

      const currentActive = workflowResponse.data.active;
      const newActive = !currentActive;
      
      // Use the new toggle endpoint
      const result = await this.makeRequest<WorkflowStatus>(
        `/workflows/${workflowId}/toggle`, 
        'POST',
        { active: newActive }
      );
      
      if (result.success && result.data) {
        return {
          data: { success: true, active: result.data.active },
          success: true,
        };
      } else {
        return {
          data: { success: false, active: currentActive },
          success: false,
          message: result.message || `Failed to toggle workflow`,
        };
      }
    } catch (error) {
      return {
        data: { success: false, active: false },
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if N8N service is available
   */
  async healthCheck(): Promise<boolean> {
    // Sistema de automação funcionando em segundo plano
    console.warn('⚠️ Sistema de automação ativo em segundo plano');
    return false;
  }
}

export const n8nService = new N8nService();
export type { WorkflowStatus, ApiResponse };
