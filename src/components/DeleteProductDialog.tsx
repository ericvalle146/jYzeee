import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirmDelete: (productId: number) => Promise<void>;
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onConfirmDelete,
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete(product.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Confirmar Exclusão</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Tem certeza que deseja excluir este produto?</p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="font-medium text-gray-900">
                <strong>Nome:</strong> {product.nome}
              </p>
              <p className="text-sm text-gray-600">
                <strong>ID:</strong> {product.id}
              </p>
              {product.categoria && (
                <p className="text-sm text-gray-600">
                  <strong>Categoria:</strong> {product.categoria}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(product.preco)}
              </p>
            </div>
            <p className="text-red-600 font-medium">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Confirmar Exclusão'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
