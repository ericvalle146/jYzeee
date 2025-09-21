import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MobileNavigation } from '@/components/ui/navigation';
import { WorkflowControl } from '@/components/ui/workflow-control';
import { GlobalAutoPrintControl } from '@/components/GlobalAutoPrintControl';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Bell, User, Zap } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-[10px] z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 py-3.5 md:px-6 mt-0.5">
        {/* Logo */}
        <div className="flex items-center space-x-2">
        </div>


        {/* Actions */}
        <div className="flex items-center space-x-3 h-full">
          {/* Global Auto Print Control */}
          <div className="hidden lg:block">
            <GlobalAutoPrintControl />
          </div>

          {/* Workflow Control */}
          <div className="hidden sm:block">
            <WorkflowControl variant="compact" />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
          </Button>


          {/* Mobile menu */}
          <MobileNavigation 
            open={mobileMenuOpen} 
            onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} 
          />
        </div>
      </div>
    </header>
  );
}