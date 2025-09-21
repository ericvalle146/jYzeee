import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Send, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AgentConfigAPI, ResponseTimeAPI } from '@/services/agentConfigAPI';

export function ConfiguracaoAgente() {
  const { toast } = useToast();
  const [nomeAgente, setNomeAgente] = useState('');
  const [tempoEntrega, setTempoEntrega] = useState('');
  const [valorFrete, setValorFrete] = useState('');
  const [tempoEspera, setTempoEspera] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Carregar configurações existentes ao inicializar o componente
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        // Carregar configurações do agente
        const config = await AgentConfigAPI.getAgentConfig();
        if (config.nomeAgente) setNomeAgente(config.nomeAgente);
        if (config.tempoEntrega !== undefined) setTempoEntrega(config.tempoEntrega.toString());
        if (config.valorFrete !== undefined) setValorFrete(config.valorFrete.toString());

        // Carregar tempo de resposta
        const responseTimeConfig = await ResponseTimeAPI.getResponseTime();
        if (responseTimeConfig.tempoResposta !== undefined) {
          setTempoEspera(responseTimeConfig.tempoResposta.toString());
        }
      } catch (error) {
        console.log('Nenhuma configuração prévia encontrada ou erro ao carregar:', error);
      }
    };
    
    carregarConfiguracoes();
  }, []);

  const salvarConfiguracoesAgente = async () => {
    // Validação dos campos obrigatórios
    if (!nomeAgente.trim() || !tempoEntrega.trim() || !valorFrete.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos de configuração do agente",
        variant: "destructive",
      });
      return;
    }

    // Validação do tempo de entrega (deve ser um número inteiro positivo)
    const tempoEntregaNum = parseInt(tempoEntrega);
    if (isNaN(tempoEntregaNum) || tempoEntregaNum <= 0) {
      toast({
        title: "Erro",
        description: "Tempo de entrega deve ser um número inteiro positivo em minutos",
        variant: "destructive",
      });
      return;
    }

    // Validação do valor do frete (deve ser um número decimal positivo)
    const valorFreteNum = parseFloat(valorFrete.replace(',', '.'));
    if (isNaN(valorFreteNum) || valorFreteNum < 0) {
      toast({
        title: "Erro",
        description: "Valor do frete deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const agentConfig = {
        nomeAgente: nomeAgente.trim(),
        tempoEntrega: tempoEntregaNum,
        valorFrete: valorFreteNum
      };

      await AgentConfigAPI.saveAgentConfig(agentConfig);

      toast({
        title: "Sucesso",
        description: "Configurações do agente salvas com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações do agente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do agente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const salvarTempoResposta = async () => {
    if (!tempoEspera.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o tempo de resposta",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const responseTimeConfig = {
        tempoResposta: parseInt(tempoEspera)
      };

      await ResponseTimeAPI.saveResponseTime(responseTimeConfig);

      toast({
        title: "Sucesso",
        description: "Tempo de resposta salvo com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao salvar tempo de resposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tempo de resposta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    // Salva todas as configurações
    await salvarConfiguracoesAgente();
    await salvarTempoResposta();
  };

  const exportarConfiguracoes = async () => {
    try {
      setIsLoading(true);
      
      // Exporta configurações do agente
      const agentData = await AgentConfigAPI.exportAgentConfig();
      
      // Exporta tempo de resposta
      const responseTimeData = await ResponseTimeAPI.exportResponseTime();

      // Combina os dados
      const allData = {
        agent_config: agentData,
        response_time: responseTimeData,
        exported_at: new Date().toISOString()
      };

      // Cria e baixa o arquivo JSON
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracoes-agente-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Configurações exportadas com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/20 dark:from-blue-500/20 dark:to-purple-500/20 dark:border-blue-400/30">
            <Settings className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent">
            Configuração do Agente
          </h1>
        </div>
        <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto">
          Configure todas as informações do seu agente de atendimento em um só lugar
        </p>
      </div>

      {/* Single Card with All Configurations */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-[#1A1C23] dark:to-[#20222B] dark:border dark:border-gray-700/50">
        <CardHeader className="pb-8 bg-gradient-to-r from-gray-50 to-white dark:from-[#1A1C23] dark:to-[#20222B] border-b dark:border-gray-700/50">
          <CardTitle className="text-2xl font-semibold text-center text-gray-800 dark:text-white">
            Configurações Gerais
          </CardTitle>
          <CardDescription className="text-center text-base mt-2 dark:text-gray-300">
            Preencha todos os campos abaixo para personalizar seu agente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Agent Data */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Dados do Agente</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nomeAgente" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nome do Agente
                </Label>
                <Input
                  id="nomeAgente"
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={nomeAgente}
                  onChange={(e) => setNomeAgente(e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-400 dark:bg-[#2D303E] dark:border-[#4A4D5C] dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-1 dark:focus:ring-blue-400/50 rounded-lg transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempoEntrega" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Tempo de Entrega
                  </Label>
                  <div className="relative">
                    <Input
                      id="tempoEntrega"
                      type="number"
                      placeholder="30"
                      value={tempoEntrega}
                      onChange={(e) => setTempoEntrega(e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-400 dark:bg-[#2D303E] dark:border-[#4A4D5C] dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-1 dark:focus:ring-blue-400/50 rounded-lg pr-16 transition-all duration-200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 bg-gray-50 dark:text-gray-300 dark:bg-[#1A1C23] px-2 py-1 rounded dark:border dark:border-[#4A4D5C]">
                      min
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorFrete" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Valor do Frete
                  </Label>
                  <div className="relative">
                    <Input
                      id="valorFrete"
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      value={valorFrete}
                      onChange={(e) => setValorFrete(e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-400 dark:bg-[#2D303E] dark:border-[#4A4D5C] dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-1 dark:focus:ring-blue-400/50 rounded-lg pr-12 transition-all duration-200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 bg-gray-50 dark:text-gray-300 dark:bg-[#1A1C23] px-2 py-1 rounded dark:border dark:border-[#4A4D5C]">
                      R$
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Response Time */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tempo de Resposta</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tempoEspera" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tempo de Resposta
                </Label>
                <div className="relative">
                  <Input
                    id="tempoEspera"
                    type="number"
                    placeholder="10"
                    value={tempoEspera}
                    onChange={(e) => setTempoEspera(e.target.value)}
                    className="h-12 text-base border-2 border-gray-200 focus:border-green-400 dark:bg-[#2D303E] dark:border-[#4A4D5C] dark:text-white dark:placeholder-gray-400 dark:focus:border-green-400 dark:focus:ring-1 dark:focus:ring-green-400/50 rounded-lg pr-16 transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 bg-gray-50 dark:text-gray-300 dark:bg-[#1A1C23] px-2 py-1 rounded dark:border dark:border-[#4A4D5C]">
                    seg
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tempo que o sistema aguarda antes de enviar uma resposta
                </p>
              </div>
            </div>
          </div>

          {/* Single Save Button */}
          <div className="mt-10 flex justify-center">
            <Button 
              onClick={handleSalvar}
              disabled={isLoading}
              className="h-14 px-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-blue-500/25 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              <Save className="h-5 w-5 mr-3" />
              {isLoading ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
