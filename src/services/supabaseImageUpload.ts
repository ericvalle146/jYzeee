/**
 * SERVIÇO DE UPLOAD DE IMAGENS - SUPABASE STORAGE
 * 
 * Sistema completo para upload automático de imagens e geração de links públicos
 * Implementa todas as funcionalidades solicitadas:
 * - Upload automático para Supabase Storage
 * - Geração de link público instantâneo
 * - Validação de arquivos
 * - Tratamento de erros robusto
 * - Nomes únicos para evitar conflitos
 */

import { supabase } from '../config/supabase';

// Interface para resultado do upload
export interface ImageUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  filePath?: string;
  error?: string;
  uploadProgress?: number;
}

// Interface para configurações do upload
export interface UploadConfig {
  bucket?: string;
  folder?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

// Configurações padrão
const DEFAULT_CONFIG: Required<UploadConfig> = {
  bucket: 'imagens-publicas',
  folder: 'uploads',
  maxSizeInMB: 10,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  generateThumbnail: false
};

/**
 * PASSO 1: Validar arquivo antes do upload
 */
const validateImageFile = (file: File, config: Required<UploadConfig>): { valid: boolean; error?: string } => {
  console.log(`🔍 [ImageUpload] Validando arquivo: ${file.name}`);
  
  // Verificar se é um arquivo
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo foi fornecido' };
  }

  // Verificar tipo do arquivo
  if (!config.allowedTypes.includes(file.type)) {
    console.error(`❌ [ImageUpload] Tipo não permitido: ${file.type}`);
    return { 
      valid: false, 
      error: `Tipo de arquivo não permitido. Aceitos: ${config.allowedTypes.join(', ')}` 
    };
  }

  // Verificar tamanho do arquivo
  const maxSizeInBytes = config.maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    console.error(`❌ [ImageUpload] Arquivo muito grande: ${file.size} bytes`);
    return { 
      valid: false, 
      error: `Arquivo muito grande. Máximo permitido: ${config.maxSizeInMB}MB` 
    };
  }

  console.log(`✅ [ImageUpload] Arquivo válido: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  return { valid: true };
};

/**
 * PASSO 2: Gerar nome único para o arquivo
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
  
  const uniqueName = `${timestamp}_${randomString}_${sanitizedName}.${extension}`;
  console.log(`📝 [ImageUpload] Nome único gerado: ${uniqueName}`);
  
  return uniqueName;
};

/**
 * PASSO 3: Verificar/criar bucket público
 */
const ensureBucketExists = async (bucketName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🪣 [ImageUpload] Verificando bucket: ${bucketName}`);
    
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ [ImageUpload] Erro ao listar buckets:`, listError);
      return { success: false, error: listError.message };
    }

    // Verificar se o bucket já existe
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ [ImageUpload] Bucket '${bucketName}' já existe`);
      return { success: true };
    }

    // Criar bucket público se não existir
    console.log(`🔨 [ImageUpload] Criando bucket público: ${bucketName}`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (createError) {
      console.error(`❌ [ImageUpload] Erro ao criar bucket:`, createError);
      return { success: false, error: createError.message };
    }

    console.log(`✅ [ImageUpload] Bucket '${bucketName}' criado com sucesso`);
    return { success: true };

  } catch (error) {
    console.error(`💥 [ImageUpload] Erro fatal ao verificar bucket:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar bucket' 
    };
  }
};

/**
 * FUNÇÃO PRINCIPAL: Upload de imagem com link público
 */
export const uploadImageWithPublicLink = async (
  file: File, 
  customConfig?: Partial<UploadConfig>
): Promise<ImageUploadResult> => {
  
  // Merge configurações
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  console.log(`🚀 [ImageUpload] Iniciando upload: ${file.name}`);
  console.log(`📋 [ImageUpload] Configurações:`, config);

  try {
    // PASSO 1: Validar arquivo
    const validation = validateImageFile(file, config);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // PASSO 2: Gerar nome único
    const uniqueFileName = generateUniqueFileName(file.name);
    const filePath = `${config.folder}/${uniqueFileName}`;

    // PASSO 3: Verificar/criar bucket
    const bucketCheck = await ensureBucketExists(config.bucket);
    if (!bucketCheck.success) {
      return { success: false, error: bucketCheck.error };
    }

    // PASSO 4: Fazer upload para Supabase Storage
    console.log(`📤 [ImageUpload] Fazendo upload para: ${config.bucket}/${filePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Não sobrescrever arquivos existentes
        contentType: file.type
      });

    if (uploadError) {
      console.error(`❌ [ImageUpload] Erro no upload:`, uploadError);
      return { success: false, error: `Erro no upload: ${uploadError.message}` };
    }

    console.log(`✅ [ImageUpload] Upload realizado com sucesso:`, uploadData.path);

    // PASSO 5: Gerar link público
    console.log(`🔗 [ImageUpload] Gerando link público...`);
    
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      console.error(`❌ [ImageUpload] Falha ao gerar link público`);
      return { success: false, error: 'Falha ao gerar link público' };
    }

    const publicUrl = urlData.publicUrl;
    console.log(`🎉 [ImageUpload] Link público gerado: ${publicUrl}`);

    // PASSO 6: Verificar se o link está acessível
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn(`⚠️ [ImageUpload] Link pode não estar acessível ainda: ${response.status}`);
      }
    } catch (fetchError) {
      console.warn(`⚠️ [ImageUpload] Não foi possível verificar acessibilidade do link`);
    }

    // SUCESSO: Retornar resultado completo
    return {
      success: true,
      publicUrl,
      fileName: uniqueFileName,
      filePath: uploadData.path,
      uploadProgress: 100
    };

  } catch (error) {
    console.error(`💥 [ImageUpload] Erro fatal no upload:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido durante o upload'
    };
  }
};

/**
 * FUNÇÃO AUXILIAR: Deletar imagem
 */
export const deleteImage = async (filePath: string, bucketName: string = DEFAULT_CONFIG.bucket): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ [ImageUpload] Deletando: ${bucketName}/${filePath}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`❌ [ImageUpload] Erro ao deletar:`, error);
      return { success: false, error: error.message };
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
 * FUNÇÃO AUXILIAR: Listar imagens do bucket
 */
export const listImages = async (
  bucketName: string = DEFAULT_CONFIG.bucket,
  folder: string = DEFAULT_CONFIG.folder,
  limit: number = 50
): Promise<{ success: boolean; images?: Array<{ name: string; publicUrl: string; size: number; createdAt: string }>; error?: string }> => {
  try {
    console.log(`📂 [ImageUpload] Listando imagens: ${bucketName}/${folder}`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error(`❌ [ImageUpload] Erro ao listar:`, error);
      return { success: false, error: error.message };
    }

    const images = data?.map(file => {
      const filePath = `${folder}/${file.name}`;
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      return {
        name: file.name,
        publicUrl: urlData.publicUrl,
        size: file.metadata?.size || 0,
        createdAt: file.created_at
      };
    }) || [];

    console.log(`✅ [ImageUpload] ${images.length} imagens encontradas`);
    return { success: true, images };

  } catch (error) {
    console.error(`💥 [ImageUpload] Erro fatal ao listar:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar' 
    };
  }
};

// Exportar configurações para uso externo
export { DEFAULT_CONFIG as UPLOAD_CONFIG };
