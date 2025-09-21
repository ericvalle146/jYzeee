import React from 'react';

export function DebugTest() {
  console.log('🔍 DEBUG: Componente DebugTest renderizando - TESTE BÁSICO');
  
  return (
    <div style={{
      padding: '20px',
      border: '2px solid red',
      backgroundColor: '#f0f0f0',
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h2 style={{ color: 'red', fontSize: '24px' }}>🔍 DEBUG: TESTE DE RENDERIZAÇÃO</h2>
      <p style={{ fontSize: '16px', marginTop: '10px' }}>
        Se você está vendo este componente, a página está renderizando corretamente.
      </p>
      <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
        Timestamp: {new Date().toISOString()}
      </p>
      <button 
        onClick={() => {
          console.log('🔍 DEBUG: Botão clicado!');
          alert('Página funcionando!');
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Clique para testar
      </button>
    </div>
  );
}




