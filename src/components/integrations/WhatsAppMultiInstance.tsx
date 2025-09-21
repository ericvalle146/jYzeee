/**
 * INIT-01: Multi-Instance WhatsApp Component
 * 
 * Componente refatorado para demonstrar a nova arquitetura multi-instância
 * Substitui o WhatsAppEvolution com funcionalidades aprimoradas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Smartphone,
  Wifi,
  WifiOff,
  Power,
  Users,
  Monitor,
  Bell,
  Settings
} from 'lucide-react';
import { useWhatsAppMultiInstance } from '@/hooks/useWhatsAppMultiInstance';
import { whatsappMultiInstanceService, WhatsAppInstance } from '@/services/whatsappMultiInstanceService';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppMultiInstance() {
  const { toast } = useToast();
  const [clientIdInput, setClientIdInput] = useState('client001');
  const [allInstances, setAllInstances] = useState<WhatsAppInstance[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  // Use the multi-instance hook
  const {
    isConnected,
    isConnecting,
    isLoading,
    qrCode,
    instanceStatus,
    error,
    clientId,
    instanceName,
    setClientId,
    generateQRCode,
    disconnect,
    checkInstanceStatus,
    canGenerateQR,
    canDisconnect,
    statusText
  } = useWhatsAppMultiInstance();

  console.log('🔍 WhatsAppMultiInstance component rendered', {
    clientId,
    instanceStatus,
    isConnected
  });

  /**
   * Handle client ID submission
   */
  const handleSetClientId = () => {
    if (clientIdInput.trim()) {
      setClientId(clientIdInput.trim());
      toast({
        title: 'Client ID Set',
        description: `Now managing instance for client: ${clientIdInput.trim()}`,
      });
    }
  };

  /**
   * Load all instances
   */
  const loadAllInstances = async () => {
    setIsLoadingGlobal(true);
    try {
      const instances = await whatsappMultiInstanceService.getAllInstances();
      setAllInstances(instances);
      console.log(`✅ Loaded ${instances.length} instances`);
    } catch (error) {
      console.error('❌ Error loading instances:', error);
      toast({
        title: 'Error Loading Instances',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  /**
   * Perform health check
   */
  const performHealthCheck = async () => {
    setIsLoadingGlobal(true);
    try {
      const health = await whatsappMultiInstanceService.getHealthCheck();
      setHealthData(health);
      console.log('✅ Health check completed:', health);
      
      toast({
        title: 'Health Check Complete',
        description: `${health.connectedInstances}/${health.totalInstances} instances connected`,
      });
    } catch (error) {
      console.error('❌ Health check failed:', error);
      toast({
        title: 'Health Check Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  /**
   * Load monitoring status
   */
  const loadMonitoringStatus = async () => {
    try {
      const status = await whatsappMultiInstanceService.getMonitoringStatus();
      setMonitoringStatus(status);
      console.log('✅ Monitoring status loaded:', status);
    } catch (error) {
      console.error('❌ Error loading monitoring status:', error);
    }
  };

  /**
   * Test alert system
   */
  const testAlertSystem = async () => {
    setIsLoadingGlobal(true);
    try {
      await whatsappMultiInstanceService.testAlertSystem();
      toast({
        title: 'Test Alert Sent',
        description: 'Check your configured alert channels for the test message',
      });
    } catch (error) {
      console.error('❌ Error testing alert system:', error);
      toast({
        title: 'Alert Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  /**
   * Load initial data
   */
  useEffect(() => {
    loadAllInstances();
    performHealthCheck();
    loadMonitoringStatus();
  }, []);

  /**
   * Get status badge variant
   */
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'connecting': return 'secondary';
      case 'close': return 'destructive';
      default: return 'outline';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Wifi className="h-4 w-4" />;
      case 'connecting': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'close': return <WifiOff className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            WhatsApp Multi-Instance Integration
          </CardTitle>
          <CardDescription>
            Advanced WhatsApp integration supporting multiple client instances with intelligent QR code generation and monitoring
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="instance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instance" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Instance Manager
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Instances
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Instance Manager Tab */}
        <TabsContent value="instance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage WhatsApp Instance</CardTitle>
              <CardDescription>
                Connect and manage WhatsApp for a specific client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client ID Input */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientId"
                    placeholder="Enter client ID (e.g., client001)"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button onClick={handleSetClientId} disabled={isLoading || !clientIdInput.trim()}>
                    Set Client
                  </Button>
                </div>
                {clientId && (
                  <p className="text-sm text-muted-foreground">
                    Currently managing: <strong>{clientId}</strong>
                    {instanceName && ` (${instanceName})`}
                  </p>
                )}
              </div>

              {/* Status Display */}
              {clientId && (
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusBadgeVariant(instanceStatus || 'unknown')} className="flex items-center gap-1">
                    {getStatusIcon(instanceStatus || 'unknown')}
                    {statusText}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkInstanceStatus}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-3 w-3" />
                    )}
                    Refresh Status
                  </Button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {isConnected && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    WhatsApp connected successfully for client {clientId}! Instance is ready to send and receive messages.
                  </AlertDescription>
                </Alert>
              )}

              {/* QR Code Display */}
              {qrCode && !isConnected && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Open WhatsApp, go to "Linked Devices" and scan this code for client {clientId}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-xl border border-border shadow-lg">
                      <img 
                        src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                        alt="WhatsApp QR Code" 
                        className="w-64 h-64 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      QR Code expires in a few minutes. Generate a new one if needed.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={generateQRCode}
                  disabled={!canGenerateQR}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  {isConnected ? 'Generate New QR Code' : 'Connect WhatsApp'}
                </Button>
                
                {(isConnected || isConnecting) && (
                  <Button 
                    onClick={disconnect}
                    disabled={!canDisconnect}
                    variant="destructive"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-4 w-4" />
                    )}
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Instances Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                All WhatsApp Instances
                <Button onClick={loadAllInstances} disabled={isLoadingGlobal} size="sm">
                  {isLoadingGlobal ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3 w-3" />
                  )}
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allInstances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active WhatsApp instances found
                </div>
              ) : (
                <div className="space-y-3">
                  {allInstances.map((instance) => (
                    <div key={instance.instanceName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(instance.status)}
                        <div>
                          <p className="font-medium">{instance.instanceName}</p>
                          {instance.clientId && (
                            <p className="text-sm text-muted-foreground">Client: {instance.clientId}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(instance.status)}>
                          {instance.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(instance.lastCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Health & Monitoring
                <Button onClick={performHealthCheck} disabled={isLoadingGlobal} size="sm">
                  {isLoadingGlobal ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Monitor className="mr-2 h-3 w-3" />
                  )}
                  Health Check
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{healthData.totalInstances}</div>
                    <div className="text-sm text-muted-foreground">Total Instances</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{healthData.connectedInstances}</div>
                    <div className="text-sm text-muted-foreground">Connected</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{healthData.disconnectedInstances}</div>
                    <div className="text-sm text-muted-foreground">Disconnected</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {healthData.apiConfiguration?.configured ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-muted-foreground">API Status</div>
                  </div>
                </div>
              )}

              {monitoringStatus && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Monitoring System Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Monitoring Active: <Badge variant={monitoringStatus.isActive ? 'default' : 'secondary'}>
                      {monitoringStatus.isActive ? 'YES' : 'NO'}
                    </Badge></div>
                    <div>Alert Channels: <strong>{monitoringStatus.alertChannelsCount}</strong></div>
                    <div>Tracked Instances: <strong>{monitoringStatus.trackedInstances}</strong></div>
                    <div>Health History Size: <strong>{monitoringStatus.healthHistorySize}</strong></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert System</CardTitle>
              <CardDescription>
                Configure and test the monitoring alert system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Alert channels can be configured via environment variables:
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li><code>SLACK_WEBHOOK_URL</code> - Slack notifications</li>
                    <li><code>DISCORD_WEBHOOK_URL</code> - Discord notifications</li>
                    <li><code>ALERT_WEBHOOK_URL</code> - Generic webhook</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={testAlertSystem} disabled={isLoadingGlobal}>
                {isLoadingGlobal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="mr-2 h-4 w-4" />
                )}
                Send Test Alert
              </Button>

              {monitoringStatus && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm">
                    <strong>{monitoringStatus.alertChannelsCount}</strong> alert channel(s) configured
                  </p>
                  {monitoringStatus.alertChannelsCount === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚠️ No alert channels configured. Alerts will only appear in logs.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
