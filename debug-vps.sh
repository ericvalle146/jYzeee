# ====================================
# 🔍 SCRIPT DE DEBUG URGENTE
# ====================================


echo '=== 1. STATUS DOS CONTAINERS ==='
docker ps | grep jyze

echo -e '\n=== 2. LOGS DO FRONTEND ==='
docker logs jyze-frontend --tail 20

echo -e '\n=== 3. LOGS DO BACKEND ==='  
docker logs jyze-backend --tail 10

echo -e '\n=== 4. TESTE HEALTH CHECK ==='
curl -v http://localhost:8080/health

echo -e '\n=== 5. TESTE DIRETO NO CONTAINER ==='
docker exec jyze-frontend curl -s http://localhost/health

echo -e '\n=== 6. REDE DOCKER ==='
docker network ls | grep jyze

echo -e '\n=== 7. PORTAS EXPOSTAS ==='
netstat -tulpn | grep :8080

echo -e '\n=== COPIE E EXECUTE NA VPS ==='

