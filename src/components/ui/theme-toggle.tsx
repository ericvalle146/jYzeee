import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 h-9 rounded-lg transition-all duration-smooth hover:bg-accent hover:shadow-soft"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] shadow-medium">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="cursor-pointer transition-colors hover:bg-accent"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Modo Claro</span>
          {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="cursor-pointer transition-colors hover:bg-accent"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Modo Escuro</span>
          {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="cursor-pointer transition-colors hover:bg-accent"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
          {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Versão simplificada com apenas toggle (alternativa)
export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      className="w-9 h-9 rounded-lg transition-all duration-smooth hover:bg-accent"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
