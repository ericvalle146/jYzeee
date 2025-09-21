import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Check, Loader2, Package, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductFormData {
  nome: string;
  preco: string;
  categoria: string;
  composicao: string;
  tamanho: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: () => void;
}

export function ProductForm({ open, onOpenChange, onProductCreated }: ProductFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    nome: '',
    preco: '',
    categoria: '',
    composicao: '',
    tamanho: ''
  });

  const [errors, setErrors] = useState<Partial<ProductFormData>>({});

  // Validações do formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {};

    // Nome é obrigatório
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do produto é obrigatório';
    } else if (formData.nome.length > 255) {
      newErrors.nome = 'Nome deve ter no máximo 255 caracteres';
    }

    // Preço é obrigatório e deve ser maior que zero
    if (!formData.preco.trim()) {
      newErrors.preco = 'Preço é obrigatório';
    } else {
      const preco = parseFloat(formData.preco.replace(',', '.'));
      if (isNaN(preco) || preco <= 0) {
        newErrors.preco = 'Preço deve ser um número maior que zero';
      }
    }

    // Validações de tamanho para campos opcionais
    if (formData.categoria && formData.categoria.length > 100) {
      newErrors.categoria = 'Categoria deve ter no máximo 100 caracteres';
    }

    if (formData.composicao && formData.composicao.length > 255) {
      newErrors.composicao = 'Composição deve ter no máximo 255 caracteres';
    }

    if (formData.tamanho && formData.tamanho.length > 50) {
      newErrors.tamanho = 'Tamanho deve ter no máximo 50 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipular mudanças nos campos
  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Formatar preço enquanto digita
  const handlePriceChange = (value: string) => {
    // Permitir apenas números, vírgula e ponto
    const cleanValue = value.replace(/[^\d.,]/g, '');
    handleInputChange('preco', cleanValue);
  };

  // Função para enviar webhook
  const sendWebhook = async (productId?: number) => {
    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_CRUD_PRODUTOS;
      
      if (!webhookUrl) {
        console.error('VITE_WEBHOOK_CRUD_PRODUTOS não está definida no arquivo .env');
        return;
      }
      
      const payload = {
        "crud_function": "criar",
        "status": "ativar",
        ...(productId && { "product_id": productId })
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      // Não interrompe o fluxo principal mesmo se o webhook falhar
    }
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Preparar dados para envio
      const productData = {
        nome: formData.nome.trim(),
        preco: parseFloat(formData.preco.replace(',', '.')),
        categoria: formData.categoria.trim() || undefined,
        composicao: formData.composicao.trim() || undefined,
        tamanho: formData.tamanho.trim() || undefined,
      };

      // Fazer requisição para o backend
      const response = await fetch('https://api.jyze.space/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Enviar webhook APÓS o produto ser criado com sucesso, incluindo o ID
        await sendWebhook(result.data?.id);

        toast({
          title: "Produto Cadastrado!",
          description: "O produto foi adicionado com sucesso ao catálogo.",
          duration: 5000,
        });

        // Limpar formulário
        setFormData({
          nome: '',
          preco: '',
          categoria: '',
          composicao: '',
          tamanho: ''
        });
        
        // Fechar modal
        onOpenChange(false);
        
        // Notificar componente pai
        if (onProductCreated) {
          onProductCreated();
        }
      } else {
        throw new Error(result.message || 'Erro ao cadastrar produto');
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast({
        title: "Erro ao Cadastrar",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar e fechar modal
  const handleCancel = () => {
    setFormData({
      nome: '',
      preco: '',
      categoria: '',
      composicao: '',
      tamanho: ''
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Cadastrar Novo Produto</span>
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do produto. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Nome do Produto */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome do Produto *
              </Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Pizza Margherita, Hambúrguer Artesanal..."
                className={errors.nome ? 'border-red-500' : ''}
                maxLength={255}
              />
              {errors.nome && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.nome}</span>
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="preco" className="text-sm font-medium">
                Preço *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="preco"
                  type="text"
                  value={formData.preco}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="25,90"
                  className={`pl-10 ${errors.preco ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.preco && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.preco}</span>
                </p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-sm font-medium">
                Categoria
              </Label>
              <Input
                id="categoria"
                type="text"
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                placeholder="Ex: Pizza, Lanche, Bebida, Sobremesa..."
                className={errors.categoria ? 'border-red-500' : ''}
                maxLength={100}
              />
              {errors.categoria && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.categoria}</span>
                </p>
              )}
            </div>

            {/* Composição */}
            <div className="space-y-2">
              <Label htmlFor="composicao" className="text-sm font-medium">
                Composição
              </Label>
              <Textarea
                id="composicao"
                value={formData.composicao}
                onChange={(e) => handleInputChange('composicao', e.target.value)}
                placeholder="Ex: Molho de tomate, mussarela, manjericão..."
                className={errors.composicao ? 'border-red-500' : ''}
                maxLength={255}
                rows={3}
              />
              {errors.composicao && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.composicao}</span>
                </p>
              )}
            </div>

            {/* Tamanho */}
            <div className="space-y-2">
              <Label htmlFor="tamanho" className="text-sm font-medium">
                Tamanho
              </Label>
              <Input
                id="tamanho"
                type="text"
                value={formData.tamanho}
                onChange={(e) => handleInputChange('tamanho', e.target.value)}
                placeholder="Ex: Grande, Médio, 500ml, Individual..."
                className={errors.tamanho ? 'border-red-500' : ''}
                maxLength={50}
              />
              {errors.tamanho && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.tamanho}</span>
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
