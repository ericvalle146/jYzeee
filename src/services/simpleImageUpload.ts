/**
 * SERVIÇO SIMPLES DE UPLOAD DE IMAGENS
 * 
 * APENAS:
 * 1. Upload para Supabase Storage
 * 2. Gerar link público
 * 3. Enviar para webhook
 * 4. Retornar resultado
 * 
 * SEM BANCO DE DADOS, SEM TABELAS, SEM COMPLICAÇÕES!
 */

import { supabase } from '../config/supabase';
import { sendLinkToWebhookAsync } from './webhookService';

// Interface simplificada para resultado do upload
export interface SimpleUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload simples: Storage + Link + Webhook
 * @param file - Arquivo de imagem
 * @param folder - Pasta no bucket (default: 'uploads')
 * @returns Promise com resultado do upload
 */
export const uploadImageSimple = async (
  file: File,
  folder: string = 'uploads'
): Promise<SimpleUploadResult> => {
  
  console.log(`🚀 [SimpleUpload] Upload simples iniciado: ${file.name}`);

  try {
    // 1. VALIDAR ARQUIVO
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Arquivo deve ser uma imagem' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito grande. Máximo 10MB' };
    }

    // 2. GERAR NOME ÚNICO
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueFileName = `${timestamp}_${randomString}.${extension}`;
    const bucketName = 'imagens-publicas';
    const filePath = `${folder}/${uniqueFileName}`;

    console.log(`📤 [SimpleUpload] Upload para: ${bucketName}/${filePath}`);

    // 3. CRIAR BUCKET SE NÃO EXISTIR
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`🪣 [SimpleUpload] Criando bucket: ${bucketName}`);
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createBucketError) {
        console.error('❌ [SimpleUpload] Erro ao criar bucket:', createBucketError);
        return { success: false, error: createBucketError.message };
      }
    }

    // 4. FAZER UPLOAD PARA STORAGE
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('❌ [SimpleUpload] Erro no upload:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('✅ [SimpleUpload] Upload realizado:', uploadData.path);

    // 5. GERAR LINK PÚBLICO
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('🔗 [SimpleUpload] Link público:', publicUrl);

    // 6. ENVIAR PARA WEBHOOK (assíncrono, não bloqueia)
    console.log('📤 [SimpleUpload] Enviando para webhook...');
    sendLinkToWebhookAsync(publicUrl);

    // 7. SUCESSO!
    console.log('🎉 [SimpleUpload] Processo concluído com sucesso!');

    return {
      success: true,
      publicUrl,
      fileName: uniqueFileName
    };

  } catch (error) {
    console.error('💥 [SimpleUpload] Erro fatal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Deletar imagem do Storage (sem banco)
 * @param fileName - Nome do arquivo
 * @param folder - Pasta no bucket
 * @returns Promise com resultado
 */
export const deleteImageSimple = async (
  fileName: string,
  folder: string = 'uploads'
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ [SimpleUpload] Deletando: ${fileName}`);

    const bucketName = 'imagens-publicas';
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('❌ [SimpleUpload] Erro ao deletar:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [SimpleUpload] Imagem deletada com sucesso');
    return { success: true };

  } catch (error) {
    console.error('💥 [SimpleUpload] Erro fatal ao deletar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
