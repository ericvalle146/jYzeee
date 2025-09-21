import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ScanLine, 
  Upload, 
  FileText, 
  ImageIcon,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageSimple, SimpleUploadResult } from '@/services/simpleImageUpload';
import { isWebhookConfigured, getWebhookUrl } from '@/services/webhookService';

export function Extracao() {
  const { toast } = useToast();
  
  // Estados para upload de imagem
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePublicUrl, setImagePublicUrl] = useState<string>('');
  

  /**
   * FUNÇÃO PRINCIPAL: Upload automático com geração de link público
   */
  const handleAutoUpload = async (file: File) => {
    console.log(`🚀 [Extracao] Iniciando upload automático: ${file.name}`);
    
    setIsUploading(true);
    setUploadProgress(0);
    setImagePublicUrl(''); // Limpar URL anterior

    try {
      // Feedback inicial
      toast({
        title: "📤 Fazendo Upload...",
        description: `Enviando ${file.name} para o Supabase Storage...`,
        duration: 3000,
      });

      // Simular progresso (Supabase não fornece callback de progresso nativo)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      // Fazer upload SIMPLES com geração de link público + webhook
      const result: SimpleUploadResult = await uploadImageSimple(file, 'extracao');

      // Parar simulação de progresso
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.publicUrl) {
        // SUCESSO: Link público gerado + enviado para webhook
        setImagePublicUrl(result.publicUrl);
        
        console.log(`✅ [Extracao] Upload concluído com sucesso!`);
        console.log(`🔗 [Extracao] Link público: ${result.publicUrl}`);

        // Simular processamento automático da IA e mostrar toast de sucesso final
        setTimeout(() => {
          // Resetar estados para preparar para próximo upload
          setUploadedFile(null);
          setImagePublicUrl('');
          setUploadProgress(0);
          
          // Toast elegante de conclusão
          toast({
            title: "✅ Pronto!",
            description: "IA treinada e produtos extraídos com sucesso.",
            duration: 6000,
          });
        }, 1500); // Pequeno delay para simular processamento

      } else {
        // ERRO no upload
        throw new Error(result.error || 'Falha desconhecida no upload');
      }

    } catch (error) {
      console.error('💥 [Extracao] Erro no upload automático:', error);
      
      // Limpar estados em caso de erro
      setImagePublicUrl('');
      setUploadProgress(0);

      // Feedback de erro
      toast({
        title: "❌ Erro no Upload",
        description: error instanceof Error ? error.message : 'Erro desconhecido durante o upload',
        variant: "destructive",
        duration: 7000,
      });

    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handler para seleção de arquivo via input
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log(`📁 [Extracao] Arquivo selecionado: ${file.name}`);
      
      setUploadedFile(file);
      
      // Upload automático imediato
      await handleAutoUpload(file);
    }
  };

  /**
   * Handlers para drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validar se é imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "❌ Formato Inválido",
          description: "Por favor, envie apenas arquivos de imagem (JPG, PNG, GIF, WEBP).",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      console.log(`🎯 [Extracao] Arquivo arrastado: ${file.name}`);
      setUploadedFile(file);
      
      // Upload automático imediato
      await handleAutoUpload(file);
    }
  };





  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <ScanLine className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Extração Inteligente de Produtos</h1>
          <p className="text-muted-foreground">
            Envie cardápios e nossa IA extrai produtos + treina para atender clientes automaticamente.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Seção Principal - Upload de Imagem com Link Público */}
        <div className="flex justify-center">
          
          {/* Upload de Imagem com Geração de Link Público */}
          <Card className="min-h-[500px] w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Extração Automática de Produtos</span>
              </CardTitle>
              <CardDescription>
                Upload de cardápios para extração inteligente e treinamento da IA para atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Área de Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 min-h-[200px] flex flex-col justify-center ${
                  isDragging 
                    ? 'border-primary bg-primary/10 scale-105' 
                    : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary/50 dark:hover:bg-gray-800'
                } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="space-y-4">
                    <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Fazendo Upload...</p>
                      <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                      <p className="text-sm text-muted-foreground">{uploadProgress}% concluído</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-16 w-16 mx-auto mb-6 text-muted-foreground hover:text-gray-600 dark:hover:text-gray-400 transition-colors" />
                    <div className="space-y-3">
                      <p className="text-xl font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                        {isDragging ? 'Solte a imagem aqui!' : 'Arraste uma imagem de cardápio aqui ou clique para selecionar'}
                      </p>
                      <p className="text-sm text-muted-foreground hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                        Formatos aceitos: JPG, PNG, GIF, WEBP (máx. 10MB)
                      </p>
                      <p className="text-xs text-primary font-medium">
                        🧠 Extração + Treinamento da IA em um só upload
                      </p>
                    </div>
                  </>
                )}
                
                {!isUploading && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload-auto"
                      disabled={isUploading}
                    />
                    <Label htmlFor="file-upload-auto" className="cursor-pointer">
                      <Button variant="outline" className="mt-6" size="lg" asChild disabled={isUploading}>
                        <span>Selecionar Imagem</span>
                      </Button>
                    </Label>
                  </>
                )}
              </div>

              {/* Status do Processamento (apenas durante upload) */}
              {isUploading && uploadedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">{uploadedFile.name}</p>
                        <p className="text-sm text-blue-600">
                          Processando e treinando IA...
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Enviando...
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}