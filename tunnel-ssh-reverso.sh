#!/bin/bash

# ========================================
# 🔄 TÚNEL SSH REVERSO - JYZE DELIVERY  
# ========================================
# Este script cria um túnel SSH reverso entre seu PC e a VPS
# para permitir que a VPS imprima no seu PC local

VPS_HOST="31.97.162.165"
VPS_USER="root"
VPS_PASSWORD="Klvmax@123Klvmax@123"
LOCAL_SSH_PORT="22"
TUNNEL_PORT="2222"

echo "🚀 INICIANDO TÚNEL SSH REVERSO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  PC Local (seu computador): $(hostname -I | awk '{print $1}')"
echo "🌐 VPS Destino: $VPS_HOST"
echo "🔗 Túnel: VPS:$TUNNEL_PORT ← PC:$LOCAL_SSH_PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se SSH está rodando localmente
if ! systemctl is-active --quiet ssh 2>/dev/null && ! service ssh status >/dev/null 2>&1; then
    echo "❌ ERRO: Serviço SSH não está rodando no seu PC!"
    echo "💡 Execute: sudo systemctl start ssh"
    exit 1
fi

# Verificar se a VPS está acessível
echo "🔍 Testando conectividade com a VPS..."
if ! ping -c 1 -W 3 "$VPS_HOST" >/dev/null 2>&1; then
    echo "❌ ERRO: VPS $VPS_HOST não está acessível!"
    exit 1
fi

echo "✅ VPS acessível!"

# Matar túneis existentes (se houver)
echo "🧹 Limpando túneis SSH existentes..."
pkill -f "ssh.*-R.*$TUNNEL_PORT" 2>/dev/null || true

# Criar túnel SSH reverso
echo "🔗 Criando túnel SSH reverso..."
echo "   ↳ Mapeando VPS:$TUNNEL_PORT → PC:$LOCAL_SSH_PORT"

# Comando SSH com túnel reverso
sshpass -p "$VPS_PASSWORD" ssh \
    -R $TUNNEL_PORT:localhost:$LOCAL_SSH_PORT \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -N \
    "$VPS_USER@$VPS_HOST" &

SSH_PID=$!

# Aguardar túnel estabelecer
sleep 3

# Verificar se o túnel foi criado
if ps -p $SSH_PID > /dev/null; then
    echo "✅ TÚNEL SSH REVERSO ATIVO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 INFORMAÇÕES DO TÚNEL:"
    echo "   • PID do processo: $SSH_PID"
    echo "   • Status: Ativo e funcionando"
    echo "   • VPS pode acessar seu PC via: ssh -p $TUNNEL_PORT eric@localhost"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🖨️  AGORA O SISTEMA DE IMPRESSÃO DEVE FUNCIONAR!"
    echo "🔄 Para parar: kill $SSH_PID"
    echo ""
    echo "🚨 MANTENHA ESTE TERMINAL ABERTO para manter o túnel ativo"
    echo "   Pressione Ctrl+C para encerrar o túnel"
    
    # Aguardar sinal de interrupção
    trap "echo '🛑 Encerrando túnel SSH...' && kill $SSH_PID && exit 0" INT TERM
    
    # Manter o script rodando
    wait $SSH_PID
else
    echo "❌ ERRO: Falha ao criar túnel SSH!"
    exit 1
fi
