import { printLayoutService } from './printLayoutService';
import { unifiedPrinterService } from './unifiedPrinterService';
import { PrintLayoutConfig, AvailableField } from '../types/printer';
import { Order } from '../types/orders';

/**
 * 🎨 SERVIÇO DE IMPRESSÃO DINÂMICA
 * 
 * Este serviço é responsável pela integração entre:
 * - Configurações de layout da página "Configurar Layout"
 * - Sistema de impressão unificado
 * - Geração dinâmica de conteúdo baseado nas configurações
 */
class DynamicPrintService {
  
  /**
   * 🖨️ IMPRIMIR COM LAYOUT DINÂMICO
   * Método principal que combina configuração + impressão
   */
  async printWithDynamicLayout(
    order: Order,
    printerId: string,
    layoutId?: string,
    customValues?: Record<string, any>
  ): Promise<{ success: boolean; message: string; layoutUsed?: string }> {
    try {
      console.log('🎨 Iniciando impressão com layout dinâmico...');
      console.log('📋 Parâmetros:', { orderId: order.id, printerId, layoutId, customValues });

      // 1. Buscar configuração de layout
      const layout = this.getLayoutForPrint(layoutId);
      console.log(`📐 Layout selecionado: ${layout.name} (ID: ${layout.id})`);

      // 2. Validar configuração
      const validation = this.validateLayout(layout);
      if (!validation.isValid) {
        console.warn('⚠️ Layout com problemas:', validation.issues);
      }

      // 3. Gerar conteúdo dinâmico
      const printContent = this.generateDynamicContent(order, layout, customValues);
      console.log('📄 Conteúdo gerado dinamicamente');

      // 4. Executar impressão
      const printResult = await unifiedPrinterService.printOrder(
        printerId,
        order,
        printContent,
        layout.id
      );

      if (printResult.success) {
        console.log('✅ Impressão dinâmica realizada com sucesso');
        
        // Registrar uso do layout
        this.recordLayoutUsage(layout.id);
        
        return {
          success: true,
          message: `Pedido impresso com layout "${layout.name}"`,
          layoutUsed: layout.name
        };
      } else {
        console.error('❌ Falha na impressão:', printResult.message);
        return {
          success: false,
          message: printResult.message || 'Erro desconhecido na impressão'
        };
      }

    } catch (error) {
      console.error('❌ Erro geral na impressão dinâmica:', error);
      return {
        success: false,
        message: `Erro na impressão dinâmica: ${error.message}`
      };
    }
  }

  /**
   * 📐 BUSCAR LAYOUT PARA IMPRESSÃO
   * Prioridade: layoutId específico > layout padrão
   */
  private getLayoutForPrint(layoutId?: string): PrintLayoutConfig {
    if (layoutId) {
      const specificLayout = printLayoutService.getLayout(layoutId);
      if (specificLayout) {
        console.log(`🎯 Usando layout específico: ${specificLayout.name}`);
        return specificLayout;
      } else {
        console.warn(`⚠️ Layout ${layoutId} não encontrado, usando padrão`);
      }
    }

    const defaultLayout = printLayoutService.getDefaultLayout();
    console.log(`🏠 Usando layout padrão: ${defaultLayout.name}`);
    return defaultLayout;
  }

  /**
   * ✅ VALIDAR CONFIGURAÇÃO DE LAYOUT
   */
  private validateLayout(layout: PrintLayoutConfig): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verificar largura do papel
    if (layout.paperWidth < 20 || layout.paperWidth > 80) {
      issues.push(`Largura do papel inválida: ${layout.paperWidth} (deve estar entre 20-80)`);
    }

    // Verificar seções habilitadas
    const sections = [layout.header, layout.customerInfo, layout.orderInfo, layout.itemsInfo, layout.totals, layout.footer];
    const enabledSections = sections.filter(s => s.enabled);
    
    if (enabledSections.length === 0) {
      issues.push('Nenhuma seção habilitada no layout');
    }

