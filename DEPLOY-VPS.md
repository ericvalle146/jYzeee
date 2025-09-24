# 🚀 DEPLOY NA VPS - JYZE SYSTEM

## 📋 Como Funciona

O sistema foi containerizado para deploy fácil na VPS usando Docker. Aqui está como funciona:

### 🏗️ Arquitetura do Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS (31.97.162.165)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 FRONTEND (jyze.space)        📡 BACKEND (api.jyze.space) │
│  ┌─────────────────────┐        ┌─────────────────────┐     │
│  │   React + Nginx     │   ────▶│     NestJS API      │     │
│  │     Port 80/443     │        │     Port 3000       │     │
│  └─────────────────────┘        └─────────────────────┘     │
│                                                             │
│  🖨️ PRINT SERVICE (Via IP apenas - não usa domínio)        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Print Service Node.js                  │   │
│  │                Port 3003                            │   │
│  │  • Recebe webhooks do Backend                       │   │
│  │  • Comunica com impressora local via IP            │   │
│  │  • Auto-autoriza VPS (31.97.162.165)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🗄️ DATA PERSISTENCE                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   VOLUMES   │  │    LOGS     │  │   BACKUPS   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘

        ▼ Comunicação via IP (192.168.3.5:3003)

┌─────────────────────────────────────────────────────────────┐
│                    IMPRESSORA LOCAL                         │
│               (192.168.3.5:3003)                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Pré-requisitos na VPS

### 1. Instalar Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install docker docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### 2. Configurar Firewall
```bash
# Permitir portas necessárias
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 3003
sudo ufw enable
```

## 🚀 Processo de Deploy

### 1. **Clonar o Repositório**
```bash
cd /opt
sudo git clone https://github.com/ericvalle146/jYzeee.git
cd jYzeee
sudo chown -R $USER:$USER .
```

### 2. **Configurar Variáveis de Ambiente**
```bash
cp env.example .env
nano .env
```

**Configure essas variáveis importantes:**
```env
# Database (Supabase)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Network - IMPORTANTE: Usar os domínios corretos
LOCAL_IP=31.97.162.165  # IP da VPS
VPS_BACKEND_URL=https://api.jyze.space  # Backend sempre usa api.jyze.space
CORS_ORIGIN=https://jyze.space          # Frontend sempre usa jyze.space

# Printer Service (comunicação via IP)
PRINTER_NAME=5808L-V2024
VPS_ALLOWED_IPS=31.97.162.165  # IP da VPS para auto-aprovação

# Security
WEBHOOK_SECRET=sua_chave_super_secreta_aqui
```

### 3. **Executar Deploy**
```bash
# Deploy completo
./deploy.sh deploy

# Ou comando por comando:
./deploy.sh build   # Construir imagens
./deploy.sh up      # Subir serviços
./deploy.sh status  # Verificar status
```

## 🌐 Como Funciona Cada Serviço

### **1. Frontend (React + Nginx) - jyze.space**
- **Container:** `jyze-frontend`
- **Domínio:** `https://jyze.space`
- **Porta:** 80 (HTTP) e 443 (HTTPS)
- **Função:** Interface do usuário, proxy para backend
- **Build:** Vite constrói para produção, Nginx serve
- **Proxy:** `/api/*` → `https://api.jyze.space`

### **2. Backend (NestJS) - api.jyze.space**
- **Container:** `jyze-backend`
- **Domínio:** `https://api.jyze.space`
- **Porta:** 3000
- **Função:** API REST, WebSockets, lógica de negócio
- **Database:** Supabase integrado
- **Health Check:** `GET https://api.jyze.space/health`

### **3. Serviço de Impressão (Via IP)**
- **Container:** `jyze-print-service`
- **IP:** `31.97.162.165:3003` (sem domínio)
- **Função:** Receber webhooks, imprimir via IP local
- **Comunicação:** IP direto com impressora local
- **Status:** `GET http://31.97.162.165:3003/status`

### **4. Volumes e Persistência**
- **backend_data:** Dados do backend NestJS
- **print_queue:** Fila de impressão
- **logs:** Logs centralizados de todos os serviços

## 🔄 Fluxo de Funcionamento

### **Para Usuários Web:**
1. Acesso via browser → `http://vps-ip` ou `https://seudominio.com`
2. Frontend (Nginx) serve a aplicação React
3. API calls vão para Backend (`/api/*`)
4. Backend processa e salva no Supabase
5. Impressão via webhook para Print Service

### **Para Impressão:**
1. Pedido criado na interface web
2. Backend envia webhook para Print Service
3. Print Service verifica IP autorizado
4. Imprime na impressora local via comando `lp`
5. Retorna status para Backend

## 📊 Monitoramento

### **Verificar Status:**
```bash
# Status geral
./deploy.sh status

# Logs em tempo real
./deploy.sh logs

# Saúde dos serviços
./deploy.sh health

# Restart se necessário
./deploy.sh restart
```

### **URLs de Monitoramento:**
- **Frontend:** `http://vps-ip/`
- **Backend Health:** `http://vps-ip:3000/health`
- **Print Service:** `http://vps-ip:3003/status`
- **Print Panel:** `http://vps-ip:3003/`

## 🔧 Manutenção

### **Backup:**
```bash
./deploy.sh backup
```

### **Update do Sistema:**
```bash
./deploy.sh update  # Puxa do Git e redeploy
```

### **Limpeza:**
```bash
./deploy.sh cleanup  # Remove containers não utilizados
```

### **Parar Tudo:**
```bash
./deploy.sh down
```

## 🛡️ Segurança

### **Firewall Configurado:**
- Porta 80: Frontend HTTP
- Porta 443: Frontend HTTPS (se configurado SSL)
- Porta 3000: Backend API (opcional, via proxy)
- Porta 3003: Print Service (interno)

### **Autenticação:**
- IPs autorizados no Print Service
- Auto-aprovação para VPS (31.97.162.165)
- Webhook secrets para comunicação segura

### **Volumes Seguros:**
- Dados persistentes em volumes Docker
- Logs centralizados
- Backup automático disponível

## 🌍 Acesso de Produção

### **Usuários Acessam:**
- **Web:** `https://seudominio.com` (se DNS configurado)
- **IP:** `http://vps-ip`
- **Painel Print:** `http://vps-ip:3003`

### **Integração com Printer Local:**
- Print Service na VPS pode enviar para impressora local
- IP local deve autorizar VPS (31.97.162.165)
- Webhook bidirecional para confirmação

## 🎯 Resultado Final

Após deploy, você terá:

✅ **Sistema completo rodando na VPS**  
✅ **Interface web acessível publicamente**  
✅ **API backend funcionando**  
✅ **Serviço de impressão via IP**  
✅ **Cache Redis para performance**  
✅ **Auto-update dos containers**  
✅ **Monitoramento e logs**  
✅ **Backup automático disponível**  

O sistema ficará disponível 24/7 na VPS e poderá imprimir na impressora local via rede!
