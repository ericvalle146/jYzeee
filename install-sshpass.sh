#!/bin/bash

# ================================
# 🔐 INSTALAR SSHPASS PARA SSH
# ================================

echo "🔐 Instalando sshpass para comunicação SSH..."

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        sudo yum install -y sshpass
    elif command -v dnf &> /dev/null; then
        # Fedora
        sudo dnf install -y sshpass
    else
        echo "❌ Distribuição Linux não suportada"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass
    else
        echo "❌ Homebrew não encontrado. Instale: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
else
    echo "❌ Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

# Verificar instalação
if command -v sshpass &> /dev/null; then
    echo "✅ sshpass instalado com sucesso!"
    sshpass -V
else
    echo "❌ Falha na instalação do sshpass"
    exit 1
fi

echo "🎯 Agora você pode usar SSH com senha no backend!"

