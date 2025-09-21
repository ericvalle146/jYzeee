import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  actions
}: ChartCardProps) {
  return (
    <div className={cn(
      'glass-card rounded-xl p-6 hover-lift transition-all duration-smooth',
      className
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      <div className="w-full h-64">
        {children}
      </div>
    </div>
  );
}