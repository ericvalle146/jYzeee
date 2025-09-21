import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ProdutosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://jvwfdcjqrptlpgxqxnmt.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8'
    );
  }

  // Criar novo produto na tabela 'produtos'
  async createProduct(productData: {
    nome: string;
    preco: number;
    categoria?: string;
    composicao?: string;
    tamanho?: string;
  }) {
    try {
      // Validações obrigatórias
      if (!productData.nome || productData.nome.trim() === '') {
        throw new Error('Nome do produto é obrigatório');
      }

      if (!productData.preco || productData.preco <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }

      // Validações de tamanho dos campos
      if (productData.nome.length > 255) {
        throw new Error('Nome do produto deve ter no máximo 255 caracteres');
      }

      if (productData.categoria && productData.categoria.length > 100) {
        throw new Error('Categoria deve ter no máximo 100 caracteres');
      }

      if (productData.composicao && productData.composicao.length > 255) {
        throw new Error('Composição deve ter no máximo 255 caracteres');
      }

      if (productData.tamanho && productData.tamanho.length > 50) {
        throw new Error('Tamanho deve ter no máximo 50 caracteres');
      }

      // Sanitizar dados
      const sanitizedData = {
        nome: productData.nome.trim(),
        preco: Number(productData.preco),
        categoria: productData.categoria?.trim() || null,
        composicao: productData.composicao?.trim() || null,
        tamanho: productData.tamanho?.trim() || null,
      };

      const { data: newProduct, error } = await this.supabase
        .from('produtos')
        .insert(sanitizedData)
        .select()
        .single();

      if (error) throw error;

      return newProduct;
    } catch (error) {
      throw error;
    }
  }

  // Buscar todos os produtos
  async getAllProducts() {
    try {
      const { data: products, error } = await this.supabase
        .from('produtos')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return products || [];
    } catch (error) {
      return [];
    }
  }

  // Buscar produto por ID
  async getProductById(productId: number) {
    try {
      const { data: product, error } = await this.supabase
        .from('produtos')
        .select('*')
        .eq('id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return product || null;
    } catch (error) {
      return null;
    }
  }

  // Atualizar produto
  async updateProduct(productId: number, productData: {
    nome?: string;
    preco?: number;
    categoria?: string;
    composicao?: string;
    tamanho?: string;
  }) {
    try {
      // Validações se os campos estão sendo atualizados
      if (productData.nome !== undefined) {
        if (!productData.nome || productData.nome.trim() === '') {
          throw new Error('Nome do produto é obrigatório');
        }
        if (productData.nome.length > 255) {
          throw new Error('Nome do produto deve ter no máximo 255 caracteres');
        }
      }

      if (productData.preco !== undefined) {
        if (!productData.preco || productData.preco <= 0) {
          throw new Error('Preço deve ser maior que zero');
        }
      }

      if (productData.categoria !== undefined && productData.categoria && productData.categoria.length > 100) {
        throw new Error('Categoria deve ter no máximo 100 caracteres');
      }

      if (productData.composicao !== undefined && productData.composicao && productData.composicao.length > 255) {
        throw new Error('Composição deve ter no máximo 255 caracteres');
      }

      if (productData.tamanho !== undefined && productData.tamanho && productData.tamanho.length > 50) {
        throw new Error('Tamanho deve ter no máximo 50 caracteres');
      }

      // Sanitizar dados
      const sanitizedData: any = {};
      if (productData.nome !== undefined) {
        sanitizedData.nome = productData.nome.trim();
      }
      if (productData.preco !== undefined) {
        sanitizedData.preco = Number(productData.preco);
      }
      if (productData.categoria !== undefined) {
        sanitizedData.categoria = productData.categoria?.trim() || null;
      }
      if (productData.composicao !== undefined) {
        sanitizedData.composicao = productData.composicao?.trim() || null;
      }
      if (productData.tamanho !== undefined) {
        sanitizedData.tamanho = productData.tamanho?.trim() || null;
      }

      const { data, error } = await this.supabase
        .from('produtos')
        .update(sanitizedData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Deletar produto
  async deleteProduct(productId: number) {
    try {
      const { data, error } = await this.supabase
        .from('produtos')
        .delete()
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }
}
