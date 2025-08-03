# Tessera Blockchain - Deployment Instructions

## 🚀 Opción 1: Heroku (Más fácil)

### Preparación:
```bash
# 1. Instalar Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Crear app
heroku create tessera-blockchain-api

# 4. Configurar variables de entorno
heroku config:set PRIVATE_KEY=tu_private_key_sin_0x
heroku config:set ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
heroku config:set AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
heroku config:set ETHERSCAN_API_KEY=tu_api_key
heroku config:set NODE_ENV=production

# 5. Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Crear Procfile:
```
web: node server.js
```

## 🌊 Opción 2: DigitalOcean Droplet

### Setup del servidor:
```bash
# 1. Crear droplet Ubuntu 22.04
# 2. Conectar via SSH

# 3. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Instalar PM2 y herramientas
sudo npm install -g pm2
sudo apt-get install -y git nginx

# 5. Clonar proyecto
git clone https://github.com/tu-usuario/tessera-blockchain.git
cd tessera-blockchain

# 6. Instalar dependencias
npm install

# 7. Configurar variables de entorno
cp .env.example .env
# Editar .env con nano .env

# 8. Compilar contratos
npm run compile

# 9. Iniciar con PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 10. Configurar Nginx
sudo nano /etc/nginx/sites-available/tessera-api
```

### Configuración Nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ☁️ Opción 3: AWS EC2

### Crear instancia:
```bash

sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

```

## 🐳 Opción 4: Docker

### Build y run local:
```bash
docker build -t tessera-blockchain .

docker run -d \
  --name tessera-api \
  -p 3000:3000 \
  -e PRIVATE_KEY=tu_private_key \
  -e ARBITRUM_RPC=tu_arbitrum_rpc \
  -e AVALANCHE_RPC=tu_avalanche_rpc \
  tessera-blockchain
```

## 📡 Integración con API Bineciot

### En tu API principal:
```javascript
// Ejemplo de endpoint en tu API Bineciot
app.post('/api/emit-certificate', async (req, res) => {
  try {
    // Llamar a tu servicio blockchain
    const response = await axios.post(
      'https://tu-tessera-api.herokuapp.com/api/certificate/mint',
      {
        student: req.body.student,
        certificate: req.body.certificate,
        institution: req.body.institution,
        ipfs: req.body.ipfs,
        network: req.body.network || 'arbitrum'
      }
    );

    // Guardar en tu base de datos
    await saveToDatabase({
      student_id: req.body.student.id,
      token_id: response.data.data.token_id,
      transaction_hash: response.data.data.transaction_hash,
      network: req.body.network
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔐 Variables de Entorno para Producción

```bash
# En production (.env)
NODE_ENV=production
PORT=3000
PRIVATE_KEY=tu_private_key_real_sin_0x
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
ETHERSCAN_API_KEY=tu_api_key_real
```

## 📊 Monitoreo y Logs

### Con PM2:
```bash
# Ver logs
pm2 logs tessera-blockchain-api

# Ver status
pm2 status

# Restart
pm2 restart tessera-blockchain-api

# Monitor en tiempo real
pm2 monit
```

## 🛠️ Comandos de Mantenimiento

```bash
# Compilar contratos
npm run compile

# Verificar contratos
npm run verify:arbitrum
npm run verify:avalanche

# Probar API localmente
npm run api:mint

# Test completo
npm test
```
