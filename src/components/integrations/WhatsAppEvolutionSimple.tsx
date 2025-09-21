import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export function WhatsAppEvolutionSimple() {
  console.log('🔍 DEBUG: Componente WhatsAppEvolutionSimple renderizando');

  const handleTest = () => {
    console.log('🔍 DEBUG: Botão de teste clicado');
    alert('Componente WhatsApp funcionando!');
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <CardTitle>WhatsApp Business (Modo Debug)</CardTitle>
          </div>
        </div>
        <CardDescription>
          Versão simplificada para debug - Integração com Evolution API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status: Modo Debug</p>
              <p className="text-sm text-muted-foreground">
                Componente carregado com sucesso
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleTest}
          className="w-full"
          size="lg"
        >
          Testar Componente
        </Button>

        <div className="text-sm text-muted-foreground">
          <p><strong>Variáveis de ambiente:</strong></p>
          <ul className="mt-2 space-y-1">
            <li>EVOLUTION_API_URL: {import.meta.env.VITE_EVOLUTION_API_URL || 'NÃO DEFINIDA'}</li>
            <li>EVOLUTION_API_KEY: {import.meta.env.VITE_EVOLUTION_API_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA'}</li>
            <li>WHATSAPP_INSTANCE_NAME: {import.meta.env.VITE_WHATSAPP_INSTANCE_NAME || 'JyzeCliente (padrão)'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}




