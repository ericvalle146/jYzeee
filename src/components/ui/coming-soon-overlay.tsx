import React from 'react';
import { Clock, Zap, Star } from 'lucide-react';

interface ComingSoonOverlayProps {
  children: React.ReactNode;
  enabled?: boolean;
  title?: string;
  subtitle?: string;
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({
  children,
  enabled = true,
  title = "Em breve",
  subtitle = "Esta funcionalidade estará disponível em breve!"
}) => {
  return <>{children}</>;
};
