import { Controller, Get, Post, Put, Delete, Query, Param, Body } from '@nestjs/common';
import { ProdutosService } from './produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  // ================================
  // ENDPOINTS DE LEITURA
  // ================================

  @Get()
  async getAllProducts() {
    try {
      const products = await this.produtosService.getAllProducts();
      return {
        status: 'success',
        data: products,
        count: products.length
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: []
      };
    }
  }

  @Get(':id')
  async getProductById(@Param('id') id: number) {
    try {
      const product = await this.produtosService.getProductById(id);
      if (!product) {
        return {
          status: 'error',
          message: 'Produto não encontrado',
          data: null
        };
      }
      return {
        status: 'success',
        data: product
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }

  // ================================
  // ENDPOINTS DE ESCRITA
  // ================================

  @Post()
  async createProduct(@Body() productData: {
    nome: string;
    preco: number;
    categoria?: string;
    composicao?: string;
    tamanho?: string;
  }) {
    try {
      const product = await this.produtosService.createProduct(productData);
      return {
        status: 'success',
        message: 'Produto criado com sucesso',
        data: product
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() productData: {
      nome?: string;
      preco?: number;
      categoria?: string;
      composicao?: string;
      tamanho?: string;
    }
  ) {
    try {
      const product = await this.produtosService.updateProduct(id, productData);
      return {
        status: 'success',
        message: 'Produto atualizado com sucesso',
        data: product
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: number) {
    try {
      const product = await this.produtosService.deleteProduct(id);
      return {
        status: 'success',
        message: 'Produto deletado com sucesso',
        data: product
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        data: null
      };
    }
  }
}
