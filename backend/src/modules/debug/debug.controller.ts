import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';

@Controller('debug')
export class DebugController {
  constructor(private supabaseService: SupabaseService) {}

  @Get('pedidos')
  async getRawPedidos() {
    try {
      const supabase = this.supabaseService.getClient();
      
      // Buscar todos os dados da tabela pedidos
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { 
          error: error.message, 
          details: error,
          connection: this.supabaseService.isConnected() 
        };
      }

      return {
        success: true,
        connection: this.supabaseService.isConnected(),
        totalRows: data?.length || 0,
        data: data,
        dataTypes: data?.length > 0 ? Object.keys(data[0]).map(key => ({
          field: key,
          value: data[0][key],
          type: typeof data[0][key]
        })) : []
      };
    } catch (error) {
      return { 
        error: error.message, 
        connection: this.supabaseService.isConnected() 
      };
    }
  }

  @Get('customers-debug')
  async getCustomersDebug() {
    try {
      const supabase = this.supabaseService.getClient();
      
      // Testar query de clientes únicos
      const { data, error } = await supabase
        .from('pedidos')
        .select('nome_cliente, created_at, valor')
        .not('nome_cliente', 'is', null);

      if (error) {
        return { error: error.message };
      }

      // Processar dados como fazemos no serviço
      const uniqueCustomers = new Set();
      const customerData = [];

      data?.forEach(row => {
        const customerName = row.nome_cliente?.toLowerCase().trim();
        if (customerName) {
          uniqueCustomers.add(customerName);
          customerData.push({
            nome: row.nome_cliente,
            nome_processado: customerName,
            created_at: row.created_at,
            valor: row.valor,
            valor_type: typeof row.valor
          });
        }
      });

      return {
        success: true,
        totalRows: data?.length || 0,
        uniqueCustomers: uniqueCustomers.size,
        uniqueCustomersList: Array.from(uniqueCustomers),
        allCustomerData: customerData
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('sales-debug')
  async getSalesDebug() {
    try {
      const supabase = this.supabaseService.getClient();
      
      // Testar query de vendas
      const { data, error } = await supabase
        .from('pedidos')
        .select('valor, created_at, nome_cliente')
        .not('valor', 'is', null);

      if (error) {
        return { error: error.message };
      }

      let totalRevenue = 0;
      const salesData = [];

      data?.forEach(row => {
        const valor = parseFloat(String(row.valor)) || 0;
        totalRevenue += valor;
        salesData.push({
          valor_original: row.valor,
          valor_parseado: valor,
          valor_type: typeof row.valor,
          nome_cliente: row.nome_cliente,
          created_at: row.created_at
        });
      });

      return {
        success: true,
        totalRows: data?.length || 0,
        totalRevenue: totalRevenue,
        salesData: salesData
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}
