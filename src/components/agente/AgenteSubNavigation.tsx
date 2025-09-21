import React from 'react';
import { cn } from '@/lib/utils';
import { Settings, Package, ScanLine, Menu } from 'lucide-react';

const subPages = [
  { id: 'configuracao', name: 'Configuração do Agente', icon: Settings },
  { id: 'produtos', name: 'Página de Produtos', icon: Package },
  { id: 'extracao', name: 'Extração', icon: ScanLine },
  { id: 'cardapios', name: 'Cardápios', icon: Menu },
];

interface AgenteSubNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function AgenteSubNavigation({ activeTab, onTabChange, className }: AgenteSubNavigationProps) {
  return (
    <aside className={cn("w-48 bg-card/50 border-l border-border p-4", className)}>
      <nav className="space-y-2">
        {subPages.map((page) => {
          const Icon = page.icon;
          const isActive = activeTab === page.id;
          
          return (
            <button
              key={page.id}
              onClick={() => onTabChange(page.id)}
              className={cn(
                "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-smooth",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{page.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}