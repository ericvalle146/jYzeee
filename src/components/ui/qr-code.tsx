import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeProps> = ({ 
  value, 
  size = 200, 
  className = "" 
}) => {
  // Simular um QR Code visual usando caracteres ASCII
  const generateQRPattern = (text: string, size: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = size;
    canvas.height = size;
    
    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Padrão QR simulado
    ctx.fillStyle = '#000000';
    const moduleSize = size / 25; // Grid 25x25
    
    // Padrão baseado no hash do texto
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Gerar padrão pseudo-aleatório
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        const seed = hash + x * 31 + y * 37;
        if (Math.abs(seed) % 3 === 0) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    // Adicionar marcadores de posição (corners)
    const drawPositionMarker = (x: number, y: number) => {
      const markerSize = moduleSize * 7;
      // Borda externa
      ctx.fillRect(x, y, markerSize, markerSize);
      // Borda interna (branca)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, markerSize - 2 * moduleSize, markerSize - 2 * moduleSize);
      // Centro (preto)
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, markerSize - 4 * moduleSize, markerSize - 4 * moduleSize);
    };
    
    // Marcadores nos cantos
    drawPositionMarker(0, 0); // Top-left
    drawPositionMarker(size - 7 * moduleSize, 0); // Top-right
    drawPositionMarker(0, size - 7 * moduleSize); // Bottom-left
    
    return canvas.toDataURL();
  };

  const qrCodeDataUrl = React.useMemo(() => {
    return generateQRPattern(value, size);
  }, [value, size]);

  return (
    <div className={`inline-block p-4 bg-white rounded-lg shadow-lg ${className}`}>
      <img 
        src={qrCodeDataUrl} 
        alt="QR Code" 
        width={size} 
        height={size}
        className="block"
      />
      <p className="text-xs text-gray-500 mt-2 text-center max-w-[200px] break-words">
        {value.length > 30 ? `${value.substring(0, 30)}...` : value}
      </p>
    </div>
  );
};

export default QRCodeDisplay;
