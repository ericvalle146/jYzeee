import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { API_CONFIG } from '@/config/api';

export function DebugPanel() {
  const [customerData, setCustomerData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch customer data
      const customerResponse = await fetch(`${API_CONFIG.BACKEND_API}/customers/stats`);
      const customerResult = await customerResponse.json();
      setCustomerData({
        status: customerResponse.status,
        data: customerResult,
        error: null
      });

      // Fetch sales data
      const salesResponse = await fetch(`${API_CONFIG.BACKEND_API}/sales/stats`);
      const salesResult = await salesResponse.json();
      setSalesData({
        status: salesResponse.status,
        data: salesResult,
        error: null
      });
    } catch (error) {
      console.error('Debug fetch error:', error);
      setCustomerData({ error: error.message });
      setSalesData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Panel</CardTitle>
          <CardDescription>
            Verificando dados do backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar Dados'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Dados de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-2 rounded">
            {JSON.stringify(customerData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💰 Dados de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-2 rounded">
            {JSON.stringify(salesData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📈 Comparação dos Gráficos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Cliente 17/08:</strong> {customerData?.data?.chart?.find(item => item.name === '17/08')?.value || 'N/A'}</p>
            <p><strong>Vendas 17/08:</strong> {salesData?.data?.chart?.find(item => item.name === '17/08')?.value || 'N/A'}</p>
            <p><strong>São iguais?</strong> {
              (customerData?.data?.chart?.find(item => item.name === '17/08')?.value === 
               salesData?.data?.chart?.find(item => item.name === '17/08')?.value) ? '❌ SIM (ERRO!)' : '✅ NÃO (CORRETO!)'
            }</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
