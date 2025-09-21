/**
 * Serviço para gerenciar operações no banco vetorial (produtos_docs)
 * Integra com Supabase para operações CRUD na tabela produtos_docs
 */

import { supabase } from '../config/supabase';

export interface VectorRecord {
  id: number;
  content?: string;
  metadata?: any;
  [key: string]: any; // Flexível para outras colunas que possam existir
}

/**
 * Exclui um registro da tabela produtos_docs pelo ID
 * @param productId - ID do produto a ser excluído
 * @returns Promise com o resultado da operação
 */
export const deleteVectorRecord = async (productId: number): Promise<{
  success: boolean;
  data?: VectorRecord;
  error?: string;
}> => {
  try {
    console.log(`🗑️ [VectorDB] Iniciando exclusão do produto ID: ${productId} da tabela produtos_docs`);

    // Primeiro, verificar se o registro existe
    const { data: existingRecord, error: fetchError } = await supabase
      .from('produtos_docs')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log(`⚠️ [VectorDB] Registro com ID ${productId} não encontrado na tabela produtos_docs`);
        return {
          success: true, // Consideramos sucesso se o registro já não existe
          error: 'Registro não encontrado no banco vetorial'
        };
      }
      throw fetchError;
    }

    console.log(`✅ [VectorDB] Registro encontrado, procedendo com exclusão:`, {
      id: existingRecord.id
    });

    // Executar a exclusão
    const { data, error } = await supabase
      .from('produtos_docs')
      .delete()
      .eq('id', productId)
      .select() // Retorna o registro deletado
      .single();

    if (error) {
      console.error(`❌ [VectorDB] Erro ao excluir registro ID ${productId}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`✅ [VectorDB] Registro ID ${productId} excluído com sucesso do banco vetorial`);
    
    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error(`💥 [VectorDB] Erro fatal na exclusão do ID ${productId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Lista registros da tabela produtos_docs (para debug/verificação)
 * @param limit - Limite de registros a retornar
 * @returns Promise com a lista de registros
 */
export const listVectorRecords = async (limit: number = 10): Promise<{
  success: boolean;
  data?: VectorRecord[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('produtos_docs')
      .select('id')
      .order('id', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Verifica se um registro existe na tabela produtos_docs
 * @param productId - ID do produto a verificar
 * @returns Promise com resultado da verificação
 */
export const checkVectorRecordExists = async (productId: number): Promise<{
  exists: boolean;
  data?: VectorRecord;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('produtos_docs')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false };
      }
      return {
        exists: false,
        error: error.message
      };
    }

    return {
      exists: true,
      data: data
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
