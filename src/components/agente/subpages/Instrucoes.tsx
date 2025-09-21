import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, CalendarIcon, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function Instrucoes() {
  const [promocoesAtivas, setPromocoesAtivas] = useState(true);
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  const promocoesList = [
    {
      id: 1,
      titulo: 'Black Friday 2024',
      descricao: 'Desconto de 30% em todos os produtos',
      inicio: '2024-11-29',
      fim: '2024-12-02',
      status: 'ativa'
    },
    {
      id: 2,
      titulo: 'Natal Especial',
      descricao: 'Frete grátis e 15% de desconto',
      inicio: '2024-12-15',
      fim: '2024-12-25',
      status: 'inativa'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Instruções do Sistema
        </h2>
        <p className="text-muted-foreground">
          Configure prompts e instruções especiais para eventos ocasionais
        </p>
      </div>

      {/* Prompt Principal */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">Prompt Principal do Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Este prompt estará sempre ativo e define o comportamento base do agente
        </p>
        
        <Textarea
          placeholder="Ex: Você é um especialista em vendas consultivas. Sempre faça perguntas para entender as necessidades do cliente antes de apresentar soluções..."
          className="min-h-[120px]"
          defaultValue="Você é Sofia, uma assistente de vendas especializada em atendimento humanizado. Seu objetivo é ajudar os clientes a encontrar os melhores produtos para suas necessidades, sempre mantendo um tom profissional e amigável. Faça perguntas relevantes para entender o contexto do cliente antes de sugerir produtos."
        />
        
        <div className="flex gap-2">
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Save className="mr-2 h-4 w-4" />
            Salvar Instruções
          </Button>
          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Resetar para Padrão
          </Button>
        </div>
      </div>

      {/* Instruções Especiais */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Instruções Especiais para Promoções</h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={promocoesAtivas}
              onCheckedChange={setPromocoesAtivas}
            />
            <Label>Ativar instruções especiais</Label>
          </div>
        </div>

        {promocoesAtivas && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo-promocao">Título da Promoção ou Evento</Label>
                <Input
                  id="titulo-promocao"
                  placeholder="Ex: Black Friday 2024"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !dataInicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataInicio}
                        onSelect={setDataInicio}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !dataFim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataFim}
                        onSelect={setDataFim}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="instrucoes-promocao">Instruções Adicionais para a Promoção</Label>
              <Textarea
                id="instrucoes-promocao"
                placeholder="Ex: Mencionar desconto de 20% em todas as conversas e destacar que é válido apenas até o fim do mês"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Promoção
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Promoções */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">Promoções Cadastradas</h3>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promocoesList.map((promocao) => (
                <TableRow key={promocao.id}>
                  <TableCell className="font-medium">{promocao.titulo}</TableCell>
                  <TableCell>{promocao.descricao}</TableCell>
                  <TableCell>
                    {format(new Date(promocao.inicio), "dd/MM/yyyy")} - {format(new Date(promocao.fim), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={promocao.status === 'ativa' ? 'default' : 'secondary'}>
                      {promocao.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
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
    </div>
  );
}