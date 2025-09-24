# 🚀 DEPLOY JYZE - INSTRUÇÕES SIMPLES

## ⚡ Deploy Rápido na VPS

### 1. Preparar VPS:
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar para aplicar grupo docker
sudo reboot
```

### 2. Fazer Deploy:
```bash
# Clonar repositório
git clone https://github.com/ericvalle146/jYzeee.git
cd jYzeee

# Deploy automático (tudo configurado!)
chmod +x deploy.sh
./deploy.sh deploy
```

## ✅ Configurações Automáticas

O script já configura tudo automaticamente:

### 🗄️ **Banco de Dados:**
- ✅ Supabase: `https://jvwfdcjqrptlpgxqxnmt.supabase.co`
- ✅ Chave: Já configurada

### 🔐 **SSH para Impressão:**
- ✅ Usuário: `eric`
- ✅ IP: `192.168.3.5`
- ✅ Senha: `eqrwiecr`
- ✅ Impressora: `5808L-V2024`

### 🌐 **URLs:**
- ✅ Frontend: `https://jyze.space`
- ✅ Backend: `https://api.jyze.space`

### 🤖 **Integrações:**
- ✅ N8N: `https://n8n.jyze.space`
- ✅ Evolution API: `https://evolution.jyze.space`
- ✅ WhatsApp: Configurado
- ✅ Chat Assistente: Ativo

## 🎯 Resultado Final

Após o deploy:
- **Frontend:** https://jyze.space
- **Backend:** https://api.jyze.space  
- **Impressão:** SSH automático VPS → Seu PC

## 📊 Comandos Úteis

```bash
# Ver status
./deploy.sh status

# Ver logs
./deploy.sh logs

# Reiniciar
./deploy.sh restart

# Parar tudo
./deploy.sh stop

# Iniciar tudo
./deploy.sh start
```

## 🔧 Se Algo Der Errado

```bash
# Ver logs detalhados
./deploy.sh logs backend
./deploy.sh logs frontend

# Testar SSH manualmente
ssh eric@192.168.3.5

# Reiniciar tudo
./deploy.sh restart
```

## 🖨️ Testar Impressão

```bash
# Testar SSH da VPS
ssh eric@192.168.3.5 'echo "Teste VPS" | lp -d "5808L-V2024"'

# Ver se impressora está funcionando
ssh eric@192.168.3.5 'lpstat -p 5808L-V2024'
```

**É só isso! O deploy está 100% automatizado! 🚀**
