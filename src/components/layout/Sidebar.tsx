import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';

export function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-grow bg-card border-r border-border shadow-soft">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="relative">
            {/* Container com degradê para tema escuro */}
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-slate-800/30 dark:via-slate-700/20 dark:to-transparent rounded-xl blur-sm scale-110 opacity-60"></div>
            
            {/* Container com degradê para tema claro */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/40 via-slate-50/30 to-transparent dark:from-transparent dark:via-transparent dark:to-transparent rounded-xl blur-sm scale-110 opacity-50"></div>
            
            {/* Logo container principal */}
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-background/80 via-card/60 to-transparent backdrop-blur-sm border border-border/30 flex items-center justify-center shadow-lg">
              <img 
                src="/logo_preto_dominante.png" 
                alt="JYZE.AI Logo" 
                className="h-9 w-9 object-contain dark:block hidden drop-shadow-sm"
              />
              <img 
                src="/logo_branco_dominante.png" 
                alt="JYZE.AI Logo" 
                className="h-9 w-9 object-contain dark:hidden block drop-shadow-sm"
              />
            </div>
          </div>
          <span className="ml-3 font-bold text-xl gradient-text horror-element">
            JYZE.AI
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 px-4 py-6 space-y-1">
            <Navigation />
          </div>

        </div>
      </div>
    </div>
  );
}