import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  Bot, 
  BookOpen,
  Menu,
  X,
  Zap,
  Link as LinkIcon
} from 'lucide-react';

const navigation = [
  { name: 'Início', href: '/', icon: LayoutDashboard },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/pedidos', icon: Package },
  { name: 'Integrações', href: '/integracoes', icon: LinkIcon },
  { name: 'Chat Assistente', href: '/chat', icon: MessageSquare },
  { name: 'Agente', href: '/agente', icon: Bot },
  { name: 'Documentação', href: '/documentacao', icon: BookOpen },
];

interface NavigationProps {
  className?: string;
  mobile?: boolean;
  onItemClick?: () => void;
}

export function Navigation({ className, mobile = false, onItemClick }: NavigationProps) {
  const location = useLocation();

  return (
    <nav className={cn('space-y-1', className)}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-smooth',
              isActive
                ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              mobile && 'justify-center px-4 py-3'
            )}
          >
            <Icon className={cn('flex-shrink-0 h-5 w-5', mobile ? 'mx-auto' : 'mr-3')} />
            {!mobile && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

interface MobileNavigationProps {
  open: boolean;
  onToggle: () => void;
}

export function MobileNavigation({ open, onToggle }: MobileNavigationProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 left-0 w-72 bg-card border-r shadow-strong">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg gradient-text">JYZE.AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={onToggle}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <Navigation onItemClick={onToggle} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}