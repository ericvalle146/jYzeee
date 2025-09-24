#!/bin/bash

# ================================
# 🚀 SCRIPT DE DEPLOY - JYZE SYSTEM
# ================================
# Deploy automático na VPS via Docker

set -e  # Parar se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para logs coloridos
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
echo -e "${PURPLE}"
cat << "EOF"
  ╔══════════════════════════════════════╗
  ║         🚀 JYZE DEPLOY SCRIPT        ║
  ║     Sistema de Pedidos + Impressão   ║
  ╚══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não encontrado! Instale o Docker primeiro."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não encontrado! Instale o Docker Compose primeiro."
fi

log "✅ Docker e Docker Compose encontrados"

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    warning "Arquivo .env não encontrado!"
    info "Copiando env.example para .env..."
    cp env.example .env
    warning "⚠️  IMPORTANTE: Configure o arquivo .env antes de continuar!"
    echo -e "${CYAN}Edite o arquivo .env com suas configurações:${NC}"
    echo "  - URLs do Supabase"
    echo "  - Chaves da API"
    echo "  - Configurações de rede"
    echo "  - Senhas de segurança"
    echo ""
    read -p "Pressione ENTER quando terminar de configurar o .env..."
fi

# Verificar se existem contêineres rodando
if [ "$(docker ps -q)" ]; then
    warning "Parando contêineres existentes..."
    docker-compose down --remove-orphans
fi

# Função de cleanup
cleanup() {
    log "🧹 Limpando recursos não utilizados..."
    docker system prune -f
    docker volume prune -f
}

# Função de build
build_images() {
    log "🔨 Construindo imagens Docker..."
    
    # Habilitar BuildKit para builds mais rápidos
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # Build das imagens
    docker-compose build --no-cache --parallel
    
    log "✅ Imagens construídas com sucesso!"
}

# Função de deploy
deploy() {
    log "🚀 Iniciando deploy..."
    
    # Criar redes e volumes se não existirem
    docker-compose up --no-deps --no-start
    
    # Subir os serviços
    docker-compose up -d
    
    log "⏳ Aguardando serviços ficarem prontos..."
    sleep 10
    
    # Verificar saúde dos serviços
    check_health
}

# Função de verificação de saúde
check_health() {
    log "🔍 Verificando saúde dos serviços..."
    
    services=("backend" "frontend")
    failed_services=()
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up (healthy)"; then
            log "✅ $service: Saudável"
        elif docker-compose ps "$service" | grep -q "Up"; then
            warning "⚠️  $service: Rodando (verificando saúde...)"
        else
            error "❌ $service: Falhou"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log "🎉 Todos os serviços estão funcionando!"
    else
        error "❌ Serviços com falha: ${failed_services[*]}"
    fi
}

# Função de logs
show_logs() {
    log "📋 Mostrando logs dos serviços..."
    docker-compose logs --tail=50 -f
}

# Função de status
show_status() {
    log "📊 Status dos serviços:"
    docker-compose ps
    
    echo ""
    log "🌐 URLs dos serviços:"
    echo -e "${CYAN}Frontend:${NC} http://localhost"
    echo -e "${CYAN}Backend API:${NC} http://localhost:3000"
    echo -e "${CYAN}Print Service:${NC} http://localhost:3003"
    echo -e "${CYAN}Print Status:${NC} http://localhost:3003/status"
}

# Função de backup
backup() {
    log "💾 Criando backup dos dados..."
    
    backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup dos volumes
    docker run --rm -v jyze_backend_data:/data -v "$(pwd)/$backup_dir":/backup alpine tar czf /backup/backend_data.tar.gz -C /data .
    docker run --rm -v jyze_print_queue:/data -v "$(pwd)/$backup_dir":/backup alpine tar czf /backup/print_queue.tar.gz -C /data .
    
    log "✅ Backup salvo em: $backup_dir"
}

# Menu principal
case "${1:-deploy}" in
    "deploy")
        log "🚀 Iniciando deploy completo..."
        cleanup
        build_images
        deploy
        show_status
        ;;
    "build")
        build_images
        ;;
    "up")
        log "▶️  Subindo serviços..."
        docker-compose up -d
        show_status
        ;;
    "down")
        log "⏹️  Parando serviços..."
        docker-compose down --remove-orphans
        ;;
    "restart")
        log "🔄 Reiniciando serviços..."
        docker-compose restart
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "health")
        check_health
        ;;
    "backup")
        backup
        ;;
    "cleanup")
        cleanup
        ;;
    "update")
        log "🔄 Atualizando sistema..."
        git pull origin main
        cleanup
        build_images
        deploy
        show_status
        ;;
    *)
        echo "🚀 JYZE Deploy Script"
        echo ""
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  deploy   - Deploy completo (padrão)"
        echo "  build    - Apenas construir imagens"
        echo "  up       - Subir serviços"
        echo "  down     - Parar serviços"
        echo "  restart  - Reiniciar serviços"
        echo "  logs     - Mostrar logs"
        echo "  status   - Mostrar status"
        echo "  health   - Verificar saúde"
        echo "  backup   - Criar backup"
        echo "  cleanup  - Limpar recursos"
        echo "  update   - Atualizar do Git e redeploy"
        echo ""
        exit 0
        ;;
esac

log "🎯 Operação concluída!"
