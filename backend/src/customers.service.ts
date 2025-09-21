import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);
  private supabase;

  constructor() {
    // Configuração do Supabase a partir das variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL || 'https://jvwfdcjqrptlpgxqxnmt.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('🔗 Supabase Client inicializado para Customers');
  }

  async getCustomerStats(period: string = 'day') {
    try {
      this.logger.log(`📊 Buscando estatísticas REAIS de clientes para período: ${period}`);

      // 1. CONTAR TOTAL DE CLIENTES ÚNICOS (baseado em nome_cliente)
      const { data: allCustomers, error: allError } = await this.supabase
        .from('pedidos')
        .select('nome_cliente, created_at, valor, impresso');

      if (allError) {
        this.logger.error(`❌ Erro ao buscar clientes: ${allError.message}`);
        throw new Error(`Erro ao buscar clientes: ${allError.message}`);
      }

      // Processar dados reais
      const uniqueCustomers = new Set();
      let totalRevenue = 0;
      let printedOrders = 0;
      let pendingOrders = 0;

      allCustomers.forEach(customer => {
        uniqueCustomers.add(customer.nome_cliente);
        totalRevenue += Number(customer.valor) || 0;
        if (customer.impresso) {
          printedOrders++;
        } else {
          pendingOrders++;
        }
      });

      const totalCustomers = uniqueCustomers.size;

      // 2. CALCULAR PERÍODO BASEADO NO PARÂMETRO
      let dateFilter = new Date();
      switch (period) {
        case 'day':
          dateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'year':
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          break;
        default:
          dateFilter.setHours(0, 0, 0, 0);
      }

      // 3. CONTAR NOVOS CLIENTES NO PERÍODO
      const { data: newCustomersData, error: newError } = await this.supabase
        .from('pedidos')
        .select('nome_cliente, created_at')
        .gte('created_at', dateFilter.toISOString());

      let newCustomersInPeriod = 0;
      if (newCustomersData && !newError) {
        const newUniqueCustomers = new Set();
        newCustomersData.forEach(customer => {
          newUniqueCustomers.add(customer.nome_cliente);
        });
        newCustomersInPeriod = newUniqueCustomers.size;
      }

      // 4. CLIENTES ATIVOS (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeCustomersData, error: activeError } = await this.supabase
        .from('pedidos')
        .select('nome_cliente')
        .gte('created_at', thirtyDaysAgo.toISOString());

      let activeCustomers = 0;
      if (activeCustomersData && !activeError) {
        const activeUniqueCustomers = new Set();
        activeCustomersData.forEach(customer => {
          activeUniqueCustomers.add(customer.nome_cliente);
        });
        activeCustomers = activeUniqueCustomers.size;
      }

      const stats = {
        totalCustomers: totalCustomers,
        newCustomers: newCustomersInPeriod,
        activeCustomers: activeCustomers,
        totalOrders: allCustomers.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // 2 casas decimais
        printedOrders: printedOrders,
        pendingOrders: pendingOrders,
        period: period,
        timestamp: new Date().toISOString(),
        growth: this.calculateGrowth(totalCustomers, newCustomersInPeriod),
        // Dados extras para debug
        customerNames: Array.from(uniqueCustomers),
        averageOrderValue: totalCustomers > 0 ? Math.round((totalRevenue / allCustomers.length) * 100) / 100 : 0
      };

      this.logger.log(`✅ Estatísticas REAIS calculadas: 
        - ${totalCustomers} clientes únicos
        - R$ ${totalRevenue} em receita total
        - ${printedOrders} pedidos impressos
        - ${pendingOrders} pedidos pendentes`);
      
      return stats;

    } catch (error) {
      this.logger.error(`❌ Erro crítico ao buscar estatísticas: ${error.message}`);
      
      // Retornar dados padrão em caso de erro
      return {
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        printedOrders: 0,
        pendingOrders: 0,
        period: period,
        timestamp: new Date().toISOString(),
        growth: 0,
        error: error.message
      };
    }
  }

  async getAllCustomers() {
    try {
      this.logger.log('📋 Buscando lista de todos os clientes');

      const { data: customers, error } = await this.supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limitar a 100 registros mais recentes

      if (error) {
        this.logger.error(`❌ Erro ao buscar clientes: ${error.message}`);
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      this.logger.log(`✅ ${customers?.length || 0} clientes encontrados`);
      
      return {
        data: customers || [],
        total: customers?.length || 0
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar lista de clientes: ${error.message}`);
      return {
        data: [],
        total: 0,
        error: error.message
      };
    }
  }

  private calculateGrowth(total: number, newCustomers: number): number {
    if (total === 0) return 0;
    return Math.round((newCustomers / total) * 100);
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('id')
        .limit(1);

      if (error) {
        this.logger.error(`❌ Teste de conexão falhou: ${error.message}`);
        return false;
      }

      this.logger.log('✅ Conexão com Supabase OK');
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro no teste de conexão: ${error.message}`);
      return false;
    }
  }

  async getChartData() {
    try {
      this.logger.log('📈 Buscando dados REAIS para o gráfico baseado em created_at');

      // Buscar todos os pedidos com created_at
      const { data: orders, error } = await this.supabase
        .from('pedidos')
        .select('created_at, nome_cliente, valor')
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error(`❌ Erro ao buscar dados do gráfico: ${error.message}`);
        throw new Error(`Erro ao buscar dados do gráfico: ${error.message}`);
      }

      // Agrupar dados por data (sem horário)
      const dailyData = new Map();
      const customersByDate = new Map();

      orders.forEach(order => {
        // Converter para data local (sem fuso horário)
        const date = new Date(order.created_at);
        const dateKey = date.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
        const dateFormatted = date.toLocaleDateString('pt-BR'); // Formato brasileiro: DD/MM/YYYY

        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, {
            date: dateFormatted,
            customers: new Set(),
            revenue: 0,
            orders: 0
          });
          customersByDate.set(dateKey, new Set());
        }

        const dayData = dailyData.get(dateKey);
        dayData.customers.add(order.nome_cliente);
        dayData.revenue += Number(order.valor) || 0;
        dayData.orders += 1;
        customersByDate.get(dateKey).add(order.nome_cliente);
      });

      // Converter Map para Array e calcular clientes acumulados
      const chartData = [];
      let cumulativeCustomers = new Set();

      Array.from(dailyData.keys()).sort().forEach(dateKey => {
        const dayData = dailyData.get(dateKey);
        
        // Adicionar novos clientes ao acumulado
        dayData.customers.forEach(customer => cumulativeCustomers.add(customer));

        chartData.push({
          date: dayData.date,
          newCustomers: dayData.customers.size,
          totalCustomers: cumulativeCustomers.size,
          revenue: Math.round(dayData.revenue * 100) / 100,
          orders: dayData.orders
        });
      });

      this.logger.log(`✅ Dados do gráfico processados: ${chartData.length} pontos de dados`);
      
      return {
        data: chartData,
        summary: {
          totalDays: chartData.length,
          totalCustomers: cumulativeCustomers.size,
          totalRevenue: chartData.reduce((sum, day) => sum + day.revenue, 0),
          totalOrders: chartData.reduce((sum, day) => sum + day.orders, 0)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao processar dados do gráfico: ${error.message}`);
      throw error;
    }
  }

  async getDebugInfo() {
    try {
      this.logger.log('🔍 Buscando informações de debug da tabela pedidos');

      // 1. Pegar uma amostra dos dados
      const { data: sampleData, error: sampleError } = await this.supabase
        .from('pedidos')
        .select('*')
        .limit(5);

      if (sampleError) {
        this.logger.error(`❌ Erro ao buscar amostra: ${sampleError.message}`);
        throw new Error(`Erro ao buscar dados de exemplo: ${sampleError.message}`);
      }

      // 2. Contar total de registros
      const { count: totalCount, error: countError } = await this.supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        this.logger.error(`❌ Erro ao contar registros: ${countError.message}`);
        throw new Error(`Erro ao contar registros: ${countError.message}`);
      }

      // 3. Verificar estrutura da tabela (campos disponíveis)
      const tableStructure = sampleData && sampleData.length > 0 
        ? Object.keys(sampleData[0]) 
        : [];

      this.logger.log(`✅ Debug info coletado: ${totalCount} registros encontrados`);
      
      return {
        totalRecords: totalCount,
        sampleData: sampleData || [],
        tableFields: tableStructure,
        supabaseUrl: process.env.SUPABASE_URL,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Erro no debug: ${error.message}`);
      throw error;
    }
  }
}
