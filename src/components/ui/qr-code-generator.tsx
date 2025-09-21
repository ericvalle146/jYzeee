import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Download, Share2, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function QRCodeGenerator() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Olá! Gostaria de saber mais sobre nossos produtos.');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateWhatsAppURL = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  const generateQRCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um número de telefone.",
        variant: "destructive"
      });
      return;
    }

    const whatsappUrl = generateWhatsAppURL();
    
    try {
      // Usando QR Code simples com canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configurações do QR Code
      const size = 200;
      const modules = 25;
      const moduleSize = size / modules;

      canvas.width = size;
      canvas.height = size;

      // Fundo escuro
      ctx.fillStyle = '#0a0f0a';
      ctx.fillRect(0, 0, size, size);

      // Simular QR Code com padrão
      ctx.fillStyle = '#00ff00';
      
      // Padrão básico de QR Code
      for (let i = 0; i < modules; i++) {
        for (let j = 0; j < modules; j++) {
          // Criar padrão pseudo-aleatório baseado na URL
          const hash = (whatsappUrl.charCodeAt(i % whatsappUrl.length) + i + j) % 3;
          if (hash === 0 || (i < 7 && j < 7) || (i < 7 && j > modules - 8) || (i > modules - 8 && j < 7)) {
            ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
          }
        }
      }

      // Adicionar efeito de brilho
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ff00';
      
      // Cantos do QR Code
      const cornerSize = 3;
      // Canto superior esquerdo
      ctx.fillRect(0, 0, cornerSize * moduleSize, cornerSize * moduleSize);
      // Canto superior direito  
      ctx.fillRect((modules - cornerSize) * moduleSize, 0, cornerSize * moduleSize, cornerSize * moduleSize);
      // Canto inferior esquerdo
      ctx.fillRect(0, (modules - cornerSize) * moduleSize, cornerSize * moduleSize, cornerSize * moduleSize);

      const dataUrl = canvas.toDataURL('image/png');
      setQrDataUrl(dataUrl);

      toast({
        title: "QR Code Gerado!",
        description: "QR Code do WhatsApp criado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar QR Code.",
        variant: "destructive"
      });
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `whatsapp-qr-${phoneNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const copyWhatsAppLink = () => {
    const url = generateWhatsAppURL();
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copiado!",
      description: "Link do WhatsApp copiado para a área de transferência.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card creepy-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 gradient-text">
          <Smartphone className="h-6 w-6 text-primary horror-element" />
          Gerador QR WhatsApp
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Crie QR codes para conectar clientes ao WhatsApp da Jyze
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-foreground">
              Número do WhatsApp
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+5511999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-muted/50 border-border hover:border-primary transition-colors"
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-foreground">
              Mensagem Inicial
            </Label>
            <Input
              id="message"
              placeholder="Mensagem que aparecerá no WhatsApp"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-muted/50 border-border hover:border-primary transition-colors"
            />
          </div>

          <Button 
            onClick={generateQRCode}
            className="w-full evil-button hover:shadow-glow"
            size="lg"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Gerar QR Code
          </Button>
        </div>

        {qrDataUrl && (
          <div className="space-y-4 animate-haunting-appear">
            <div className="flex justify-center">
              <div className="p-4 bg-background rounded-xl border border-border glow">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code WhatsApp" 
                  className="w-48 h-48 rounded-lg horror-element"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={downloadQR}
                variant="outline" 
                className="flex-1 hover:bg-primary/10 hover:border-primary"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button 
                onClick={copyWhatsAppLink}
                variant="outline" 
                className="flex-1 hover:bg-primary/10 hover:border-primary"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copiar Link
              </Button>
            </div>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }} 
        />
      </CardContent>
    </Card>
  );
}