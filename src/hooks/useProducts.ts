import { useState, useEffect } from 'react';

export interface Product {
  id: number;
  nome: string;
  preco: number;
  categoria?: string;
  composicao?: string;
  tamanho?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/produtos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        setProducts(result.data || []);
      } else {
        throw new Error(result.message || 'Erro ao buscar produtos');
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar produtos');
      setProducts([]); // Limpar produtos em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    isLoading,
    error,
    refetch,
  };
};
