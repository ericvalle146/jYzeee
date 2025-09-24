# ========================================
# 🐳 SCRIPT DE INSTALAÇÃO DOCKER + DOCKER COMPOSE
# ========================================


set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
log "Instalando dependências..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Adicionar chave GPG do Docker
log "Adicionando chave GPG do Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
log "Adicionando repositório do Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Atualizar lista de pacotes
log "Atualizando lista de pacotes..."
apt update

# Instalar Docker
log "Instalando Docker..."
apt install -y docker-ce docker-ce-cli containerd.io

# Instalar Docker Compose
log "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Criar link simbólico
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Iniciar e habilitar Docker
log "Iniciando Docker..."
systemctl start docker
systemctl enable docker

# Verificar instalação
log "Verificando instalação..."
docker --version
docker-compose --version

log "Agora você pode executar: ./deploy.sh deploy"

