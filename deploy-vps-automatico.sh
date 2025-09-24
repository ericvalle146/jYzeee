#!/bin/bash

# ====================================
# 🚀 DEPLOY AUTOMÁTICO VPS - JYZE
# ====================================
# SSH: root@31.97.162.165
# Senha: Klvmax@123Klvmax@123
# ====================================

set -e

VPS_IP="31.97.162.165"
VPS_USER="root"
VPS_PASSWORD="Klvmax@123Klvmax@123"
REPO_URL="https://github.com/ericvalle146/jYzeee.git"
PROJECT_DIR="/root/jYzeee"

echo "🚀 INICIANDO DEPLOY AUTOMÁTICO NA VPS..."

# Função para executar comandos na VPS
run_ssh() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "$1"
}

# Função para copiar arquivos para VPS
copy_to_vps() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_IP:$2"
}

echo "📡 Testando conexão SSH..."
if ! run_ssh "echo 'Conexão SSH OK!'"; then
    echo "❌ ERRO: Não foi possível conectar na VPS!"
    exit 1
fi

echo "✅ Conexão SSH estabelecida!"

# 1. INSTALAR DEPENDÊNCIAS
echo "📦 Instalando dependências no servidor..."
run_ssh "apt update && apt install -y git curl wget sshpass docker.io docker-compose-v2"

# 2. CONFIGURAR DOCKER
echo "🐳 Configurando Docker..."
run_ssh "systemctl enable docker && systemctl start docker"
run_ssh "usermod -aG docker root"

# 3. CLONAR/ATUALIZAR REPOSITÓRIO
echo "📂 Clonando/atualizando repositório..."
run_ssh "cd /root && if [ -d 'jYzeee' ]; then cd jYzeee && git pull origin main; else git clone $REPO_URL; fi"

# 4. CRIAR .ENV AUTOMÁTICO
echo "⚙️ Configurando variáveis de ambiente..."
cat > temp_env << 'EOF'
# ====================================
# 🌐 CONFIGURAÇÃO VPS - JYZE
# ====================================

# SupaBase configuration
SUPABASE_URL=https://jvwfdcjqrptlpgxqxnmt.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm1dIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8
VITE_SUPABASE_URL=https://jvwfdcjqrptlpgxqxnmt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d2ZkY2pxcnB0bHBneHF4bm1dIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI3Mjc2NSwiZXhwIjoyMDcyODQ4NzY1fQ.nc3gfOoaqljUACNIa739uZvGifl1O4ADLlRRv0DkXB8

# 🔐 SSH Printing Configuration
SSH_USER=eric
SSH_HOST=192.168.3.5
SSH_PASSWORD=eqrwiecr
PRINTER_NAME=5808L-V2024

# 🌐 URLs Configuration
CORS_ORIGIN=https://jyze.space
FRONTEND_URL=https://jyze.space
BACKEND_URL=https://api.jyze.space
VITE_API_URL=https://api.jyze.space
VITE_FRONTEND_URL=https://jyze.space

# 🔧 API & Webhooks
VITE_WEBHOOK_URL=https://n8n.jyze.space/webhook/interacoes
VITE_WEBHOOK_CRUD_PRODUTOS=https://n8n.jyze.space/webhook/crudProdutos
VITE_WEBHOOK_LINK_URL=https://n8n.jyze.space/webhook/link

# 📱 Evolution API
VITE_EVOLUTION_API_URL=https://evolution.jyze.space/
VITE_EVOLUTION_API_KEY=b7caaa547bb4c48ec46d127601a81451
VITE_WHATSAPP_INSTANCE_NAME=N8N

# 🛠️ System Configuration
LOG_LEVEL=info
ENABLE_LOGS=true
EOF

copy_to_vps "temp_env" "$PROJECT_DIR/.env"
rm temp_env

# 5. PARAR CONTAINERS ANTIGOS
echo "🛑 Parando containers antigos..."
run_ssh "cd $PROJECT_DIR && docker-compose down --remove-orphans || true"

# 6. FAZER BUILD E DEPLOY
echo "🔧 Fazendo build e deploy..."
run_ssh "cd $PROJECT_DIR && docker-compose up --build -d"

# 7. AGUARDAR SERVIÇOS
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# 8. TESTAR SERVIÇOS
echo "🧪 Testando serviços..."
run_ssh "curl -f http://localhost:8080/health || echo 'Frontend health check falhou'"
run_ssh "curl -f http://localhost:3002/health || echo 'Backend health check falhou'"

# 9. CONFIGURAR SSL/DOMAIN (Opcional)
echo "🔒 Para configurar SSL e domínios:"
echo "   1. Apontar DNS:"
echo "      jyze.space -> $VPS_IP"
echo "      api.jyze.space -> $VPS_IP"
echo "   2. Instalar Certbot:"
echo "      apt install certbot python3-certbot-nginx"
echo "   3. Gerar certificados:"
echo "      certbot --nginx -d jyze.space -d api.jyze.space"

# 10. STATUS FINAL
echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "================================"
echo "🌐 Frontend: http://$VPS_IP:8080"
echo "🔧 Backend:  http://$VPS_IP:3002"
echo "📊 Status:"
run_ssh "cd $PROJECT_DIR && docker-compose ps"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configurar DNS para os domínios"
echo "2. Instalar SSL (certbot)"
echo "3. Testar impressão SSH"
echo "4. Verificar logs: docker-compose logs -f"
