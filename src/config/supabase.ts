/**
 * CONFIGURAÇÃO DO SUPABASE PARA FRONTEND
 * 
 * Usa variáveis de ambiente para configuração segura
 * Funciona tanto em desenvolvimento quanto em produção
 * Cliente singleton para evitar múltiplas instâncias
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configurações do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env');
}

// Cliente Supabase singleton para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    console.log('🔧 [Supabase] Criando nova instância do cliente');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseInstance;
};

// Cliente Supabase
export const supabase = getSupabaseClient();

// Configurações exportadas para uso em outros lugares
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: !!(supabaseUrl && supabaseAnonKey),
} as const;

// Função para testar conectividade
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!SUPABASE_CONFIG.isConfigured) {
      console.warn('⚠️ Supabase não configurado');
      return false;
    }

    const { data, error } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro ao testar conexão Supabase:', error);
      return false;
    }

    console.log('✅ Conexão Supabase OK');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão Supabase:', error);
    return false;
  }
};

export default supabase;
