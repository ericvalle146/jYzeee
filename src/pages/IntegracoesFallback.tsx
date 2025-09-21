import React from 'react';

const IntegracoesFallback = () => {
  console.log('🔍 DEBUG: Página IntegracoesFallback renderizando');

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        backgroundColor: '#ff4444', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
          🔍 DEBUG MODE - Integrações WhatsApp
        </h1>
        <p style={{ margin: '0', fontSize: '16px' }}>
          Página de fallback para debug - Se você vê isso, o roteamento funciona!
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginTop: '0' }}>Status do Sistema:</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li>✅ React está funcionando</li>
          <li>✅ Roteamento está funcionando</li>
          <li>✅ Página está renderizando</li>
          <li>✅ Console logs estão funcionando</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#e8f4fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: '0' }}>Variáveis de Ambiente:</h3>
        <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <p><strong>EVOLUTION_API_URL:</strong> {import.meta.env.VITE_EVOLUTION_API_URL || 'NÃO DEFINIDA'}</p>
          <p><strong>EVOLUTION_API_KEY:</strong> {import.meta.env.VITE_EVOLUTION_API_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA'}</p>
          <p><strong>WHATSAPP_INSTANCE_NAME:</strong> {import.meta.env.VITE_WHATSAPP_INSTANCE_NAME || 'JyzeCliente (padrão)'}</p>
        </div>
      </div>

      <button 
        onClick={() => {
          console.log('🔍 DEBUG: Testando funcionalidade básica');
          alert('Sistema funcionando corretamente!');
        }}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Testar Funcionalidade
      </button>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p>Timestamp: {new Date().toISOString()}</p>
        <p>Localização: /integracoes</p>
      </div>
    </div>
  );
};

export default IntegracoesFallback;




