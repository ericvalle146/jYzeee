#!/usr/bin/env node

/**
 * SCRIPT DE TESTE PARA API DE MENSAGENS
 * 
 * Testa o endpoint POST /messages/count com payload {"contador": "1"}
 * Valida se a API está funcionando corretamente
 */

const API_URL = 'http://localhost:3002/messages/count';

async function testMessageAPI() {
  console.log('🧪 [TEST] Testando API de Mensagens...');
  console.log('🔗 [TEST] URL:', API_URL);
  
  try {
    // Teste 1: Payload correto
    console.log('\n📨 [TEST] Teste 1: Enviando payload correto {"contador": "1"}');
    
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contador: '1' })
    });

    const result1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ [TEST] Teste 1 PASSOU - API respondeu corretamente:');
      console.log('   Status:', response1.status);
      console.log('   Resposta:', JSON.stringify(result1, null, 2));
    } else {
      console.log('❌ [TEST] Teste 1 FALHOU - Erro na API:');
      console.log('   Status:', response1.status);
      console.log('   Erro:', JSON.stringify(result1, null, 2));
    }

    // Teste 2: Payload incorreto
    console.log('\n📨 [TEST] Teste 2: Enviando payload incorreto {"contador": "2"}');
    
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contador: '2' })
    });

    const result2 = await response2.json();
    
    if (response2.status === 400) {
      console.log('✅ [TEST] Teste 2 PASSOU - API rejeitou payload incorreto:');
      console.log('   Status:', response2.status);
      console.log('   Resposta:', JSON.stringify(result2, null, 2));
    } else {
      console.log('❌ [TEST] Teste 2 FALHOU - API deveria rejeitar payload incorreto:');
      console.log('   Status:', response2.status);
      console.log('   Resposta:', JSON.stringify(result2, null, 2));
    }

    // Teste 3: Múltiplas mensagens
    console.log('\n📨 [TEST] Teste 3: Enviando 5 mensagens válidas');
    
    for (let i = 1; i <= 5; i++) {
      console.log(`   Enviando mensagem ${i}/5...`);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contador: '1' })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Mensagem ${i} enviada - ID: ${result.data?.id}`);
      } else {
        const error = await response.json();
        console.log(`   ❌ Mensagem ${i} falhou:`, error);
      }
      
      // Pequeno delay entre as mensagens
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 [TEST] Testes concluídos!');
    console.log('📊 [TEST] Verifique o dashboard para ver as mensagens registradas.');
    
  } catch (error) {
    console.error('❌ [TEST] Erro durante os testes:', error.message);
    console.error('💡 [TEST] Certifique-se de que o backend está rodando em localhost:3002');
  }
}

// Executar testes
testMessageAPI();
