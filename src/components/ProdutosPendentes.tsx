import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/config/supabase';

// Tipo para os produtos pendentes (baseado na estrutura real da tabela)
interface ProdutoPendente {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  composicao: string;
  tamanho: string;
}

export function ProdutosPendentes() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<ProdutoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  // Buscar produtos pendentes do Supabase
  const buscarProdutosPendentes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('produtos_pendentes')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos pendentes:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar os produtos pendentes.",
          variant: "destructive",
        });
        return;
      }

      setProdutos(data || []);
      
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro de conexão",
        description: "Erro ao conectar com o banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Aprovar produto - Enviar id e função "AceitarProdutos" para webhook
  const aprovarProduto = async (produto: ProdutoPendente) => {
    try {
      setProcessando(produto.id.toString());

      // Obter URL do webhook da variável de ambiente
      const webhookUrl = import.meta.env.VITE_WEBHOOK_CRUD_PRODUTOS;
      
      if (!webhookUrl) {
        console.error('VITE_WEBHOOK_CRUD_PRODUTOS não encontrado nas variáveis de ambiente');
        toast({
          title: "Erro de configuração",
          description: "Webhook não configurado. Contate o suporte técnico.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Enviando aprovação para webhook...');

      // Construir payload conforme especificação
      const payload = {
        id: produto.id,
        crud_function: "AceitarProdutos"
      };

      // Enviar requisição POST para o webhook
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('❌ Erro no webhook:', {
          status: webhookResponse.status,
          response: errorText
        });
        
        toast({
          title: "Erro na aprovação",
          description: `Falha no webhook: ${webhookResponse.status}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Produto aprovado via webhook');

      // Remover da lista local após sucesso
      setProdutos(prev => prev.filter(p => p.id !== produto.id));

      const nomeClean = produto.nome.replace(/^"nome:\s*/, '').replace(/"$/, '');
      toast({
        title: "Produto aprovado!",
        description: `${nomeClean} foi aprovado e processado.`,
      });

    } catch (error) {
      console.error('❌ Erro na aprovação:', error);
      toast({
        title: "Erro na aprovação",
        description: error instanceof Error ? error.message : "Erro inesperado ao aprovar produto.",
        variant: "destructive",
      });
    } finally {
      setProcessando(null);
    }
  };

  // Rejeitar produto - Excluir produto pendente da tabela produtos_pendentes
  const rejeitarProduto = async (produto: ProdutoPendente) => {
    try {
      setProcessando(produto.id.toString());

      console.log('🔄 Rejeitando produto pendente...');

      // Usar conexão Supabase para excluir da tabela produtos_pendentes
      const { error } = await supabase
        .from('produtos_pendentes')
        .delete()
        .eq('id', produto.id);

      // Verificar se houve erro na exclusão
      if (error) {
        console.error('❌ Erro ao rejeitar produto:', error);
        toast({
          title: "Erro ao rejeitar produto",
          description: "Não foi possível excluir o produto pendente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Produto pendente rejeitado e removido do banco');

      // Remover da lista local após sucesso
      setProdutos(prev => prev.filter(p => p.id !== produto.id));

      const nomeClean = produto.nome.replace(/^"nome:\s*/, '').replace(/"$/, '');
      toast({
        title: "Produto rejeitado",
        description: `${nomeClean} foi rejeitado e removido da lista de pendentes.`,
      });

    } catch (error) {
      console.error('❌ Erro inesperado ao rejeitar produto:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao rejeitar o produto.",
        variant: "destructive",
      });
    } finally {
      setProcessando(null);
    }
  };

  // Carregar produtos ao montar o componente
  useEffect(() => {
    buscarProdutosPendentes();
  }, []);

  // Formatação de preço
  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Produtos Extraídos pela IA (Confirmação)</span>
          </CardTitle>
          <CardDescription>
            Confirme ou rejeite produtos identificados automaticamente pela IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando produtos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (produtos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Produtos Extraídos pela IA (Confirmação)</span>
          </CardTitle>
          <CardDescription>
            Confirme ou rejeite produtos identificados automaticamente pela IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto pendente de confirmação</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={buscarProdutosPendentes}
            >
              Atualizar Lista
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render produtos
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Produtos Extraídos pela IA (Confirmação)</span>
          </div>
          <Badge variant="secondary">{produtos.length} pendente(s)</Badge>
        </CardTitle>
        <CardDescription>
          Confirme ou rejeite produtos identificados automaticamente pela IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {produtos.map((produto) => {
            // Limpar os dados formatados
            const nomeClean = produto.nome.replace(/^"nome:\s*/, '').replace(/"$/, '');
            const categoriaClean = produto.categoria.replace(/^\s*categoria:\s*/, '');
            const composicaoClean = produto.composicao.replace(/^\s*composição:\s*/, '').replace(/"$/, '');
            const tamanhoClean = produto.tamanho.replace(/^\s*tamanho:\s*/, '');

            return (
              <div key={produto.id} className="border rounded-lg p-4 space-y-3">
                {/* Header do Card */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{nomeClean}</h4>
                    {composicaoClean && composicaoClean !== 'Não informado' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {composicaoClean}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatarPreco(produto.preco)}
                    </p>
                  </div>
                </div>

                {/* Metadados */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{categoriaClean}</Badge>
                  {tamanhoClean && tamanhoClean !== 'Não informado' && (
                    <Badge variant="secondary" className="text-xs">
                      📏 {tamanhoClean}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    🆔 ID: {produto.id}
                  </Badge>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejeitarProduto(produto)}
                    disabled={processando === produto.id.toString()}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {processando === produto.id.toString() ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => aprovarProduto(produto)}
                    disabled={processando === produto.id.toString()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processando === produto.id.toString() ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Aprovar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de atualizar */}
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={buscarProdutosPendentes}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Atualizar Lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
