import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/ProductForm';
import { ProductsList } from '@/components/ProductsList';
import { DeleteProductDialog } from '@/components/DeleteProductDialog';
import { EditProductDialog } from '@/components/EditProductDialog';
import { useProducts, Product } from '@/hooks/useProducts';
import { deleteVectorRecord } from '@/services/vectorDatabaseService';
import { ProdutosPendentes } from '@/components/ProdutosPendentes';
import { supabase } from '@/config/supabase';



export function PaginaProdutos() {
  const { toast } = useToast();
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, isLoading, error, refetch } = useProducts();

  const handleCadastrarProduto = () => {
    // Apenas abre o modal - webhook será enviado apenas no botão Confirmar
    setIsProductFormOpen(true);
  };

  const handleProductCreated = () => {
    // Recarregar a lista de produtos após cadastro
    refetch();
    toast({
      title: "Produto Cadastrado!",
      description: "O produto foi adicionado com sucesso ao catálogo.",
    });
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleProductUpdated = () => {
    // Callback após produto ser atualizado via webhook
    toast({
      title: "Dados Enviados!",
      description: "As informações do produto foram enviadas para atualização.",
    });
  };

  const handleDeleteProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsDeleteDialogOpen(true);
    }
  };

  // Função para enviar webhook de exclusão
  const sendDeleteWebhook = async (productId: number) => {
    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_CRUD_PRODUTOS;
      
      if (!webhookUrl) {
        console.error('VITE_WEBHOOK_CRUD_PRODUTOS não está definida no arquivo .env');
        return;
      }
      
      const payload = {
        "crud_function": "deletar",
        "product_id": productId
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Erro ao enviar webhook de exclusão:', error);
      // Não interrompe o fluxo principal mesmo se o webhook falhar
    }
  };

  const handleConfirmDelete = async (productId: number) => {
    try {
      console.log(`🗑️ [PaginaProdutos] Iniciando exclusão sincronizada do produto ID: ${productId}`);

      // Buscar o produto para obter informações
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        toast({
          title: "Erro",
          description: "Produto não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // ETAPA 1: Excluir da tabela produtos_docs usando o mesmo ID
      console.log('🔄 Excluindo registro da tabela produtos_docs...', { 
        id: productId
      });

      const { error: deleteDocsError } = await supabase
        .from('produtos_docs')
        .delete()
        .eq('id', productId);

      if (deleteDocsError) {
        console.error('❌ Erro ao excluir da tabela produtos_docs:', deleteDocsError);
        toast({
          title: "Erro ao excluir produto",
          description: "Não foi possível excluir os dados de vetorização associados.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Registro excluído com sucesso da tabela produtos_docs');

      // ETAPA 2: Excluir da tabela produtos
      const { error: deleteProductError } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productId);

      if (deleteProductError) {
        console.error('❌ Erro ao excluir da tabela produtos:', deleteProductError);
        toast({
          title: "Erro ao excluir produto",
          description: "Não foi possível excluir o produto do catálogo.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Produto excluído com sucesso da tabela produtos');

      // Atualizar a lista de produtos
      refetch();

      toast({
        title: "Produto Excluído!",
        description: `${product.name || product.nome} e seus dados de vetorização foram removidos com sucesso.`,
        duration: 5000,
      });

      console.log(`🎉 [PaginaProdutos] Exclusão sincronizada concluída para produto ID: ${productId}`);

    } catch (error) {
      console.error('❌ [PaginaProdutos] Erro na exclusão sincronizada:', error);
      toast({
        title: "Erro ao Excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <Package className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Página de Produtos</h1>
          <p className="text-muted-foreground">Gerencie produtos cadastrados e confirmações da IA</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="cadastrar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cadastrar">Cadastrar Novos Produtos</TabsTrigger>
          <TabsTrigger value="confirmacao">Produtos Extraídos pela IA (Confirmação)</TabsTrigger>
        </TabsList>

        {/* Aba: Cadastrar Novos Produtos */}
        <TabsContent value="cadastrar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Cadastrar Novos Produtos</span>
              </CardTitle>
              <CardDescription>
                Adicione novos produtos ao seu catálogo manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCadastrarProduto} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Cadastrar Novos Produtos</span>
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Produtos do Banco de Dados */}
          <ProductsList 
            products={products}
            isLoading={isLoading}
            error={error}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        </TabsContent>

        {/* Aba: Produtos Extraídos pela IA */}
        <TabsContent value="confirmacao" className="space-y-6">
          <ProdutosPendentes />
        </TabsContent>
      </Tabs>

      {/* Modal do Formulário de Produto */}
      <ProductForm
        open={isProductFormOpen}
        onOpenChange={setIsProductFormOpen}
        onProductCreated={handleProductCreated}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteProductDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        product={selectedProduct}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Dialog de Edição de Produto */}
      <EditProductDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
}
