import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductUpdated?: () => void;
}

interface EditFormData {
  nome: string;
  categoria: string;
  preco: string;
  composicao: string;
  tamanho: string;
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onProductUpdated,
}: EditProductDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    nome: '',
    categoria: '',
    preco: '',
    composicao: '',
    tamanho: ''
  });

  const [errors, setErrors] = useState<Partial<EditFormData>>({});

  // Pré-preencher formulário quando produto for selecionado
  useEffect(() => {
    if (product && open) {
      setFormData({
        nome: product.nome || '',
        categoria: product.categoria || '',
        preco: product.preco ? product.preco.toString().replace('.', ',') : '',
        composicao: product.composicao || '',
        tamanho: product.tamanho || ''
      });
      setErrors({});
    }
  }, [product, open]);

  // Validações do formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<EditFormData> = {};

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
  const handleInputChange = (field: keyof EditFormData, value: string) => {
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

  // Função para enviar webhook de atualização
  const sendUpdateWebhook = async () => {
    if (!product) return;

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_CRUD_PRODUTOS;
      
      if (!webhookUrl) {
        console.error('VITE_WEBHOOK_CRUD_PRODUTOS não está definida no arquivo .env');
        return;
      }
      
      const payload = {
        "crud_function": "atualizar",
        "product_id": product.id.toString(),
        "dados": {
          "nome": formData.nome.trim(),
          "categoria": formData.categoria.trim(),
          "preço": formData.preco.replace(',', '.'),
          "tamanho": formData.tamanho.trim(),
          "composicao": formData.composicao.trim()
        }
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Erro ao enviar webhook de atualização:', error);
      // Não interrompe o fluxo principal mesmo se o webhook falhar
    }
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !product) {
      return;
    }

    setIsLoading(true);

    try {
      // Enviar webhook de atualização
      await sendUpdateWebhook();

      toast({
        title: "Produto Atualizado!",
        description: "Os dados do produto foram enviados para atualização.",
        duration: 5000,
      });

      // Fechar modal
      onOpenChange(false);
      
      // Notificar componente pai
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro ao Atualizar",
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
      categoria: '',
      preco: '',
      composicao: '',
      tamanho: ''
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Editar Produto</span>
          </DialogTitle>
          <DialogDescription>
            Editar informações do produto ID: {product.id}. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Nome do Produto */}
            <div className="space-y-2">
              <Label htmlFor="edit-nome" className="text-sm font-medium">
                Nome do Produto *
              </Label>
              <Input
                id="edit-nome"
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
              <Label htmlFor="edit-preco" className="text-sm font-medium">
                Preço *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="edit-preco"
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
              <Label htmlFor="edit-categoria" className="text-sm font-medium">
                Categoria
              </Label>
              <Input
                id="edit-categoria"
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
              <Label htmlFor="edit-composicao" className="text-sm font-medium">
                Composição
              </Label>
              <Textarea
                id="edit-composicao"
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
              <Label htmlFor="edit-tamanho" className="text-sm font-medium">
                Tamanho
              </Label>
              <Input
                id="edit-tamanho"
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
