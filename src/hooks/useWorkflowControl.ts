import { useState, useEffect, useCallback } from 'react';
import { n8nService, type WorkflowStatus } from '../services/n8nService';

interface UseWorkflowControlReturn {
  workflows: WorkflowStatus[];
  loading: boolean;
  error: string | null;
  isN8nConnected: boolean;
  refreshWorkflows: () => Promise<void>;
  toggleWorkflow: (workflowId: string) => Promise<boolean>;
  getWorkflowStatus: (workflowId: string) => WorkflowStatus | undefined;
}

export const useWorkflowControl = (): UseWorkflowControlReturn => {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isN8nConnected, setIsN8nConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const connected = await n8nService.healthCheck();
      setIsN8nConnected(connected);
      return connected;
    } catch (err) {
      setIsN8nConnected(false);
      return false;
    }
  }, []);

  const refreshWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const connected = await checkConnection();
      if (!connected) {
        setError('N8N service is not available');
        setWorkflows([]);
        return;
      }

      const response = await n8nService.getWorkflows();
      
      if (response.success && response.data) {
        setWorkflows(response.data);
      } else {
        setError(response.message || 'Failed to fetch workflows');
        setWorkflows([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [checkConnection]);

  const toggleWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      const response = await n8nService.toggleWorkflow(workflowId);
      
      if (response.success && response.data) {
        // Update local state to reflect the change
        setWorkflows(prev => 
          prev.map(workflow => 
            workflow.id === workflowId 
              ? { ...workflow, active: response.data.active }
              : workflow
          )
        );
        
        return true;
      } else {
        setError(response.message || 'Failed to toggle workflow');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  }, []);

  const getWorkflowStatus = useCallback((workflowId: string): WorkflowStatus | undefined => {
    return workflows.find(workflow => workflow.id === workflowId);
  }, [workflows]);

  // Initial load
  useEffect(() => {
    refreshWorkflows();
  }, [refreshWorkflows]);

  // Periodic health check (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    workflows,
    loading,
    error,
    isN8nConnected,
    refreshWorkflows,
    toggleWorkflow,
    getWorkflowStatus,
  };
};