    // Verificar campos em seções habilitadas
    enabledSections.forEach(section => {
      const enabledFields = section.fields.filter(f => f.enabled);
      if (enabledFields.length === 0) {
        issues.push(`Seção "${section.name}" habilitada mas sem campos ativos`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * 📄 GERAR CONTEÚDO DINÂMICO
   * Aplica todas as configurações do layout ao pedido
   */
  private generateDynamicContent(
    order: Order, 
    layout: PrintLayoutConfig, 
    customValues?: Record<string, any>
  ): string {
    try {
      // Valores customizados com fallbacks inteligentes
      const enhancedCustomValues = {
        store_name: 'JYZE DELIVERY',
        footer_message: 'Obrigado pela preferência!',
        print_date: new Date().toLocaleString('pt-BR'),
        ...customValues
      };

      console.log('🔧 Gerando conteúdo com valores customizados:', enhancedCustomValues);

      // Usar o serviço de layout para gerar o texto
      const content = printLayoutService.generatePrintText(order, layout, enhancedCustomValues);
      
      console.log('✅ Conteúdo dinâmico gerado com sucesso');
      return content;

    } catch (error) {
      console.error('❌ Erro ao gerar conteúdo dinâmico:', error);
      throw new Error(`Falha na geração do conteúdo: ${error.message}`);
    }
  }

  /**
   * 📊 REGISTRAR USO DO LAYOUT
   * Para estatísticas e otimização futura
   */
  private recordLayoutUsage(layoutId: string): void {
    try {
      const usageKey = 'layout_usage_stats';
      const stored = localStorage.getItem(usageKey);
      const stats = stored ? JSON.parse(stored) : {};
      
      if (!stats[layoutId]) {
        stats[layoutId] = { count: 0, lastUsed: null };
      }
      
      stats[layoutId].count++;
      stats[layoutId].lastUsed = new Date().toISOString();
      
      localStorage.setItem(usageKey, JSON.stringify(stats));
      console.log(`📈 Uso do layout ${layoutId} registrado (total: ${stats[layoutId].count})`);
      
    } catch (error) {
      console.warn('⚠️ Erro ao registrar estatística de uso:', error);
      // Não é crítico, apenas continuar
    }
  }

  /**
   * 📊 OBTER ESTATÍSTICAS DE USO
   */
  getLayoutUsageStats(): Record<string, { count: number; lastUsed: string | null }> {
    try {
      const stored = localStorage.getItem('layout_usage_stats');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('⚠️ Erro ao carregar estatísticas:', error);
      return {};
    }
  }

  /**
   * 🔍 BUSCAR LAYOUTS MAIS USADOS
   */
  getMostUsedLayouts(limit: number = 5): { layoutId: string; name: string; count: number }[] {
    try {
      const stats = this.getLayoutUsageStats();
      const layouts = printLayoutService.getLayouts();
      
      return Object.entries(stats)
        .map(([layoutId, data]) => {
          const layout = layouts.find(l => l.id === layoutId);
          return {
            layoutId,
            name: layout?.name || 'Layout Removido',
            count: data.count
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
        
    } catch (error) {
      console.warn('⚠️ Erro ao buscar layouts mais usados:', error);
      return [];
    }
  }

  /**
   * 🎨 PREVIEW DINÂMICO
   * Gera preview sem imprimir
   */
  generatePreview(
    order: Order,
    layoutId?: string,
    customValues?: Record<string, any>
  ): { success: boolean; content?: string; error?: string } {
    try {
      const layout = this.getLayoutForPrint(layoutId);
      const content = this.generateDynamicContent(order, layout, customValues);
      
      return {
        success: true,
        content
      };
    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🔄 SINCRONIZAR CONFIGURAÇÕES
   * Verifica se as configurações estão consistentes
   */
  syncConfigurations(): { success: boolean; message: string; issues?: string[] } {
    try {
      const layouts = printLayoutService.getLayouts();
      const issues: string[] = [];

      // Verificar se existe pelo menos um layout
      if (layouts.length === 0) {
        issues.push('Nenhum layout configurado');
      }

      // Verificar se existe um layout padrão
      const hasDefault = layouts.some(l => l.isDefault);
      if (!hasDefault && layouts.length > 0) {
        issues.push('Nenhum layout definido como padrão');
        
        // Auto-corrigir definindo o primeiro como padrão
        layouts[0].isDefault = true;
        printLayoutService.saveLayout(layouts[0]);
        console.log(`🔧 Auto-correção: ${layouts[0].name} definido como padrão`);
      }

      // Verificar layouts duplicados
      const layoutIds = layouts.map(l => l.id);
      const duplicates = layoutIds.filter((id, index) => layoutIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        issues.push(`IDs duplicados encontrados: ${duplicates.join(', ')}`);
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 
          ? 'Configurações sincronizadas com sucesso'
          : `${issues.length} problema(s) encontrado(s)`,
        issues: issues.length > 0 ? issues : undefined
      };

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      return {
        success: false,
        message: `Erro na sincronização: ${error.message}`
      };
    }
  }
}

export const dynamicPrintService = new DynamicPrintService();


