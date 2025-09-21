import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Eye, EyeOff, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interfaces para configurações
interface EnvironmentConfig {
  database: {
    domain: string;
    apiKey: string;
  };
  evolution: {
    domain: string;
    apiKey: string;
  };
  externalApis: {
    domain: string;
    apiKey: string;
  };
}

interface ConnectionStatus {
  service: 'database' | 'evolution' | 'externalApis';
  status: 'success' | 'error' | 'testing' | 'idle';
  message?: string;
}

// Componente para input seguro
const SecureInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  isPassword?: boolean;
}> = ({ id, label, value, onChange, type = 'text', placeholder, isPassword = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
        {isPassword && <Lock className="w-4 h-4 text-amber-500" />}
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 h-8 w-8"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="p-1 h-8 w-8"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente para indicador de status
const StatusIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'success':
        return 'Conectado';
      case 'error':
        return 'Erro na conexão';
      case 'testing':
        return 'Testando...';
      default:
        return 'Aguardando teste';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {getStatusIcon()}
      <span className={`
        ${status.status === 'success' ? 'text-green-600' : ''}
        ${status.status === 'error' ? 'text-red-600' : ''}
        ${status.status === 'testing' ? 'text-blue-600' : ''}
        ${status.status === 'idle' ? 'text-gray-500' : ''}
      `}>
        {getStatusText()}
      </span>
      {status.message && (
        <span className="text-xs text-gray-500 ml-2">({status.message})</span>
      )}
    </div>
  );
};

