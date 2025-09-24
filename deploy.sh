#!/bin/bash

# ========================================
# 🚀 SCRIPT DE DEPLOY JYZE DELIVERY VPS
# ========================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
PROJECT_NAME="jyze-delivery"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="/var/backups/jyze"
LOG_FILE="/var/log/jyze-deploy.log"

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    echo "[ERRO] $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
    echo "[AVISO] $1" >> "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
    echo "[INFO] $1" >> "$LOG_FILE"
}

# Verificar se está rodando como root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        warning "Rodando como root. Recomendado usar um usuário não-root."
    fi
}

# Verificar dependências
check_dependencies() {
    log "🔍 Verificando dependências..."
    
    command -v docker >/dev/null 2>&1 || { error "Docker não está instalado!"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { error "Docker Compose não está instalado!"; exit 1; }
    command -v git >/dev/null 2>&1 || { error "Git não está instalado!"; exit 1; }
    
    log "✅ Todas as dependências estão instaladas"
}

# Criar diretórios necessários
create_directories() {
    log "📁 Criando diretórios necessários..."
    
    sudo mkdir -p /var/log/jyze/{frontend,backend}
    sudo mkdir -p /var/lib/jyze/{backend,print-queue}
    sudo mkdir -p "$BACKUP_DIR"
    
    # Ajustar permissões
    sudo chown -R $USER:$USER /var/log/jyze /var/lib/jyze
    sudo chmod -R 755 /var/log/jyze /var/lib/jyze
    
    log "✅ Diretórios criados"
}

# Verificar e criar arquivo .env
check_env_file() {
    log "🔧 Configurando arquivo de ambiente..."
    
    # Sempre recriar o .env com as configurações corretas
    if [ -f "env.example" ]; then
        log "📋 Criando .env a partir do env.example..."
        cp env.example .env
    else
        log "📋 Criando .env com configurações padrão..."
        cat > .env << 'EOF'
# ========================================
# 🚀 JYZE DELIVERY - CONFIGURAÇÃO VPS
# ========================================

# 🌐 AMBIENTE
NODE_ENV=production
PORT=3002

# 🗄️ BANCO DE DADOS (SUPABASE) - OBRIGATÓRIO
SUPABASE_URL=https://jvwfdcjqrptlpgxqxnmt.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8

# 🔐 IMPRESSÃO SSH - OBRIGATÓRIO PARA IMPRESSÃO
SSH_USER=eric
SSH_HOST=192.168.3.5
SSH_PASSWORD=eqrwiecr
PRINTER_NAME=5808L-V2024

# 🌐 CORS E URLs - OBRIGATÓRIO
CORS_ORIGIN=https://jyze.space
FRONTEND_URL=https://jyze.space
BACKEND_URL=https://api.jyze.space

# 📊 LOGS - OPCIONAL
LOG_LEVEL=info
ENABLE_LOGS=true

# ========================================
# 🎯 FRONTEND - VARIÁVEIS VITE
# ========================================

# 🗄️ Supabase Frontend
VITE_SUPABASE_URL=https://jvwfdcjqrptlpgxqxnmt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8

# 🤖 Chat Assistente (N8N)
VITE_WEBHOOK_URL=https://n8n.jyze.space/webhook/interacoes

# 📦 CRUD Produtos (N8N)
VITE_WEBHOOK_CRUD_PRODUTOS=https://n8n.jyze.space/webhook/crudProdutos

# 📱 Evolution API (WhatsApp)
VITE_EVOLUTION_API_URL=https://evolution.jyze.space/
VITE_EVOLUTION_API_KEY=b7caaa547bb4c48ec46d127601a81451
VITE_WHATSAPP_INSTANCE_NAME=N8N

# 🔗 Webhook para Links Públicos
VITE_WEBHOOK_LINK_URL=https://n8n.jyze.space/webhook/link

# 🌐 URLs da Aplicação
VITE_API_URL=https://api.jyze.space
VITE_FRONTEND_URL=https://jyze.space
EOF
    fi
    
    # Verificar variáveis essenciais
    source "$ENV_FILE"
    
    [ -z "$SUPABASE_URL" ] && { error "SUPABASE_URL não configurada no .env!"; exit 1; }
    [ -z "$SUPABASE_KEY" ] && { error "SUPABASE_KEY não configurada no .env!"; exit 1; }
    [ -z "$SSH_PASSWORD" ] && { warning "SSH_PASSWORD não configurada - impressão pode não funcionar!"; }
    
    log "✅ Arquivo .env configurado automaticamente"
    log "🔐 SSH: ${SSH_USER}@${SSH_HOST} → ${PRINTER_NAME}"
    log "🌐 URLs: ${FRONTEND_URL} → ${BACKEND_URL}"
}

# Fazer backup dos dados
backup_data() {
    log "💾 Fazendo backup dos dados..."
    
    BACKUP_FILE="$BACKUP_DIR/jyze-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    if [ -d "/var/lib/jyze" ]; then
        sudo tar -czf "$BACKUP_FILE" /var/lib/jyze /var/log/jyze 2>/dev/null || true
        log "✅ Backup salvo em: $BACKUP_FILE"
    else
        info "Nenhum dado para backup encontrado"
    fi
}

# Atualizar código
update_code() {
    log "📥 Atualizando código..."
    
    if [ -d ".git" ]; then
        git fetch origin
        git reset --hard origin/main
        log "✅ Código atualizado via Git"
    else
        warning "Não é um repositório Git - pulando atualização"
    fi
}

# Build das imagens
build_images() {
    log "🔨 Fazendo build das imagens Docker..."
    
    docker-compose build --no-cache --parallel
    
    log "✅ Build concluído"
}

# Verificar saúde dos serviços
check_health() {
    log "🏥 Verificando saúde dos serviços..."
    
    # Aguardar serviços iniciarem
    sleep 30
    
    # Verificar backend
    if curl -f -s http://localhost:3002/printer/status >/dev/null; then
        log "✅ Backend está saudável"
    else
        error "❌ Backend não está respondendo!"
        docker-compose logs backend | tail -20
        return 1
    fi
    
    # Verificar frontend
    if curl -f -s http://localhost/health >/dev/null; then
        log "✅ Frontend está saudável"
    else
        error "❌ Frontend não está respondendo!"
        docker-compose logs frontend | tail -20
        return 1
    fi
    
    log "✅ Todos os serviços estão saudáveis"
}

# Deploy principal
deploy() {
    log "🚀 Iniciando deploy do JYZE Delivery..."
    
    check_root
    check_dependencies
    create_directories
    check_env_file
    backup_data
    update_code
    
    # Parar serviços existentes
    log "⏹️ Parando serviços existentes..."
    docker-compose down || true
    
    # Limpar imagens antigas
    log "🧹 Limpando imagens antigas..."
    docker system prune -f || true
    
    build_images
    
    # Iniciar serviços
    log "▶️ Iniciando serviços..."
    docker-compose up -d
    
    check_health
    
    log "🎉 Deploy concluído com sucesso!"
    log "📱 Frontend: https://jyze.space"
    log "🔗 Backend: https://api.jyze.space"
    log "📊 Logs: docker-compose logs -f"
}

# Parar serviços
stop() {
    log "⏹️ Parando todos os serviços..."
    docker-compose down
    log "✅ Serviços parados"
}

# Iniciar serviços
start() {
    log "▶️ Iniciando serviços..."
    docker-compose up -d
    check_health
    log "✅ Serviços iniciados"
}

# Reiniciar serviços
restart() {
    log "🔄 Reiniciando serviços..."
    docker-compose restart
    check_health
    log "✅ Serviços reiniciados"
}

# Ver logs
logs() {
    local service=${1:-""}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Status dos serviços
status() {
    log "📊 Status dos serviços:"
    docker-compose ps
    
    echo ""
    log "💾 Uso de espaço:"
    docker system df
    
    echo ""
    log "🏥 Health checks:"
    check_health || true
}

# Limpeza do sistema
cleanup() {
    log "🧹 Limpando sistema..."
    
    docker-compose down
    docker system prune -af --volumes
    docker volume prune -f
    
    log "✅ Limpeza concluída"
}

# Rollback para backup anterior
rollback() {
    log "⏪ Fazendo rollback..."
    
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/jyze-backup-*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "Nenhum backup encontrado para rollback!"
        exit 1
    fi
    
    log "📦 Restaurando backup: $LATEST_BACKUP"
    
    docker-compose down
    sudo tar -xzf "$LATEST_BACKUP" -C / 2>/dev/null || true
    docker-compose up -d
    
    check_health
    log "✅ Rollback concluído"
}

# Atualização rápida (sem rebuild)
quick_update() {
    log "⚡ Atualização rápida..."
    
    update_code
    docker-compose pull
    docker-compose up -d
    check_health
    
    log "✅ Atualização rápida concluída"
}

# Menu de ajuda
show_help() {
    echo "🚀 JYZE Delivery - Script de Deploy"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  deploy          Deploy completo (padrão)"
    echo "  start           Iniciar serviços"
    echo "  stop            Parar serviços"
    echo "  restart         Reiniciar serviços"
    echo "  status          Mostrar status dos serviços"
    echo "  logs [serviço]  Mostrar logs (frontend|backend)"
    echo "  cleanup         Limpar containers e volumes"
    echo "  rollback        Voltar para backup anterior"
    echo "  quick-update    Atualização rápida sem rebuild"
    echo "  health          Verificar saúde dos serviços"
    echo "  help            Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 deploy"
    echo "  $0 logs backend"
    echo "  $0 status"
}

# Main
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    cleanup)
        cleanup
        ;;
    rollback)
        rollback
        ;;
    quick-update)
        quick_update
        ;;
    health)
        check_health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Comando desconhecido: $1"
        show_help
        exit 1
        ;;
esac
