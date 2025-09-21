import React from 'react';
import { Button } from '@/components/ui/button';
import { MenuExtractor } from '@/components/MenuExtractor';
import { Plus, Search, Filter } from 'lucide-react';

const Produtos = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Gerenciamento de Produtos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu catálogo completo de produtos e serviços
          </p>
        </div>
        
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-smooth"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Menu Extractor */}
      <MenuExtractor />

      {/* Coming Soon */}
      <div className="glass-card rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Mais Funcionalidades</h3>
        <p className="text-muted-foreground">
          Catálogo de produtos, gestão de estoque e outras funcionalidades estão sendo desenvolvidas.
        </p>
      </div>
    </div>
  );
};

export default Produtos;