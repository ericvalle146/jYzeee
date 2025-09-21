/**
 * SERVIÇO DE WEBHOOK PARA LINKS PÚBLICOS
 * 
 * Envia automaticamente o link público gerado para o webhook configurado
 * Processo transparente que não interfere na experiência do usuário
 */

// Interface para dados do webhook
export interface WebhookLinkData {
  link: string;
}

// Interface para resultado do webhook
export interface WebhookResult {
  success: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Enviar link público para webhook
 * @param publicUrl - Link público gerado pelo Supabase
 * @returns Promise com resultado do envio
 */
export const sendLinkToWebhook = async (publicUrl: string): Promise<WebhookResult> => {
  try {
    // Obter URL do webhook do .env
    const webhookUrl = import.meta.env.VITE_WEBHOOK_LINK_URL;
    
    if (!webhookUrl) {
      console.warn('⚠️ [Webhook] VITE_WEBHOOK_LINK_URL não configurada no .env');
      return { 
        success: false, 
        error: 'Webhook URL não configurada' 
      };
    }

    console.log(`📤 [Webhook] Enviando link para: ${webhookUrl}`);
    console.log(`🔗 [Webhook] Link: ${publicUrl}`);

    // Preparar dados para envio
    const webhookData: WebhookLinkData = {
      link: publicUrl
    };

    // Fazer requisição POST para o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SaaS-Jyze-ImageUpload/1.0'
      },
      body: JSON.stringify(webhookData)
    });

    const statusCode = response.status;
    console.log(`📊 [Webhook] Status: ${statusCode}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error(`❌ [Webhook] Erro ${statusCode}: ${errorText}`);
      
      return {
        success: false,
        error: `HTTP ${statusCode}: ${errorText}`,
        statusCode
      };
    }

    // Tentar ler resposta (opcional)
    let responseData;
    try {
      responseData = await response.json();
      console.log(`✅ [Webhook] Resposta:`, responseData);
    } catch {
      // Se não for JSON, não tem problema
      console.log(`✅ [Webhook] Enviado com sucesso (resposta não-JSON)`);
    }

    return {
      success: true,
      statusCode
    };

  } catch (error) {
    console.error('💥 [Webhook] Erro fatal ao enviar link:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Enviar link para webhook de forma assíncrona (não bloqueia interface)
 * @param publicUrl - Link público gerado
 */
export const sendLinkToWebhookAsync = (publicUrl: string): void => {
  // Executar em background sem bloquear a interface
  sendLinkToWebhook(publicUrl)
    .then(result => {
      if (result.success) {
        console.log(`🎉 [Webhook] Link enviado com sucesso para webhook`);
      } else {
        console.warn(`⚠️ [Webhook] Falha no envio (não crítico): ${result.error}`);
      }
    })
    .catch(error => {
      console.warn(`⚠️ [Webhook] Erro não crítico:`, error);
    });
};

/**
 * Validar configuração do webhook
 * @returns boolean indicando se está configurado corretamente
 */
export const isWebhookConfigured = (): boolean => {
  const webhookUrl = import.meta.env.VITE_WEBHOOK_LINK_URL;
  return !!(webhookUrl && webhookUrl.startsWith('http'));
};

/**
 * Obter URL do webhook configurada
 * @returns string com a URL ou undefined se não configurada
 */
export const getWebhookUrl = (): string | undefined => {
  return import.meta.env.VITE_WEBHOOK_LINK_URL;
};

/**
 * Testar conexão com webhook
 * @returns Promise com resultado do teste
 */
export const testWebhookConnection = async (): Promise<WebhookResult> => {
  try {
    const testUrl = 'https://httpbin.org/status/200'; // URL de teste
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SaaS-Jyze-WebhookTest/1.0'
      }
    });

    if (response.ok) {
      console.log('✅ [Webhook] Conexão de rede OK');
      return { success: true, statusCode: response.status };
    } else {
      return { 
        success: false, 
        error: `Teste de conexão falhou: ${response.status}`,
        statusCode: response.status 
      };
    }

  } catch (error) {
    console.error('❌ [Webhook] Erro no teste de conexão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão'
    };
  }
};

// Log da configuração ao importar o módulo
console.log(`🔧 [Webhook] Configuração carregada:`);
console.log(`   URL: ${getWebhookUrl() || 'NÃO CONFIGURADA'}`);
console.log(`   Status: ${isWebhookConfigured() ? '✅ Configurada' : '❌ Não configurada'}`);
