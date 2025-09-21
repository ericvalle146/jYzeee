import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Loader2, AlertCircle, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface ProductsListProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: number) => void;
}

export function ProductsList({ products, isLoading, error, onEditProduct, onDeleteProduct }: ProductsListProps) {
  // Formatação de preço em reais
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Componente de loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Produtos da Loja</span>
          </CardTitle>
          <CardDescription>
            Carregando produtos cadastrados no sistema...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Componente de erro
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Produtos da Loja</span>
          </CardTitle>
          <CardDescription>
            Erro ao carregar produtos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-medium text-red-700">Erro ao carregar produtos</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lista vazia
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Produtos da Loja</span>
          </CardTitle>
          <CardDescription>
            Produtos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Package className="h-12 w-12 text-muted-foreground opacity-50" />
              <div>
                <p className="font-medium text-muted-foreground">Nenhum produto cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use o botão "Cadastrar Novo Produto" para adicionar produtos ao catálogo
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lista de produtos
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Produtos da Loja</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Todos os produtos cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((produto) => (
            <div 
              key={produto.id} 
              className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1A1C23] rounded-lg p-6 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Informações principais */}
                <div className="lg:col-span-8 space-y-3">
                  {/* Cabeçalho do produto */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{produto.nome}</h4>
                        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                          ID: {produto.id}
                        </Badge>
                      </div>
                      {produto.categoria && (
                        <p className="text-sm text-muted-foreground dark:text-gray-400 font-medium">
                          {produto.categoria}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detalhes do produto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {produto.composicao && (
                      <div>
                        <span className="text-muted-foreground dark:text-gray-400 font-medium">Composição:</span>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{produto.composicao}</p>
                      </div>
                    )}
                    {produto.tamanho && (
                      <div>
                        <span className="text-muted-foreground dark:text-gray-400 font-medium">Tamanho:</span>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{produto.tamanho}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preço e Ações */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center space-y-3">
                  {/* Preço */}
                  <div className="text-center lg:text-right">
                    <div className="flex items-center justify-center lg:justify-end space-x-1 text-2xl font-bold text-green-600 dark:text-green-400">
                      <DollarSign className="h-5 w-5" />
                      <span>{formatPrice(produto.preco)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Preço unitário</p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProduct?.(produto)}
                      className="flex items-center space-x-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteProduct?.(produto.id)}
                      className="flex items-center space-x-1 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-500 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Separador visual se houver campos opcionais */}
              {(produto.composicao || produto.tamanho) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {produto.composicao && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Com composição
                      </Badge>
                    )}
                    {produto.tamanho && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Tamanho definido
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
