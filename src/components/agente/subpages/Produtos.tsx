import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuExtractor } from '@/components/MenuExtractor';
import { Plus, Save, Search, Filter, Edit, Trash2, Upload, Eye } from 'lucide-react';

export function Produtos() {
  const [produtoAtivo, setProdutoAtivo] = useState(true);

  const produtos = [
    {
      id: 1,
      nome: 'Pizza Margherita',
      preco: 'R$ 35,90',
      categoria: 'Pizzas',
      status: 'ativo',
      estoque: 50
    },
    {
      id: 2,
      nome: 'Hambúrguer Artesanal',
      preco: 'R$ 28,50',
      categoria: 'Lanches',
      status: 'ativo',
      estoque: 30
    },
    {
      id: 3,
      nome: 'Refrigerante Lata',
      preco: 'R$ 4,50',
      categoria: 'Bebidas',
      status: 'inativo',
      estoque: 0
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Catálogo de Produtos
        </h2>
        <p className="text-muted-foreground">
          Gerencie todos os produtos e serviços do seu catálogo
        </p>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">Lista de Produtos</TabsTrigger>
          <TabsTrigger value="adicionar">Adicionar Produto</TabsTrigger>
          <TabsTrigger value="upload">Upload Inteligente</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Busca e Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Tabela de Produtos */}
          <div className="glass-card rounded-xl p-6">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>{produto.preco}</TableCell>
                      <TableCell>{produto.categoria}</TableCell>
                      <TableCell>{produto.estoque}</TableCell>
                      <TableCell>
                        <Badge variant={produto.status === 'ativo' ? 'default' : 'secondary'}>
                          {produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adicionar" className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold">Adicionar Novo Produto</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome-produto">Nome do Produto *</Label>
                  <Input
                    id="nome-produto"
                    placeholder="Ex: Pizza Margherita"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="preco-produto">Preço *</Label>
                  <Input
                    id="preco-produto"
                    placeholder="R$ 0,00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoria-produto">Categoria</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pizzas">Pizzas</SelectItem>
                      <SelectItem value="lanches">Lanches</SelectItem>
                      <SelectItem value="bebidas">Bebidas</SelectItem>
                      <SelectItem value="sobremesas">Sobremesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sku-produto">SKU (Código)</Label>
                  <Input
                    id="sku-produto"
                    placeholder="Ex: PIZ001"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="estoque-produto">Quantidade em Estoque</Label>
                  <Input
                    id="estoque-produto"
                    type="number"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="descricao-produto">Descrição do Produto</Label>
                  <Textarea
                    id="descricao-produto"
                    placeholder="Descreva o produto..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ingredientes-produto">Ingredientes ou Componentes</Label>
                  <Textarea
                    id="ingredientes-produto"
                    placeholder="Liste os ingredientes..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="customizacoes-produto">Opções de Customização</Label>
                  <Textarea
                    id="customizacoes-produto"
                    placeholder="Ex: Tamanhos disponíveis, extras..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={produtoAtivo}
                    onCheckedChange={setProdutoAtivo}
                  />
                  <Label>Produto ativo</Label>
                </div>
              </div>
            </div>
            
            {/* Upload de Imagens */}
            <div>
              <Label>Imagens do Produto</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG. Máximo 5 imagens por produto.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Save className="mr-2 h-4 w-4" />
                Salvar Produto
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Upload Inteligente</h3>
            <p className="text-muted-foreground">
              Envie PDFs de cardápios ou imagens e extraia automaticamente os dados dos produtos
            </p>
            
            <MenuExtractor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}