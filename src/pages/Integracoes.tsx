import React, { useEffect } from 'react';
import { 
  Zap
} from 'lucide-react';
import { WhatsAppEvolution } from '@/components/integrations/WhatsAppEvolution';

const Integracoes = () => {
  useEffect(() => {
    console.log('🔍 DEBUG: Página Integrações iniciada');
    console.log('🔍 DEBUG: Variáveis de ambiente:', {
      EVOLUTION_API_URL: import.meta.env.VITE_EVOLUTION_API_URL || 'NÃO DEFINIDA',
      EVOLUTION_API_KEY: import.meta.env.VITE_EVOLUTION_API_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
      WHATSAPP_INSTANCE_NAME: import.meta.env.VITE_WHATSAPP_INSTANCE_NAME || 'JyzeCliente (padrão)',
    });
  }, []);

  console.log('🔍 DEBUG: Renderizando página Integrações');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Integrações & Conexões</span>
        </div>
        <h1 className="text-4xl font-bold gradient-text">
          Integração WhatsApp
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Configure sua integração WhatsApp Business usando Evolution API para atendimento automatizado
        </p>
      </div>

      {/* WhatsApp Integration Section */}
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          {/* Versão Principal com Tratamento de Erros */}
          <WhatsAppEvolution />
        </div>
      </div>

    </div>
  );
};

export default Integracoes;