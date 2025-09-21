import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Save, Upload } from 'lucide-react';

export function Identidade() {
  const [temperatura, setTemperatura] = useState([1.0]);
  const [metaMensagens, setMetaMensagens] = useState([5]);
  const [personalidade, setPersonalidade] = useState('profissional');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Identidade do Agente
        </h2>
        <p className="text-muted-foreground">
          Configure a personalidade e comportamento do seu agente de vendas IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Básicas */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold">Configurações Básicas</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome-agente">Nome do Agente</Label>
              <Input
                id="nome-agente"
                defaultValue="Sofia - Assistente de Vendas"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>
                Temperatura da IA: <span className="text-primary">{temperatura[0].toFixed(1)}</span>
              </Label>
              <Slider
                value={temperatura}
                onValueChange={setTemperatura}
                min={0.1}
                max={2.0}
                step={0.1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Mais Preciso</span>
                <span>Mais Criativo</span>
              </div>
            </div>
            
            <div>
              <Label>
                Meta de Mensagens para Venda: <span className="text-primary">{metaMensagens[0]}</span>
              </Label>
              <Slider
                value={metaMensagens}
                onValueChange={setMetaMensagens}
                min={2}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>2 mensagens</span>
                <span>10 mensagens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold">Avatar do Agente</h3>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center border-2 border-dashed border-border">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Enviar Avatar
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Personalidade */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold">Personalidade</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label>Tipo de Personalidade</Label>
            <RadioGroup value={personalidade} onValueChange={setPersonalidade} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="profissional" id="profissional" />
                <Label htmlFor="profissional">Profissional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amigavel" id="amigavel" />
                <Label htmlFor="amigavel">Amigável</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="persuasivo" id="persuasivo" />
                <Label htmlFor="persuasivo">Persuasivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consultivo" id="consultivo" />
                <Label htmlFor="consultivo">Consultivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tecnico" id="tecnico" />
                <Label htmlFor="tecnico">Técnico</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personalizada" id="personalizada" />
                <Label htmlFor="personalizada">Personalizada</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="tom-voz">Tom de Voz</Label>
            <Select>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o tom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="informal">Informal</SelectItem>
                <SelectItem value="entusiastico">Entusiástico</SelectItem>
                <SelectItem value="calmo">Calmo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {personalidade === 'personalizada' && (
          <div>
            <Label htmlFor="descricao-personalidade">Descrição da Personalidade</Label>
            <Textarea
              id="descricao-personalidade"
              placeholder="Descreva como o agente deve se comportar..."
              className="mt-1"
              rows={4}
            />
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex justify-end">
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}