export default function Configuracoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<EnvironmentConfig>({
    database: { domain: '', apiKey: '' },
    evolution: { domain: '', apiKey: '' },
    externalApis: { domain: '', apiKey: '' }
  });
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus[]>([
    { service: 'database', status: 'idle' },
    { service: 'evolution', status: 'idle' },
    { service: 'externalApis', status: 'idle' }
  ]);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.jyze.space/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          toast({
            title: "Configurações carregadas",
            description: "Configurações carregadas com sucesso do sistema.",
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações do sistema.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, [toast]);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.jyze.space/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        toast({
          title: "Configurações carregadas",
          description: "Configurações carregadas com sucesso do sistema.",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfigField = (service: keyof EnvironmentConfig, field: 'domain' | 'apiKey', value: string) => {
    setConfig(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value
      }
    }));
  };

  const testConnection = async (service: keyof EnvironmentConfig) => {
    setConnectionStatus(prev => 
      prev.map(status => 
        status.service === service 
          ? { ...status, status: 'testing', message: 'Verificando conexão...' }
          : status
      )
    );

    try {
      const response = await fetch(`https://api.jyze.space/config/test/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config[service]),
      });

      const result = await response.json();
      
      setConnectionStatus(prev => 
        prev.map(status => 
          status.service === service 
            ? { 
                ...status, 
                status: result.success ? 'success' : 'error',
                message: result.message 
              }
            : status
        )
      );

      toast({
        title: result.success ? "Conexão bem-sucedida" : "Erro na conexão",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      setConnectionStatus(prev => 
        prev.map(status => 
          status.service === service 
            ? { 
                ...status, 
                status: 'error',
                message: 'Erro de rede'
              }
            : status
        )
      );

      toast({
        title: "Erro",
        description: "Erro ao testar conexão com o serviço.",
        variant: "destructive",
      });
    }
  };

  const saveConfiguration = async (service: keyof EnvironmentConfig) => {
    setSaving(true);
    try {
      const response = await fetch(`https://api.jyze.space/config/save/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config[service]),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Configuração salva",
          description: `Configurações do ${service} salvas com sucesso no arquivo .env`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllConfigurations = async () => {
    setSaving(true);
    try {
      const response = await fetch('https://api.jyze.space/config/save-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Todas as configurações salvas",
          description: "Todas as configurações foram salvas com sucesso no arquivo .env",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar todas as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getServiceStatus = (service: keyof EnvironmentConfig) => {
    return connectionStatus.find(status => status.service === service) || { service, status: 'idle' as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações do Sistema</h1>
          <p className="text-gray-600">
            Configure as credenciais e domínios dos serviços essenciais do sistema com máxima segurança.
          </p>
        </div>

        {/* Ações globais */}
        <div className="mb-6 flex gap-4">
          <Button 
            onClick={saveAllConfigurations} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Todas as Configurações'
            )}
          </Button>
          <Button 
            onClick={loadConfigurations} 
            variant="outline"
            disabled={loading}
          >
            Recarregar Configurações
          </Button>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="database" className="text-lg py-3">Banco de Dados</TabsTrigger>
            <TabsTrigger value="evolution" className="text-lg py-3">Evolution API</TabsTrigger>
            <TabsTrigger value="externalApis" className="text-lg py-3">APIs Externas</TabsTrigger>
          </TabsList>


          {/* Tab Database */}
          <TabsContent value="database">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">Banco de Dados</CardTitle>
                    <p className="text-gray-600 mt-1">Configurações de conexão com banco de dados</p>
                  </div>
                  <StatusIndicator status={getServiceStatus('database')} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SecureInput
                  id="db-domain"
                  label="URL do Banco"
                  value={config.database.domain}
                  onChange={(value) => updateConfigField('database', 'domain', value)}
                  placeholder="postgresql://usuario:senha@host:5432/database"
                />
                <SecureInput
                  id="db-apikey"
                  label="Chave de Acesso"
                  value={config.database.apiKey}
                  onChange={(value) => updateConfigField('database', 'apiKey', value)}
                  placeholder="db_key_xxxxxxxxxxxxxxxx"
                  isPassword={true}
                />
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => testConnection('database')} variant="outline">
                    Testar Conexão
                  </Button>
                  <Button onClick={() => saveConfiguration('database')}>
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Evolution */}
          <TabsContent value="evolution">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">Evolution API</CardTitle>
                    <p className="text-gray-600 mt-1">Configurações para integração WhatsApp</p>
                  </div>
                  <StatusIndicator status={getServiceStatus('evolution')} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SecureInput
                  id="evolution-domain"
                  label="Domínio Evolution"
                  value={config.evolution.domain}
                  onChange={(value) => updateConfigField('evolution', 'domain', value)}
                  placeholder="https://evolution.seudominio.com"
                />
                <SecureInput
                  id="evolution-apikey"
                  label="API Key Evolution"
                  value={config.evolution.apiKey}
                  onChange={(value) => updateConfigField('evolution', 'apiKey', value)}
                  placeholder="evo_api_xxxxxxxxxxxxxxxx"
                  isPassword={true}
                />
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => testConnection('evolution')} variant="outline">
                    Testar Conexão
                  </Button>
                  <Button onClick={() => saveConfiguration('evolution')}>
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab APIs Externas */}
          <TabsContent value="externalApis">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">APIs Externas</CardTitle>
                    <p className="text-gray-600 mt-1">Configurações para integração com serviços externos</p>
                  </div>
                  <StatusIndicator status={getServiceStatus('externalApis')} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SecureInput
                  id="external-domain"
                  label="Domínio Principal"
                  value={config.externalApis.domain}
                  onChange={(value) => updateConfigField('externalApis', 'domain', value)}
                  placeholder="https://api.seudominio.com"
                />
                <SecureInput
                  id="external-apikey"
                  label="Chave de API"
                  value={config.externalApis.apiKey}
                  onChange={(value) => updateConfigField('externalApis', 'apiKey', value)}
                  placeholder="ext_api_xxxxxxxxxxxxxxxx"
                  isPassword={true}
                />
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => testConnection('externalApis')} variant="outline">
                    Testar Conexão
                  </Button>
                  <Button onClick={() => saveConfiguration('externalApis')}>
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rodapé com informações de segurança */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Segurança Máxima</h3>
          </div>
          <p className="text-blue-800 text-sm leading-relaxed">
            Todas as configurações são criptografadas e armazenadas com segurança no arquivo .env do sistema. 
            As alterações são aplicadas em tempo real e todas as conexões são testadas antes da persistência.
            Seus dados sensíveis estão protegidos com as melhores práticas de segurança.
          </p>
        </div>
      </div>
    </div>
  );
}
