import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Switch } from './switch';
import { Badge } from './badge';
import { n8nService, WorkflowStatus } from '@/services/n8nService';

interface WorkflowControlProps {
  variant?: 'compact' | 'expanded';
}

export function WorkflowControl({ variant = 'compact' }: WorkflowControlProps) {
  // Componente oculto - funcionalidade mantida no backend
  return null;
}
