import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
  trend?: ReactNode;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  iconColor = 'primary',
  className,
  trend
}: MetricCardProps) {
  const iconColorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10'
  };

  const changeColorClasses = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className={cn(
      'glass-card rounded-xl p-6 hover-lift transition-all duration-smooth',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mb-2">
            {value}
          </p>
          {change && (
            <p className={cn(
              'text-sm font-medium flex items-center',
              changeColorClasses[changeType]
            )}>
              {change}
            </p>
          )}
        </div>
        
        <div className={cn(
          'p-3 rounded-xl',
          iconColorClasses[iconColor]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 pt-4 border-t border-border">
          {trend}
        </div>
      )}
    </div>
  );
}