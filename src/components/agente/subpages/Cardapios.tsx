import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Menu, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/config/supabase';

// Tipo para os cardápios
interface Cardapio {
  id: number;
  nome: string;
  link: string;
}

export function Cardapios() {
  const { toast } = useToast();
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  // Buscar cardápios do Supabase
  const buscarCardapios = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cardapios')
        .select('id, nome, link')
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cardápios:', error);
        toast({
          title: "Erro ao carregar cardápios",
          description: "Não foi possível carregar os cardápios.",
          variant: "destructive",
        });
        return;
      }

      setCardapios(data || []);
      
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

  // Carregar cardápios ao montar o componente
  useEffect(() => {
    buscarCardapios();
  }, []);

  // Função de excluir cardápio - Exclusão sincronizada de ambas as tabelas
  const excluirCardapio = async (cardapio: Cardapio) => {
    try {
      setProcessando(cardapio.id.toString());
      console.log(`🗑️ [Cardapios] Iniciando exclusão sincronizada do cardápio ID: ${cardapio.id}`);

      // ETAPA 1: Excluir da tabela cardapio_docs (PRIORIDADE)
      console.log('🔄 Excluindo registro da tabela cardapio_docs...', { id: cardapio.id });
      const { error: deleteDocsError } = await supabase
        .from('cardapio_docs')
        .delete()
        .eq('id', cardapio.id);

      if (deleteDocsError) {
        console.error('❌ Erro ao excluir da tabela cardapio_docs:', deleteDocsError);
        toast({
          title: "Erro ao excluir cardápio",
          description: "Não foi possível excluir os documentos de vetorização associados.",
          variant: "destructive",
        });
        return;
      }
      console.log('✅ Registro excluído com sucesso da tabela cardapio_docs');

      // ETAPA 2: Excluir da tabela cardapios
      console.log('🔄 Excluindo registro da tabela cardapios...', { id: cardapio.id });
      const { error: deleteCardapioError } = await supabase
        .from('cardapios')
        .delete()
        .eq('id', cardapio.id);

      if (deleteCardapioError) {
        console.error('❌ Erro ao excluir da tabela cardapios:', deleteCardapioError);
        toast({
          title: "Erro ao excluir cardápio",
          description: "Não foi possível excluir o cardápio do catálogo.",
          variant: "destructive",
        });
        return;
      }
      console.log('✅ Cardápio excluído com sucesso da tabela cardapios');

      // ETAPA 3: Atualizar a interface (remover da lista local)
      setCardapios(prev => prev.filter(c => c.id !== cardapio.id));
      console.log(`🎉 [Cardapios] Exclusão sincronizada concluída para cardápio ID: ${cardapio.id}`);

      toast({
        title: "Cardápio excluído!",
        description: `${cardapio.nome} e seus dados de vetorização foram removidos com sucesso.`,
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ [Cardapios] Erro na exclusão sincronizada:', error);
      toast({
        title: "Erro ao excluir cardápio",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setProcessando(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Menu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cardápios</h1>
            <p className="text-muted-foreground">Gerencie os cardápios do estabelecimento</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cardápios</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os cardápios cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando cardápios...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <Menu className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cardápios</h1>
          <p className="text-muted-foreground">Gerencie os cardápios do estabelecimento</p>
        </div>
      </div>

      {/* Lista de Cardápios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Cardápios</span>
            {cardapios.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {cardapios.length} cardápio(s) encontrado(s)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todos os cardápios cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cardapios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Menu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cardápio encontrado</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={buscarCardapios}
              >
                Atualizar Lista
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cardapios.map((cardapio) => (
                <Card key={cardapio.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Nome do Cardápio */}
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-lg truncate" title={cardapio.nome}>
                        {cardapio.nome}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {cardapio.id}
                      </p>
                    </div>

                    {/* Imagem do Cardápio */}
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={cardapio.link}
                        alt={cardapio.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Ações */}
                    <div className="p-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => excluirCardapio(cardapio)}
                        disabled={processando === cardapio.id.toString()}
                        className="w-full"
                      >
                        {processando === cardapio.id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {processando === cardapio.id.toString() ? 'Excluindo...' : 'Excluir Cardápio'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Botão de atualizar */}
          {cardapios.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={buscarCardapios}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Menu className="h-4 w-4 mr-2" />
                )}
                Atualizar Lista
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
