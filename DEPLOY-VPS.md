# 🚀 DEPLOY JYZE DELIVERY - VPS

Este documento explica como fazer o deploy completo do sistema JYZE Delivery na VPS.

## 📋 Arquitetura do Sistema

```
🌐 Internet
    ↓
┌─────────────────────────────────────────┐
│              VPS (Cloud)                │
│                                         │
│  https://jyze.space (Frontend)         │
│  ┌─────────────────────────────────┐    │
│  │         React/Vite              │    │
│  │       (Port 80/443)             │    │
│  └─────────────────────────────────┘    │
│                  ↓                      │
│  https://api.jyze.space (Backend)      │
│  ┌─────────────────────────────────┐    │
│  │         NestJS                  │    │
│  │       (Port 3002)               │    │
│  │                                 │    │
│  │   🔐 SSH Client                │────┼──→ SSH túnel
│  │   (sshpass + ssh)               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                  ↓ SSH
        🔐 ssh eric@192.168.3.5
                  ↓
┌─────────────────────────────────────────┐
│           PC Local (Casa)               │
│                                         │
│  📱 SSH Server (Port 22)               │
│  ┌─────────────────────────────────┐    │
│  │      Sistema Linux              │    │
│  │                                 │    │
│  │  🖨️ Impressora 5808L-V2024     │    │
│  │     (USB/Local)                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## 🔧 Pré-requisitos

### Na VPS:

```bash
# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sessão para aplicar grupo docker
logout
```

### No PC Local:

```bash
# Garantir que SSH está ativo
sudo systemctl enable ssh
sudo systemctl start ssh

# Configurar firewall (se necessário)
sudo ufw allow ssh
sudo ufw enable

# Verificar IP local
ip addr show | grep inet
```

## 📦 Deploy na VPS

### 1. Clonar o repositório:

```bash
cd /opt
sudo git clone https://github.com/ericvalle146/jYzeee.git jyze-delivery
sudo chown -R $USER:$USER jyze-delivery
cd jyze-delivery
```

### 2. Configurar variáveis de ambiente:

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar configurações
nano .env
```

**Configurações importantes no .env:**

```bash
# 🗄️ BANCO DE DADOS (SUPABASE)
SUPABASE_URL=https://jfhffvwlmmpvzrrxqkiy.supabase.co
SUPABASE_KEY=eyJhbGci...

# 🔐 IMPRESSÃO SSH
SSH_USER=eric
SSH_HOST=192.168.3.5
SSH_PASSWORD=sua_senha_ssh_aqui
PRINTER_NAME=5808L-V2024

# 🌐 URLS
CORS_ORIGIN=https://jyze.space
FRONTEND_URL=https://jyze.space
BACKEND_URL=https://api.jyze.space
```

### 3. Deploy automático:

```bash
# Deploy completo
./deploy.sh

# Ou comandos específicos:
./deploy.sh deploy     # Deploy completo
./deploy.sh start      # Apenas iniciar
./deploy.sh stop       # Parar serviços
./deploy.sh status     # Ver status
./deploy.sh logs       # Ver logs
```

## 🔐 Configuração SSH para Impressão

### No PC Local (onde está a impressora):

1. **Verificar se SSH está funcionando:**
```bash
# Testar localmente
ssh eric@localhost

# Verificar status
sudo systemctl status ssh
```

2. **Configurar acesso (se necessário):**
```bash
# Editar configuração SSH
sudo nano /etc/ssh/sshd_config

# Permitir autenticação por senha
PasswordAuthentication yes

# Reiniciar SSH
sudo systemctl restart ssh
```

### Na VPS (testar conexão):

```bash
# Testar conexão SSH da VPS para o PC
ssh eric@192.168.3.5

# Testar impressão direta
ssh eric@192.168.3.5 'echo "Teste VPS" | lp -d "5808L-V2024"'
```

## 🌐 Configuração DNS

Configure os domínios para apontar para o IP da VPS:

```
Tipo A: jyze.space → [IP_DA_VPS]
Tipo A: api.jyze.space → [IP_DA_VPS]
Tipo A: www.jyze.space → [IP_DA_VPS]
```

## 📊 Monitoramento

### Ver logs em tempo real:
```bash
# Todos os serviços
./deploy.sh logs

# Serviço específico
./deploy.sh logs backend
./deploy.sh logs frontend
```

### Verificar status:
```bash
./deploy.sh status
```

### Health checks:
```bash
./deploy.sh health
```

## 🔄 Comandos Úteis

### Atualização rápida:
```bash
./deploy.sh quick-update
```

### Backup manual:
```bash
sudo tar -czf /var/backups/jyze/manual-backup-$(date +%Y%m%d).tar.gz /var/lib/jyze
```

### Rollback:
```bash
./deploy.sh rollback
```

### Limpeza do sistema:
```bash
./deploy.sh cleanup
```

## 🚨 Troubleshooting

### Frontend não carrega:
```bash
# Verificar logs
./deploy.sh logs frontend

# Verificar se está rodando
curl -I http://localhost

# Reiniciar
./deploy.sh restart
```

### Backend não responde:
```bash
# Verificar logs
./deploy.sh logs backend

# Testar API
curl http://localhost:3002/printer/status

# Verificar SSH
docker-compose exec backend sshpass -p 'sua_senha' ssh eric@192.168.3.5 'echo teste'
```

### Impressão não funciona:
```bash
# Testar SSH do container
docker-compose exec backend sshpass -p 'sua_senha' ssh eric@192.168.3.5 'lpstat -t'

# Verificar impressora no PC local
ssh eric@192.168.3.5 'lpstat -p 5808L-V2024'

# Testar impressão manual
ssh eric@192.168.3.5 'echo "Teste manual" | lp -d "5808L-V2024"'
```

## 📝 URLs Finais

Após o deploy completo:

- **Frontend:** https://jyze.space
- **Backend API:** https://api.jyze.space
- **Status:** https://api.jyze.space/printer/status
- **Health Check:** https://jyze.space/health

## 🔒 Segurança

- SSH configurado com senha (pode ser melhorado com chaves)
- CORS configurado apenas para domínios autorizados
- Headers de segurança no Nginx
- Containers rodando com usuários não-root
- Logs centralizados e rotacionados

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs: `./deploy.sh logs`
2. Verificar status: `./deploy.sh status`
3. Revisar configurações no `.env`
4. Testar conexão SSH manualmente
