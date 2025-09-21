import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, Eye, Edit, Trash2, Search, Save, Plus } from 'lucide-react';

export function Informacoes() {
  const [arquivos] = useState([
    {
      id: 1,
      nome: 'Cardápio Principal',
      tipo: 'PDF',
      descricao: 'Cardápio completo com todas as pizzas e bebidas',
      tags: ['menu', 'pizzas', 'bebidas'],
      status: 'ativo',
      data: '2024-01-15'
    },
    {
      id: 2,
      nome: 'Promoções Janeiro',
      tipo: 'Imagem',
      descricao: 'Banner promocional do mês de janeiro',
      tags: ['promocao', 'desconto'],
      status: 'ativo',
      data: '2024-01-10'
    },
    {
      id: 3,
      nome: 'Menu Sobremesas',
      tipo: 'PDF',
      descricao: 'Cardápio específico de sobremesas e doces',
      tags: ['menu', 'sobremesas'],
      status: 'inativo',
      data: '2023-12-20'
    }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Base de Conhecimento
        </h2>
        <p className="text-muted-foreground">
          Gerencie informações da empresa e indexe documentos para a IA
        </p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresa">Informações da Empresa</TabsTrigger>
          <TabsTrigger value="upload">Upload de Documentos</TabsTrigger>
          <TabsTrigger value="biblioteca">Biblioteca de Mídias</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold">Informações Gerais da Empresa</h3>
            <p className="text-sm text-muted-foreground">
              Estas informações serão usadas pela IA para responder perguntas sobre sua empresa
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sobre-empresa">Sobre a Empresa</Label>
                  <Textarea
                    id="sobre-empresa"
                    placeholder="Descreva sua empresa, história, missão..."
                    className="mt-1"
                    rows={5}
                    defaultValue="Pizzaria artesanal com mais de 10 anos de tradição. Especializada em pizzas com massa fermentada naturalmente e ingredientes frescos selecionados."
                  />
                </div>
                
                <div>
                  <Label htmlFor="horario-funcionamento">Horário de Funcionamento</Label>
                  <Textarea
                    id="horario-funcionamento"
                    placeholder="Ex: Segunda a Domingo das 18h às 23h"
                    className="mt-1"
                    rows={3}
                    defaultValue="Segunda a Quinta: 18h às 23h
Sexta e Sábado: 18h às 00h
Domingo: 18h às 22h"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contatos">Informações de Contato</Label>
                  <Textarea
                    id="contatos"
                    placeholder="Telefone, WhatsApp, endereço, redes sociais..."
                    className="mt-1"
                    rows={5}
                    defaultValue="📞 (11) 9999-9999
📱 WhatsApp: (11) 9999-9999
📍 Rua das Flores, 123 - São Paulo/SP
🌐 @pizzariaexemplo
📧 contato@pizzariaexemplo.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="politicas">Políticas e Condições</Label>
                  <Textarea
                    id="politicas"
                    placeholder="Delivery, formas de pagamento, políticas de troca..."
                    className="mt-1"
                    rows={3}
                    defaultValue="🚚 Delivery grátis acima de R$ 50
💳 Aceitamos cartão, PIX e dinheiro
⏰ Tempo de entrega: 30-45 minutos
🔄 Trocas em até 30 minutos"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Save className="mr-2 h-4 w-4" />
                Salvar Informações
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold">Upload de Documentos</h3>
            <p className="text-muted-foreground">
              Envie PDFs, imagens e documentos para que a IA possa acessar essas informações
            </p>
            
            {/* Área de Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">Arraste arquivos aqui</h4>
              <p className="text-muted-foreground mb-4">
                Ou clique para selecionar arquivos
              </p>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Selecionar Arquivos
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos aceitos: PDF, JPG, PNG, DOC, DOCX. Máximo 10MB por arquivo.
              </p>
            </div>
            
            {/* Formulário de Metadados */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium mb-4">Informações do Arquivo</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo-arquivo">Título da Mídia</Label>
                  <Input
                    id="titulo-arquivo"
                    placeholder="Ex: Cardápio Principal 2024"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags-arquivo">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags-arquivo"
                    placeholder="Ex: menu, pizzas, preços"
                    className="mt-1"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <Label htmlFor="descricao-arquivo">Descrição e Contexto</Label>
                  <Textarea
                    id="descricao-arquivo"
                    placeholder="Descreva o conteúdo do arquivo para que a IA entenda o contexto..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="lg:col-span-2 flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Arquivo ativo (disponível para a IA)</Label>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button className="bg-gradient-primary hover:shadow-glow">
                  <Upload className="mr-2 h-4 w-4" />
                  Processar e Indexar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="biblioteca" className="space-y-6">
          {/* Busca */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Grid de Arquivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arquivos.map((arquivo) => (
              <Card key={arquivo.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {arquivo.tipo === 'PDF' ? (
                        <FileText className="h-8 w-8 text-red-500" />
                      ) : (
                        <Image className="h-8 w-8 text-blue-500" />
                      )}
                      <div>
                        <CardTitle className="text-sm">{arquivo.nome}</CardTitle>
                        <CardDescription className="text-xs">
                          {arquivo.tipo} • {arquivo.data}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={arquivo.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                      {arquivo.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {arquivo.descricao}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {arquivo.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}