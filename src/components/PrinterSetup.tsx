import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Printer, 
  Settings, 
  Wifi, 
  Usb, 
  TestTube2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Eye,
  AlertCircle,
  Play,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printerService, PrinterConfig } from '@/services/printerService';
import { Order } from '@/types/orders';

interface PrinterSetupProps {
  children: React.ReactNode;
}

export const PrinterSetup: React.FC<PrinterSetupProps> = ({ children }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<PrinterConfig>({
    width: 48,
    encoding: 'utf8'
  });
  
  // Estados para detecção automática
  const [printers, setPrinters] = useState<any[]>([]);
  const [system, setSystem] = useState<any>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Estado para configuração manual (Linux)
  const [manualDevicePath, setManualDevicePath] = useState('/dev/usblp1');

  // Pedido de exemplo para teste
  const sampleOrder: Order = {
    id: 999,
    nome_cliente: 'Cliente Teste',
    endereco: 'Rua de Teste, 123 - Bairro Teste',
    pedido: 'Pizza Margherita G, 2x Coca-Cola 2L',
    valor: 45.50,
    tipo_pagamento: 'Cartão de Crédito',
    observacoes: 'Teste de impressão do sistema',
    created_at: new Date().toISOString(),
    status: 'preparando'
  };

  // Carrega impressoras automaticamente
  const detectPrinters = async () => {
    setIsDetecting(true);
    try {
      const [detectedPrinters, systemInfo] = await Promise.all([
        printerService.detectPrinters(),
        printerService.getSystemInfo()
      ]);
      
      setPrinters(detectedPrinters);
      setSystem(systemInfo);
      
      toast({
        title: "Detecção concluída",
        description: `${detectedPrinters.length} impressora(s) encontrada(s)`,
      });
    } catch (error) {
      console.error('Erro na detecção:', error);
      toast({
        title: "Erro na detecção",
        description: "Falha ao detectar impressoras",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Testa uma impressora específica
  const handleTestPrint = async (printer: any) => {
    setIsTesting(true);
    try {
      const success = await printerService.testPrint({
        ...config,
        devicePath: printer.devicePath,
        vendorId: printer.vendorId,
        productId: printer.productId
      });

      if (success) {
        toast({
          title: "Teste bem-sucedido",
          description: "Impressora está funcionando corretamente",
        });
      } else {
        throw new Error('Falha no teste');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha no teste de impressão. Verifique a conexão.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Testa dispositivo manual para Linux
  const handleManualDeviceTest = async () => {
    if (!manualDevicePath) return;
    
    setIsTesting(true);
    try {
      const success = await printerService.testPrint({
        ...config,
        devicePath: manualDevicePath
      });

      if (success) {
        toast({
          title: "Teste bem-sucedido",
          description: `Dispositivo ${manualDevicePath} está funcionando`,
        });
      } else {
        throw new Error('Falha no teste');
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Verifique se o dispositivo existe e tem permissões corretas",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Imprime pedido de exemplo
  const printSample = async () => {
    try {
      setLoading(true);
      const printConfig = { ...config };
      
      // Para Linux, usa o dispositivo manual se configurado
      if (system?.platform === 'linux' && manualDevicePath) {
        printConfig.devicePath = manualDevicePath;
      } else if (selectedPrinter) {
        printConfig.devicePath = selectedPrinter.devicePath;
        printConfig.vendorId = selectedPrinter.vendorId;
        printConfig.productId = selectedPrinter.productId;
      }
      
      const success = await printerService.printOrder(sampleOrder, printConfig);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Pedido de exemplo impresso com sucesso!",
        });
      } else {
        throw new Error('Falha na impressão');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao imprimir pedido de exemplo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carrega impressoras ao abrir
  useEffect(() => {
    if (isOpen) {
      detectPrinters();
    }
  }, [isOpen]); // detectPrinters não precisa estar nas dependências pois é estável

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Printer className="h-6 w-6" />
            Configuração da Impressora
          </DialogTitle>
          <DialogDescription>
            Configure sua impressora USB ESC/POS para impressão de pedidos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detection">Detecção</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
          </TabsList>

          {/* Aba Detecção */}
          <TabsContent value="detection" className="space-y-4">
            <div className="space-y-4">
              {isDetecting && (
                <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-800">Detectando impressoras...</span>
                </div>
              )}

              {system && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Sistema Detectado:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Plataforma:</strong> {system.platform}</p>
                    <p><strong>SO:</strong> {system.osVersion}</p>
                    <p><strong>Arquitetura:</strong> {system.arch}</p>
                    <p><strong>Usuário:</strong> {system.username}</p>
                  </div>
                  
                  {system.platform === 'linux' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        <AlertTriangle className="inline w-4 h-4 mr-1" />
                        Instruções para Linux
                      </h4>
                      <div className="text-xs text-yellow-700 space-y-2">
                        <p>Se não conseguir detectar automaticamente, execute no terminal:</p>
                        <code className="block bg-yellow-100 p-2 rounded text-xs font-mono">
                          sudo mknod /dev/usblp1 c 180 1<br/>
                          sudo chmod 666 /dev/usblp1
                        </code>
                        <p>Depois configure o caminho do dispositivo como: <strong>/dev/usblp1</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {printers.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Impressoras Encontradas:</h3>
                  {printers.map((printer, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPrinter?.name === printer.name 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPrinter(printer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Printer className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{printer.name}</span>
                            {printer.isDefault && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Padrão
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {printer.manufacturer && (
                              <p><strong>Fabricante:</strong> {printer.manufacturer}</p>
                            )}
                            {printer.model && (
                              <p><strong>Modelo:</strong> {printer.model}</p>
                            )}
                            {printer.status && (
                              <p><strong>Status:</strong> {printer.status}</p>
                            )}
                            {printer.connection && (
                              <p><strong>Conexão:</strong> {printer.connection}</p>
                            )}
                            {printer.devicePath && (
                              <p><strong>Dispositivo:</strong> <code className="bg-gray-100 px-1 rounded">{printer.devicePath}</code></p>
                            )}
                            {printer.vendorId && printer.productId && (
                              <p>
                                <strong>VID/PID:</strong> 
                                <code className="bg-gray-100 px-1 rounded ml-1">
                                  {printer.vendorId.toString(16).padStart(4, '0').toUpperCase()}:
                                  {printer.productId.toString(16).padStart(4, '0').toUpperCase()}
                                </code>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestPrint(printer);
                            }}
                            disabled={isTesting}
                          >
                            {isTesting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Testar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !isDetecting && (
                  <div className="text-center py-8 text-gray-500">
                    <Printer className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Sistema de impressão configurado</p>
                    <p className="text-sm">Impressora instalada e funcionando corretamente</p>
                  </div>
                )
              )}

              {system?.platform === 'linux' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Configuração Manual (Linux)</h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="devicePath" className="block text-sm font-medium text-gray-700 mb-1">
                        Caminho do Dispositivo
                      </label>
                      <input
                        id="devicePath"
                        type="text"
                        value={manualDevicePath}
                        onChange={(e) => setManualDevicePath(e.target.value)}
                        placeholder="/dev/usblp1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Exemplo: /dev/usblp0, /dev/usblp1, etc.
                      </p>
                    </div>
                    <Button
                      onClick={handleManualDeviceTest}
                      disabled={!manualDevicePath || isTesting}
                      className="w-full"
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Testar Dispositivo Manual
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={detectPrinters} disabled={isDetecting} className="flex-1">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
                  Detectar Novamente
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Aba Configuração */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações da Impressora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Largura (caracteres)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={config.width}
                      onChange={(e) => setConfig({...config, width: parseInt(e.target.value) || 48})}
                      min="32"
                      max="80"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="encoding">Codificação</Label>
                    <Select
                      value={config.encoding}
                      onValueChange={(value) => setConfig({...config, encoding: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf8">UTF-8</SelectItem>
                        <SelectItem value="latin1">ISO-8859-1</SelectItem>
                        <SelectItem value="cp850">CP850</SelectItem>
                        <SelectItem value="cp1252">CP1252</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={config.companyName || ''}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                    placeholder="SELLHUB VENDAS"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Endereço da Empresa</Label>
                  <Input
                    id="companyAddress"
                    value={config.companyAddress || ''}
                    onChange={(e) => setConfig({...config, companyAddress: e.target.value})}
                    placeholder="Sistema de Vendas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone da Empresa</Label>
                  <Input
                    id="companyPhone"
                    value={config.companyPhone || ''}
                    onChange={(e) => setConfig({...config, companyPhone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Teste */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube2 className="h-5 w-5" />
                  Teste de Impressão
                </CardTitle>
                <CardDescription>
                  Imprima um pedido de exemplo para testar sua configuração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Pedido de Exemplo:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>ID:</strong> {sampleOrder.id}</p>
                    <p><strong>Cliente:</strong> {sampleOrder.nome_cliente}</p>
                    <p><strong>Endereço:</strong> {sampleOrder.endereco}</p>
                    <p><strong>Pedido:</strong> {sampleOrder.pedido}</p>
                    <p><strong>Valor:</strong> R$ {sampleOrder.valor.toFixed(2)}</p>
                    <p><strong>Pagamento:</strong> {sampleOrder.tipo_pagamento}</p>
                    <p><strong>Observações:</strong> {sampleOrder.observacoes}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={printSample} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Imprimir Pedido de Exemplo
                  </Button>
                </div>

                {system?.platform === 'linux' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      <strong>Linux:</strong> Se o teste falhar, verifique se o dispositivo {manualDevicePath} existe e tem permissões de escrita.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PrinterSetup;
