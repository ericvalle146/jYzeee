#!/bin/bash

echo "========================================"
echo "  INSTALADOR DO SERVIÇO LOCAL DE IMPRESSÃO"
echo "         COM AUTENTICAÇÃO POR IP"
echo "========================================"
echo

echo "[1/4] Criando diretório do serviço..."
mkdir -p local-printer-service
cd local-printer-service

echo "[2/4] Copiando arquivos..."
cp ../local-printer-service-with-auth.js local-printer-service.js
cp ../local-printer-package.json package.json

echo "[3/4] Instalando dependências..."
npm install

echo "[4/4] Configurando serviço..."
echo
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo
echo "Para iniciar o serviço, execute:"
echo "  cd local-printer-service"
echo "  npm start"
echo
echo "O serviço ficará disponível em:"
echo "  http://localhost:3003"
echo
echo "🌐 INTERFACE WEB DE GERENCIAMENTO:"
echo "  Acesse http://localhost:3003 para:"
echo "  - Ver IPs que tentaram imprimir"
echo "  - Aprovar/rejeitar acesso à impressora"
echo "  - Gerenciar permissões por IP"
echo
echo "🧪 Para testar:"
echo "  http://localhost:3003/status"
echo
