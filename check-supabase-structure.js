import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jvwfdcjqrptlpgxqxnmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseStructure() {
  console.log('🔍 Verificando estrutura do Supabase...');
  
  try {
    // Verificar se a tabela pedidos existe
    console.log('\n📋 Verificando tabela "pedidos"...');
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .limit(1);
    
    if (pedidosError) {
      console.error('❌ Erro ao acessar tabela "pedidos":', pedidosError.message);
    } else {
      console.log('✅ Tabela "pedidos" acessível');
      console.log('📊 Estrutura do primeiro registro:', pedidos[0] || 'Nenhum registro encontrado');
    }
    
    // Verificar se a tabela orders existe
    console.log('\n📋 Verificando tabela "orders"...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Erro ao acessar tabela "orders":', ordersError.message);
    } else {
      console.log('✅ Tabela "orders" acessível');
      console.log('📊 Estrutura do primeiro registro:', orders[0] || 'Nenhum registro encontrado');
    }
    
    // Listar todas as tabelas
    console.log('\n📋 Listando todas as tabelas...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('⚠️ Não foi possível listar tabelas via RPC, tentando método alternativo...');
      
      // Tentar acessar algumas tabelas comuns
      const commonTables = ['pedidos', 'orders', 'customers', 'products', 'order_items'];
      for (const table of commonTables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(0);
          if (!error) {
            console.log(`✅ Tabela "${table}" existe`);
          } else {
            console.log(`❌ Tabela "${table}" não existe:`, error.message);
          }
        } catch (err) {
          console.log(`❌ Erro ao verificar tabela "${table}":`, err.message);
        }
      }
    } else {
      console.log('📊 Tabelas encontradas:', tables);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkSupabaseStructure();
