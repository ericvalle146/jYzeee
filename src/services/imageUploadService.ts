/**
 * Serviço para upload de imagens no Supabase Storage
 * Gera links públicos automaticamente após o upload
 */

import { supabase } from '../config/supabase';

export interface ImageUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  error?: string;
  filePath?: string;
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file - Arquivo de imagem a ser enviado
 * @param bucket - Nome do bucket (default: 'imagens')
 * @param folder - Pasta dentro do bucket (default: 'uploads')
 * @returns Promise com resultado do upload e link público
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'imagens',
  folder: string = 'uploads'
): Promise<ImageUploadResult> => {
  try {
    console.log(`📤 [ImageUpload] Iniciando upload da imagem: ${file.name}`);
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Arquivo deve ser uma imagem'
      };
    }

    // Validar tamanho do arquivo (máx 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Arquivo muito grande. Máximo 10MB permitido.'
      };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    console.log(`📁 [ImageUpload] Caminho do arquivo: ${bucket}/${filePath}`);

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`❌ [ImageUpload] Erro no upload:`, uploadError);
      return {
        success: false,
        error: uploadError.message
      };
    }

    console.log(`✅ [ImageUpload] Upload realizado com sucesso:`, uploadData.path);

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    console.log(`🔗 [ImageUpload] Link público gerado: ${publicUrl}`);

    return {
      success: true,
      publicUrl,
      fileName,
      filePath: uploadData.path
    };

  } catch (error) {
    console.error(`💥 [ImageUpload] Erro fatal no upload:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
    };
  }
};

/**
 * Deleta uma imagem do Supabase Storage
 * @param filePath - Caminho do arquivo no storage
 * @param bucket - Nome do bucket (default: 'imagens')
 * @returns Promise com resultado da operação
 */
export const deleteImage = async (
  filePath: string,
  bucket: string = 'imagens'
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ [ImageUpload] Deletando imagem: ${bucket}/${filePath}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`❌ [ImageUpload] Erro ao deletar:`, error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`✅ [ImageUpload] Imagem deletada com sucesso`);
    return { success: true };

  } catch (error) {
    console.error(`💥 [ImageUpload] Erro fatal ao deletar:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao deletar'
    };
  }
};

/**
 * Lista imagens de uma pasta no Storage
 * @param bucket - Nome do bucket (default: 'imagens')
 * @param folder - Pasta a listar (default: 'uploads')
 * @param limit - Limite de resultados (default: 100)
 * @returns Promise com lista de arquivos
 */
export const listImages = async (
  bucket: string = 'imagens',
  folder: string = 'uploads',
  limit: number = 100
): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    publicUrl: string;
    size: number;
    createdAt: string;
  }>;
  error?: string;
}> => {
  try {
    console.log(`📂 [ImageUpload] Listando imagens da pasta: ${bucket}/${folder}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error(`❌ [ImageUpload] Erro ao listar:`, error);
      return {
        success: false,
        error: error.message
      };
    }

    // Gerar URLs públicas para cada arquivo
    const files = data?.map(file => {
      const filePath = `${folder}/${file.name}`;
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        publicUrl: urlData.publicUrl,
        size: file.metadata?.size || 0,
        createdAt: file.created_at
      };
    }) || [];

    console.log(`✅ [ImageUpload] ${files.length} imagens encontradas`);

    return {
      success: true,
      files
    };

  } catch (error) {
    console.error(`💥 [ImageUpload] Erro fatal ao listar:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar'
    };
  }
};

/**
 * Verifica se um bucket existe no Supabase Storage
 * @param bucket - Nome do bucket a verificar
 * @returns Promise com resultado da verificação
 */
export const checkBucketExists = async (bucket: string): Promise<{
  exists: boolean;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        exists: false,
        error: error.message
      };
    }

    const bucketExists = data?.some(b => b.name === bucket) || false;
    
    console.log(`🪣 [ImageUpload] Bucket '${bucket}' ${bucketExists ? 'existe' : 'não existe'}`);
    
    return { exists: bucketExists };

  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
