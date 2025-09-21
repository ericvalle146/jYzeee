#!/bin/bash

echo "========================================"
echo "  INSTALADOR DO SISTEMA ROBUSTO DE IMPRESSÃO"
echo "         COM AUTENTICAÇÃO POR IP"
echo "========================================"
echo

echo "[1/5] Parando serviços antigos..."
pkill -f "local-printer-service" 2>/dev/null || true
pkill -f "robust-printer-service" 2>/dev/null || true

echo "[2/5] Criando diretório do serviço..."
mkdir -p robust-printer-service
cd robust-printer-service

echo "[3/5] Copiando arquivos..."
cp ../robust-printer-service.js .
cp ../robust-printer-package.json package.json

echo "[4/5] Instalando dependências..."
npm install

echo "[5/5] Configurando serviço..."
echo
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo
echo "🚀 SISTEMA ROBUSTO DE IMPRESSÃO:"
echo "  - Detecção automática de impressoras"
echo "  - Múltiplas estratégias de impressão"
echo "  - Interface web completa"
echo "  - Sistema de fallback robusto"
echo "  - Logs detalhados"
echo
echo "Para iniciar o serviço:"
echo "  cd robust-printer-service"
echo "  npm start"
echo
echo "Interface web:"
echo "  http://localhost:3003"
echo
echo "🧪 Testes disponíveis:"
echo "  - Teste de impressão"
echo "  - Teste por impressora"
echo "  - Detecção de impressoras"
echo "  - Gerenciamento de IPs"
echo
echo "📁 Arquivos salvos em:"
echo "  ./printed_orders/ (quando impressão falha)"
echo
