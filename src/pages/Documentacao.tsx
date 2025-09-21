import React, { useState } from 'react';
import { BookOpen, FileText, Code, HelpCircle, ChevronRight, Home, Package, MessageSquare, Bot, LinkIcon, Printer, Search } from 'lucide-react';

const Documentacao = () => {
  const [activeSection, setActiveSection] = useState('primeiros-passos');
  const [searchTerm, setSearchTerm] = useState('');

  const sections = [
    {
      id: 'primeiros-passos',
      title: '🚀 Primeiros Passos',
      icon: Home,
      items: [
        { id: 'bem-vindo', title: 'Bem-vindo à JYZE.AI' },
        { id: 'configuracao-inicial', title: 'Configuração Inicial' },
        { id: 'tour-interface', title: 'Tour pela Interface' }
      ]
    },
    {
      id: 'gestao-pedidos',
      title: '📦 Gestão de Pedidos',
      icon: Package,
      items: [
        { id: 'visao-geral-pedidos', title: 'Visão Geral dos Pedidos' },
        { id: 'criando-pedidos', title: 'Criando Pedidos Manualmente' },
        { id: 'editando-pedidos', title: 'Editando Pedidos' },
        { id: 'filtros-organizacao', title: 'Filtros e Organização' }
      ]
    },
    {
      id: 'impressao',
      title: '🖨️ Sistema de Impressão',
      icon: Printer,
      items: [
        { id: 'configurar-impressora', title: 'Configurando sua Impressora' },
        { id: 'auto-impressao', title: 'Auto-impressão' },
        { id: 'layouts-personalizados', title: 'Layouts Personalizados' }
      ]
    },
    {
      id: 'whatsapp',
      title: '📱 Integração WhatsApp',
      icon: LinkIcon,
      items: [
        { id: 'conectar-whatsapp', title: 'Conectando WhatsApp Business' }
      ]
    },
    {
      id: 'agente-ia',
      title: '🤖 Agente de IA',
      icon: Bot,
      items: [
        { id: 'configurar-agente', title: 'Configuração do Agente' },
        { id: 'cadastro-produtos', title: 'Página de Produtos' },
        { id: 'extracao-cardapios', title: 'Extração de Cardápios' }
      ]
    },
    {
      id: 'chat-assistente',
      title: '💬 Chat Assistente',
      icon: MessageSquare,
      items: [
        { id: 'usando-chat', title: 'Chat Assistente' }
      ]
    },
    {
      id: 'suporte',
      title: '❓ Ajuda e Suporte',
      icon: HelpCircle,
      items: [
        { id: 'problemas-comuns', title: 'Problemas Comuns' },
        { id: 'faq', title: 'Perguntas Frequentes' },
        { id: 'contato', title: 'Entrar em Contato' }
      ]
    }
  ];

  const getContent = (sectionId: string, itemId: string | null = null) => {
    const key = itemId || sectionId;
    
    const content: Record<string, any> = {
      'bem-vindo': {
        title: 'Bem-vindo à JYZE.AI! 🎉',
        content: (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-semibold mb-3">O que é a JYZE.AI?</h3>
              <p className="text-muted-foreground mb-4">
                A JYZE.AI é uma plataforma completa de gestão para restaurantes e deliverys. Ela automatiza seus processos, desde o recebimento de pedidos até a impressão, usando inteligência artificial para melhorar seu atendimento.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📦 Gestão de Pedidos</h4>
                <p className="text-sm text-muted-foreground">Controle total sobre todos os pedidos, com filtros, estatísticas e impressão automática.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">🤖 Agente de IA</h4>
                <p className="text-sm text-muted-foreground">Assistente virtual que aprende sobre seus produtos e atende clientes automaticamente.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📱 WhatsApp</h4>
                <p className="text-sm text-muted-foreground">Integração direta com WhatsApp Business para receber pedidos automaticamente.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">🖨️ Impressão</h4>
                <p className="text-sm text-muted-foreground">Sistema inteligente de impressão com layouts personalizados e anti-duplicata.</p>
              </div>
            </div>

            
          </div>
        )
      },

      'configuracao-inicial': {
        title: 'Configuração Inicial ⚙️',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Siga este checklist para configurar sua plataforma do zero:
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Configure seu Agente de IA</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vá para <strong>Agente → Configuração do Agente</strong> e preencha:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Nome do seu restaurante</li>
                    <li>• Horário de funcionamento</li>
                    <li>• Personalidade do atendimento</li>
                    <li>• Área de entrega</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Configure sua Impressora</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vá para <strong>Pedidos</strong> e na seção "Status das Impressoras":
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Clique em "Detectar Impressoras"</li>
                    <li>• Selecione sua impressora da lista</li>
                    <li>• Faça um teste de impressão</li>
                    <li>• Ative a auto-impressão no topo da página</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Conecte o WhatsApp</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vá para <strong>Integrações</strong> e siga os passos:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Clique em "Gerar Novo QR Code"</li>
                    <li>• Escaneie com seu WhatsApp Business</li>
                    <li>• Aguarde a confirmação de conexão</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-2">✅ Pronto! Agora você pode:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Receber pedidos pelo WhatsApp automaticamente</li>
                <li>• Ver todos os pedidos organizados na página "Pedidos"</li>
                <li>• Imprimir pedidos automaticamente</li>
                <li>• Usar o Chat Assistente para análises</li>
              </ul>
            </div>
          </div>
        )
      },

      'criando-pedidos': {
        title: 'Criando Pedidos Manualmente 📝',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Além dos pedidos automáticos pelo WhatsApp, você pode criar pedidos manualmente:
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">Como criar um pedido manual:</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Na página <strong>Pedidos</strong>, clique no botão <strong>"Adicionar Pedido"</strong> no canto superior direito</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Preencha o formulário com as informações do cliente e pedido</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Clique em <strong>"Criar Pedido"</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Campos obrigatórios:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <strong>Nome do Cliente:</strong> Nome completo ou apelido
                </div>
                <div className="p-3 border rounded">
                  <strong>Endereço:</strong> Endereço completo de entrega
                </div>
                <div className="p-3 border rounded">
                  <strong>Pedido:</strong> Descrição detalhada dos itens
                </div>
                <div className="p-3 border rounded">
                  <strong>Valor:</strong> Valor total em reais (ex: 25.90)
                </div>
                <div className="p-3 border rounded">
                  <strong>Tipo de Pagamento:</strong> Dinheiro, PIX ou Cartão
                </div>
                <div className="p-3 border rounded">
                  <strong>Observações:</strong> Campo opcional para observações
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h5 className="font-semibold mb-2">💡 Dicas importantes:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use vírgula para separar os centavos no valor (ex: 15,50)</li>
                <li>• Seja específico na descrição do pedido para evitar confusões</li>
                <li>• O pedido será criado e aparecerá na aba "Não Imprimido"</li>
              </ul>
            </div>
          </div>
        )
      },

      'tour-interface': {
        title: 'Tour pela Interface 🗺️',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Conheça as principais áreas da plataforma:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center"><Home className="w-4 h-4 mr-2" />Início</h4>
                <p className="text-sm text-muted-foreground">Página principal com visão geral da plataforma e acesso rápido às funcionalidades.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center"><Package className="w-4 h-4 mr-2" />Pedidos</h4>
                <p className="text-sm text-muted-foreground">Central de controle para todos os pedidos, com filtros, estatísticas e sistema de impressão.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center"><LinkIcon className="w-4 h-4 mr-2" />Integrações</h4>
                <p className="text-sm text-muted-foreground">Configure a conexão com WhatsApp Business para receber pedidos automaticamente.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center"><Bot className="w-4 h-4 mr-2" />Agente</h4>
                <p className="text-sm text-muted-foreground">Configure seu assistente virtual, cadastre produtos e faça upload de cardápios.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center"><MessageSquare className="w-4 h-4 mr-2" />Chat Assistente</h4>
                <p className="text-sm text-muted-foreground">Converse com a IA para obter análises e insights sobre seu negócio.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center"><BookOpen className="w-4 h-4 mr-2" />Documentação</h4>
                <p className="text-sm text-muted-foreground">Esta página! Guias completos para usar todas as funcionalidades.</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">🎛️ Controles Globais</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Auto-impressão:</strong> Botão no topo direito para ativar/desativar impressão automática</p>
                <p><strong>Tema:</strong> Botão de lua/sol para alternar entre modo claro e escuro</p>
                <p><strong>Notificações:</strong> Sino com indicador de atividade do sistema</p>
              </div>
            </div>
          </div>
        )
      },

      'visao-geral-pedidos': {
        title: 'Visão Geral dos Pedidos 📊',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              A página de Pedidos é o coração da sua operação. Aqui você controla tudo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📈 Estatísticas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Total de Pedidos:</strong> Quantidade histórica</li>
                  <li>• <strong>Pedidos Hoje:</strong> Pedidos do dia atual</li>
                  <li>• <strong>Pedidos no Mês:</strong> Pedidos do mês corrente</li>
                  <li>• <strong>Em Andamento:</strong> Pedidos não impressos</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">🗂️ Filtros de Período</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Hoje:</strong> Pedidos de hoje</li>
                  <li>• <strong>Esta Semana:</strong> Segunda a domingo</li>
                  <li>• <strong>Este Mês:</strong> Mês calendário atual</li>
                  <li>• <strong>Total:</strong> Histórico completo</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-3">📋 Abas de Organização</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Não Imprimido:</strong> Pedidos novos que ainda não foram impressos</p>
                <p><strong>Já Imprimido:</strong> Pedidos que já foram processados e impressos</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">🔧 Ações Disponíveis para cada Pedido:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <strong>Imprimir:</strong> Imprimir pedido individualmente
                </div>
                <div className="p-3 border rounded">
                  <strong>Editar:</strong> Modificar informações do pedido
                </div>
                <div className="p-3 border rounded">
                  <strong>Excluir:</strong> Remover pedido (com confirmação)
                </div>
              </div>
            </div>
          </div>
        )
      },

      'editando-pedidos': {
        title: 'Editando Pedidos ✏️',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Você pode editar qualquer pedido para corrigir informações ou fazer ajustes:
            </p>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold mb-3">Como editar um pedido:</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Localize o pedido na lista (use os filtros se necessário)</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Clique no botão <strong>"Editar"</strong> no card do pedido</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Modifique as informações no formulário que aparecer</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-sm">Clique em <strong>"Salvar Alterações"</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">📝 Campos que podem ser editados:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <strong>Nome do Cliente:</strong> Alterar nome ou adicionar sobrenome
                </div>
                <div className="p-3 border rounded">
                  <strong>Endereço:</strong> Corrigir ou completar endereço
                </div>
                <div className="p-3 border rounded">
                  <strong>Pedido:</strong> Adicionar/remover itens
                </div>
                <div className="p-3 border rounded">
                  <strong>Valor:</strong> Ajustar preço final
                </div>
                <div className="p-3 border rounded">
                  <strong>Tipo de Pagamento:</strong> Dinheiro, PIX ou Cartão
                </div>
                <div className="p-3 border rounded">
                  <strong>Observações:</strong> Adicionar notas especiais
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold mb-3">🗑️ Excluindo Pedidos</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Para excluir um pedido, clique no botão <strong>"Excluir"</strong> (ícone de lixeira vermelho).
              </p>
              <div className="bg-white dark:bg-red-950 p-3 rounded border">
                <p className="text-sm"><strong>⚠️ Atenção:</strong> Esta ação é irreversível! Uma confirmação será solicitada antes de excluir definitivamente.</p>
              </div>
            </div>
          </div>
        )
      },

      'filtros-organizacao': {
        title: 'Filtros e Organização 🔍',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Use os filtros para encontrar pedidos rapidamente e organizar sua visualização:
            </p>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-3">⏰ Filtros de Período</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 border rounded">
                  <div className="font-semibold text-purple-600">Hoje</div>
                  <div className="text-xs text-muted-foreground">Pedidos de hoje</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="font-semibold text-purple-600">Esta Semana</div>
                  <div className="text-xs text-muted-foreground">Seg-Dom atual</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="font-semibold text-purple-600">Este Mês</div>
                  <div className="text-xs text-muted-foreground">Mês corrente</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="font-semibold text-purple-600">Total</div>
                  <div className="text-xs text-muted-foreground">Histórico completo</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">🗂️ Organização por Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                  <h5 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">📄 Não Imprimido</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pedidos novos recebidos</li>
                    <li>• Pedidos criados manualmente</li>
                    <li>• Aguardando processamento</li>
                    <li>• Precisam de atenção</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg border-green-200 bg-green-50 dark:bg-green-900/20">
                  <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ Já Imprimido</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pedidos já processados</li>
                    <li>• Comanda impressa na cozinha</li>
                    <li>• Em preparo ou entregues</li>
                    <li>• Histórico organizado</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">💡 Dicas de Organização</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Use o filtro "Hoje"</strong> para focar nos pedidos mais urgentes</li>
                <li>• <strong>Monitore a aba "Não Imprimido"</strong> frequentemente para novos pedidos</li>
                <li>• <strong>Filtro "Esta Semana"</strong> é útil para análises semanais</li>
                <li>• <strong>O filtro não afeta as estatísticas fixas</strong> no topo da página</li>
              </ul>
            </div>
          </div>
        )
      },

      'configurar-impressora': {
        title: 'Configurando sua Impressora 🖨️',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Configure sua impressora para automatizar a impressão de pedidos:
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">🔌 Primeira Configuração</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <span className="text-sm font-medium">Conecte a impressora</span>
                    <p className="text-xs text-muted-foreground">Conecte sua impressora térmica via USB</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <span className="text-sm font-medium">Va para a página Pedidos</span>
                    <p className="text-xs text-muted-foreground">Acesse pelo menu lateral</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <span className="text-sm font-medium">Clique em "Detectar Impressoras"</span>
                    <p className="text-xs text-muted-foreground">Na seção "Status das Impressoras"</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <span className="text-sm font-medium">Selecione sua impressora</span>
                    <p className="text-xs text-muted-foreground">Escolha da lista detectada</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                  <div>
                    <span className="text-sm font-medium">Faça um teste</span>
                    <p className="text-xs text-muted-foreground">Clique em "Teste de Impressão"</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">✅ Impressoras Suportadas</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Impressoras térmicas USB</li>
                  <li>• Modelos ESC/POS</li>
                  <li>• Largura 80mm (padrão)</li>
                  <li>• Conexão USB direta</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">🔧 Status da Impressora</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <span className="text-green-600">Pronta:</span> Funcionando</li>
                  <li>• <span className="text-yellow-600">Detectando:</span> Procurando</li>
                  <li>• <span className="text-red-600">Erro:</span> Problema</li>
                  <li>• <span className="text-gray-600">Inativa:</span> Desconectada</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h5 className="font-semibold mb-2">⚠️ Problemas Comuns</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Impressora não detectada:</strong> Verifique cabo USB e drivers</li>
                <li>• <strong>Papel em branco:</strong> Verifique bobina de papel térmico</li>
                <li>• <strong>Impressão cortada:</strong> Configure largura do papel</li>
                <li>• <strong>Não imprime:</strong> Teste com outro programa primeiro</li>
              </ul>
            </div>
          </div>
        )
      },

      'auto-impressao': {
        title: 'Sistema de Auto-impressão ⚡',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              A auto-impressão permite que pedidos sejam impressos automaticamente assim que chegam:
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-3">🎯 Como Ativar</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Configure primeiro sua impressora (veja guia anterior)</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Na página Pedidos, procure o botão "Auto-impressão" no topo direito</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Clique no botão para <strong>ativar</strong> (ficará verde quando ativo)</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-sm">Pronto! Novos pedidos serão impressos automaticamente</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg border-green-200 bg-green-50 dark:bg-green-900/20">
                <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ Quando Ativo</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pedidos do WhatsApp são impressos na hora</li>
                  <li>• Pedidos manuais podem ser impressos automaticamente</li>
                  <li>• Não há duplicação de impressão</li>
                  <li>• Sistema monitora status constantemente</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg border-gray-200 bg-gray-50 dark:bg-gray-900/20">
                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">⏸️ Quando Inativo</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pedidos ficam na aba "Não Imprimido"</li>
                  <li>• Você precisa imprimir manualmente</li>
                  <li>• Useful para testes ou manutenção</li>
                  <li>• Controle total sobre quando imprimir</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">⚙️ Sistema Anti-Duplicata</h4>
              <p className="text-sm text-muted-foreground mb-3">
                O sistema possui proteção automática contra impressões duplicadas:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cada pedido só é impresso uma vez automaticamente</li>
                <li>• Status de impressão é monitorado em tempo real</li>
                <li>• Você ainda pode reimprimir manualmente se necessário</li>
                <li>• Evita desperdício de papel e confusão na cozinha</li>
              </ul>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <h5 className="font-semibold mb-2">💡 Dicas de Uso</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Mantenha sempre ativo</strong> durante horário de funcionamento</li>
                <li>• <strong>Desative temporariamente</strong> para manutenção da impressora</li>
                <li>• <strong>Verifique o papel</strong> regularmente para não ficar sem</li>
                <li>• <strong>O botão fica verde</strong> quando a auto-impressão está ativa</li>
              </ul>
            </div>
          </div>
        )
      },

      'layouts-personalizados': {
        title: 'Layouts Personalizados 🎨',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Personalize como seus pedidos são impressos criando layouts únicos:
            </p>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-3">🎯 Acessando o Editor</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Na página Pedidos, role até "Layout de Impressão"</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Clique em "Personalizar Layout"</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Arraste e solte os campos na ordem desejada</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-sm">Visualize o resultado na prévia</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">📋 Campos Disponíveis</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nome do Cliente</li>
                  <li>• Endereço</li>
                  <li>• Pedido</li>
                  <li>• Valor</li>
                  <li>• Tipo de Pagamento</li>
                  <li>• Observações</li>
                  <li>• Data/Hora</li>
                  <li>• Separador (linha)</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">🎨 Personalizações</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Reordenar campos</li>
                  <li>• Incluir/remover informações</li>
                  <li>• Adicionar separadores</li>
                  <li>• Prévia em tempo real</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">💡 Dicas para um Bom Layout</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Nome e endereço no topo</strong> para fácil identificação</li>
                <li>• <strong>Pedido em destaque</strong> para a cozinha ver claramente</li>
                <li>• <strong>Valor e pagamento próximos</strong> para controle financeiro</li>
                <li>• <strong>Use separadores</strong> para organizar visualmente</li>
              </ul>
            </div>
          </div>
        )
      },

      'conectar-whatsapp': {
        title: 'Conectando WhatsApp Business 📱',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Conecte seu WhatsApp Business para receber pedidos automaticamente:
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-3">📱 Pré-requisitos</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>WhatsApp Business</strong> instalado no seu celular</li>
                <li>• <strong>Número comercial</strong> dedicado ao negócio</li>
                <li>• <strong>Internet estável</strong> no computador e celular</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">🔗 Como Conectar</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <span className="text-sm font-medium">Acesse Integrações</span>
                    <p className="text-xs text-muted-foreground">Clique em "Integrações" no menu lateral</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <span className="text-sm font-medium">Gere o QR Code</span>
                    <p className="text-xs text-muted-foreground">Clique em "Gerar Novo QR Code"</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <span className="text-sm font-medium">Abra o WhatsApp Business</span>
                    <p className="text-xs text-muted-foreground">No seu celular</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <span className="text-sm font-medium">Vá em Dispositivos Vinculados</span>
                    <p className="text-xs text-muted-foreground">Menu → Dispositivos Vinculados</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                  <div>
                    <span className="text-sm font-medium">Escaneie o QR Code</span>
                    <p className="text-xs text-muted-foreground">Aponte a câmera para o código na tela</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h5 className="font-semibold mb-2">⚠️ Importante</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Mantenha o celular conectado</strong> à internet</li>
                <li>• <strong>Não feche o WhatsApp Business</strong> completamente</li>
                <li>• <strong>Use apenas uma conexão</strong> por número</li>
                <li>• <strong>O QR Code expira</strong> em alguns minutos</li>
              </ul>
            </div>
          </div>
        )
      },



      'configurar-agente': {
        title: 'Configuração do Agente 🤖',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Configure as informações básicas para seu delivery:
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">🏪 Como Configurar</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <span className="text-sm font-medium">Vá para Agente → Configuração do Agente</span>
                    <p className="text-xs text-muted-foreground">Acesse pelo menu lateral</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <span className="text-sm font-medium">Preencha os campos obrigatórios</span>
                    <p className="text-xs text-muted-foreground">Nome do agente, tempo de entrega e valor do frete</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <span className="text-sm font-medium">Configure o tempo de espera</span>
                    <p className="text-xs text-muted-foreground">Tempo de resposta automática em segundos</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <span className="text-sm font-medium">Salve as configurações</span>
                    <p className="text-xs text-muted-foreground">Clique em "Salvar Configurações"</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">📝 Campos Disponíveis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <strong>Nome do Agente:</strong> Nome que aparecerá nos atendimentos
                </div>
                <div className="p-3 border rounded">
                  <strong>Tempo de Entrega:</strong> Tempo médio em minutos
                </div>
                <div className="p-3 border rounded">
                  <strong>Valor do Frete:</strong> Taxa de entrega padrão
                </div>
                <div className="p-3 border rounded">
                  <strong>Tempo de Espera:</strong> Segundos para resposta automática
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h5 className="font-semibold mb-2">💡 Dicas Importantes</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Nome do agente:</strong> Use o nome do seu estabelecimento</li>
                <li>• <strong>Tempo de entrega:</strong> Seja realista para não frustrar clientes</li>
                <li>• <strong>Valor do frete:</strong> Use vírgula para decimais (ex: 5,50)</li>
                <li>• <strong>Tempo de espera:</strong> Entre 1-5 segundos é o ideal</li>
              </ul>
            </div>
          </div>
        )
      },

      'cadastro-produtos': {
        title: 'Página de Produtos 📦',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Gerencie seus produtos na página dedicada:
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-3">📋 Como Acessar</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Vá para <strong>Agente → Página de Produtos</strong></span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Escolha entre as duas abas disponíveis</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📝 Cadastrar Novos Produtos</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Botão "Cadastrar Novos Produtos"</li>
                  <li>• Lista de produtos cadastrados</li>
                  <li>• Opções de editar e excluir</li>
                  <li>• Formulário de cadastro</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                <h5 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🤖 Produtos Extraídos pela IA</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Produtos vindos da extração</li>
                  <li>• Aguardando confirmação</li>
                  <li>• Opções de aprovar/rejeitar</li>
                  <li>• Revisão antes do catálogo</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h5 className="font-semibold mb-2">💡 Como Funciona</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Cadastro manual:</strong> Use o botão para adicionar produtos individuais</li>
                <li>• <strong>Extração automática:</strong> Produtos vêm do upload de cardápios na aba "Extração"</li>
                <li>• <strong>Confirmação:</strong> Revise produtos extraídos antes de aprovar</li>
                <li>• <strong>Gestão completa:</strong> Edite ou exclua produtos conforme necessário</li>
              </ul>
            </div>
          </div>
        )
      },

      'extracao-cardapios': {
        title: 'Extração de Cardápios 📄',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Upload de cardápios para extração inteligente e treinamento da IA:
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">📸 Como Fazer Upload</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Vá para <strong>Agente → Extração</strong></span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Arraste uma imagem ou clique na área de upload</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Aguarde o upload automático e processamento</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-sm">A IA treina automaticamente para reconhecimento</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">✅ Formatos Aceitos</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• JPG, PNG, GIF, WEBP</li>
                  <li>• Upload automático</li>
                  <li>• Processamento em tempo real</li>
                  <li>• Link público gerado</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">🎯 Melhores Resultados</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cardápios com boa qualidade</li>
                  <li>• Texto bem visível</li>
                  <li>• Preços claramente marcados</li>
                  <li>• Uma página por vez</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h5 className="font-semibold mb-2">🧠 O que Acontece</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Upload automático:</strong> Arquivo enviado para o storage</li>
                <li>• <strong>Link público:</strong> URL gerada automaticamente</li>
                <li>• <strong>Processamento IA:</strong> Extração e treinamento acontecem</li>
                <li>• <strong>Treinamento:</strong> IA aprende para atendimento futuro</li>
              </ul>
            </div>
          </div>
        )
      },

      'usando-chat': {
        title: 'Chat Assistente 💬',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Interface de chat para comunicação com a IA:
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">💬 Como Acessar</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Vá para <strong>Chat Assistente</strong> no menu</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Digite sua mensagem na caixa de texto</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Use Enter ou clique no botão de envio</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">📱 Interface</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Área de conversa</li>
                  <li>• Campo de entrada de texto</li>
                  <li>• Botão de envio</li>
                  <li>• Histórico de mensagens</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">⚙️ Funcionalidades</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Envio de mensagens</li>
                  <li>• Recebimento de respostas</li>
                  <li>• Conversa em tempo real</li>
                  <li>• Interface responsiva</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h5 className="font-semibold mb-2">💡 Como Funciona</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Mensagens do usuário:</strong> Enviadas via webhook</li>
                <li>• <strong>Respostas da IA:</strong> Recebidas via polling automático</li>
                <li>• <strong>Tempo real:</strong> Interface atualiza automaticamente</li>
                <li>• <strong>Histórico:</strong> Todas as mensagens ficam salvas na conversa</li>
              </ul>
            </div>
          </div>
        )
      },


      'problemas-comuns': {
        title: 'Problemas Comuns ⚠️',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Soluções para os problemas mais frequentes:
            </p>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/20">
                <h5 className="font-semibold text-red-700 dark:text-red-300 mb-2">🖨️ Problemas de Impressão</h5>
                <div className="space-y-2 text-sm">
                  <div><strong>Impressora não detectada:</strong> Verifique cabo USB e drivers instalados</div>
                  <div><strong>Papel em branco:</strong> Troque bobina de papel térmico</div>
                  <div><strong>Impressão cortada:</strong> Configure largura correta no sistema</div>
                  <div><strong>Não imprime nada:</strong> Teste a impressora em outro programa primeiro</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <h5 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">📱 Problemas do WhatsApp</h5>
                <div className="space-y-2 text-sm">
                  <div><strong>QR Code não aparece:</strong> Verifique conexão com internet</div>
                  <div><strong>Não consegue escanear:</strong> Use WhatsApp Business (não o comum)</div>
                  <div><strong>Conecta e desconecta:</strong> Mantenha celular com internet estável</div>
                  <div><strong>Não recebe mensagens:</strong> Verifique se WhatsApp está aberto no celular</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">💻 Problemas do Sistema</h5>
                <div className="space-y-2 text-sm">
                  <div><strong>Página não carrega:</strong> Atualize o navegador (F5)</div>
                  <div><strong>Dados não aparecem:</strong> Verifique conexão com internet</div>
                  <div><strong>Botões não funcionam:</strong> Limpe cache do navegador</div>
                  <div><strong>Login não funciona:</strong> Verifique usuário e senha</div>
                </div>
              </div>
            </div>
          </div>
        )
      },

      'faq': {
        title: 'Perguntas Frequentes ❓',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Respostas para as dúvidas mais comuns:
            </p>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">💰 Posso usar com qualquer tipo de negócio?</h5>
                <p className="text-sm text-muted-foreground">
                  A plataforma foi desenvolvida especificamente para restaurantes, pizzarias e deliverys, mas pode ser adaptada para outros negócios de food service.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">📱 Preciso do WhatsApp Business?</h5>
                <p className="text-sm text-muted-foreground">
                  Sim, é obrigatório usar o WhatsApp Business (não o comum) para a integração funcionar corretamente.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">🖨️ Que tipo de impressora preciso?</h5>
                <p className="text-sm text-muted-foreground">
                  Impressoras térmicas USB de 80mm com padrão ESC/POS. Marcas como Epson, Bematech e similares funcionam bem.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">🔒 Meus dados ficam seguros?</h5>
                <p className="text-sm text-muted-foreground">
                  Sim, todos os dados são armazenados de forma segura e criptografada. Apenas você tem acesso às suas informações.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">📊 Como a IA aprende sobre meu negócio?</h5>
                <p className="text-sm text-muted-foreground">
                  A IA aprende através dos cardápios que você carrega, produtos que cadastra e padrões dos pedidos recebidos.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-2">🔄 Posso usar em vários computadores?</h5>
                <p className="text-sm text-muted-foreground">
                  Sim, você pode acessar de qualquer computador com internet. Apenas a impressora precisa estar conectada ao computador que vai imprimir.
                </p>
              </div>
            </div>
          </div>
        )
      },

      'contato': {
        title: 'Entrar em Contato 📞',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Precisa de ajuda? Entre em contato conosco:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">💬 Suporte Técnico</h5>
                <div className="space-y-2 text-sm">
                  <p><strong>WhatsApp:</strong> (11) 99999-9999</p>
                  <p><strong>E-mail:</strong> suporte@jyze.ai</p>
                  <p><strong>Horário:</strong> Seg-Sex 9h às 18h</p>
                </div>
              </div>

              <div className="p-6 border rounded-lg border-green-200 bg-green-50 dark:bg-green-900/20">
                <h5 className="font-semibold text-green-700 dark:text-green-300 mb-3">🚀 Vendas e Planos</h5>
                <div className="space-y-2 text-sm">
                  <p><strong>WhatsApp:</strong> (11) 88888-8888</p>
                  <p><strong>E-mail:</strong> vendas@jyze.ai</p>
                  <p><strong>Horário:</strong> Seg-Sex 8h às 20h</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-3">📋 Antes de Entrar em Contato</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Para um atendimento mais rápido, tenha em mãos:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Descrição detalhada</strong> do problema</li>
                <li>• <strong>Prints da tela</strong> se houver erro visual</li>
                <li>• <strong>Horário aproximado</strong> que o problema ocorreu</li>
                <li>• <strong>Navegador e versão</strong> que está usando</li>
                <li>• <strong>Já tentou</strong> as soluções desta documentação</li>
              </ul>
            </div>

            <div className="text-center p-6 border rounded-lg">
              <h5 className="font-semibold mb-2">🌟 Feedback e Sugestões</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Sua opinião é importante para melhorarmos constantemente!
              </p>
              <p className="text-sm">
                <strong>E-mail:</strong> feedback@jyze.ai
              </p>
            </div>
          </div>
        )
      }
    };

    return content[key] || { 
      title: 'Conteúdo em construção 🚧', 
      content: (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Este conteúdo está sendo preparado. Em breve estará disponível!</p>
        </div>
      )
    };
  };

  const [activeItem, setActiveItem] = useState('bem-vindo');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold gradient-text mb-2">
            📚 Documentação
          </h1>
          <p className="text-sm text-muted-foreground">
            Guia completo para usar a plataforma
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar na documentação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <div key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </button>
                
                {isActive && (
                  <div className="ml-6 mt-2 space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveItem(item.id)}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          activeItem === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {(() => {
            const content = getContent(activeSection, activeItem);
            return (
              <div>
                <h1 className="text-3xl font-bold mb-6">{content.title}</h1>
                {content.content}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Documentacao;