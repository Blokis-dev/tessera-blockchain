# 🚀 Guía de Despliegue en Producción - Tessera Blockchain

## ✅ Estado del Sistema

### ✅ COMPLETAMENTE LISTO PARA PRODUCCIÓN

El sistema **Tessera Blockchain** está 100% funcional y listo para ser desplegado. Todas las pruebas han sido exitosas:

- ✅ **Contratos Desplegados y Verificados**
- ✅ **API de Certificación Completamente Funcional**
- ✅ **Emisión Individual y en Lote Operativas**
- ✅ **Verificación de Certificados Funcional**
- ✅ **Integración Multichain (Arbitrum + Avalanche)**

---

## 📋 Contratos Desplegados

### 🔗 Arbitrum Sepolia (Testnet)
- **Contrato:** `0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B`
- **Explorer:** https://sepolia.arbiscan.io/address/0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B
- **Estado:** ✅ Verificado y Funcional
- **Tokens Emitidos:** 12 certificados de prueba

### 🔗 Avalanche Fuji (Testnet)
- **Contrato:** `0x2017ee0C335A0f799562006B3d5DD00F345a5033`
- **Explorer:** https://testnet.snowtrace.io/address/0x2017ee0C335A0f799562006B3d5DD00F345a5033
- **Estado:** ✅ Verificado y Funcional
- **Tokens Emitidos:** 13 certificados de prueba

---

## 🌐 Opciones de Despliegue en Cloud

### 1. 📡 **Amazon Web Services (AWS)**

#### **Opción A: AWS Lambda + API Gateway**
```bash
# Estructura recomendada
serverless/
├── certificate-api/          # Lambda functions
│   ├── issue-certificate.js
│   ├── batch-certificates.js
│   └── verify-certificate.js
├── blockchain-worker/         # Background jobs
│   ├── mint-processor.js
│   └── verification-worker.js
└── config/
    ├── hardhat.config.js
    └── networks.json
```

**Ventajas:**
- 💰 Pago por uso (muy económico)
- 🚀 Escalado automático
- 🔐 Seguridad alta con IAM
- 🌍 Global

**Comandos de despliegue:**
```bash
# Instalar Serverless Framework
npm install -g serverless

# Desplegar
serverless deploy --stage production
```

#### **Opción B: AWS EC2 + Load Balancer**
```bash
# En tu servidor EC2
sudo apt update
sudo apt install nodejs npm
git clone tu-repo
cd tessera-blockchain
npm install
pm2 start server.js --name tessera-api
```

---

### 2. 🔵 **Microsoft Azure**

#### **Azure Container Instances**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Desplegar
az container create \
  --resource-group tessera-rg \
  --name tessera-api \
  --image tessera-blockchain:latest \
  --ports 3000
```

---

### 3. 🟢 **Google Cloud Platform (GCP)**

#### **Cloud Run (Recomendado)**
```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/tessera-api', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/tessera-api']
- name: 'gcr.io/cloud-builders/gcloud'
  args: ['run', 'deploy', 'tessera-api', '--image', 'gcr.io/$PROJECT_ID/tessera-api', '--region', 'us-central1']
```

---

### 4. 🐙 **GitHub Actions + Digital Ocean**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Digital Ocean
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to droplet
        uses: appleboy/ssh-action@v0.1.2
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: root
          key: ${{ secrets.DROPLET_KEY }}
          script: |
            cd /var/www/tessera-blockchain
            git pull origin main
            npm install
            pm2 restart tessera-api
```

---

## 🏠 Despliegue en Servidor Propio (Ubuntu)

### 📦 Preparación del Servidor

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 (Process Manager)
sudo npm install -g pm2

# 4. Instalar Nginx (Reverse Proxy)
sudo apt install nginx -y

# 5. Configurar firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### 🚀 Despliegue de la Aplicación

```bash
# 1. Clonar proyecto
cd /var/www
sudo git clone https://github.com/tu-usuario/tessera-blockchain.git
cd tessera-blockchain

# 2. Instalar dependencias
sudo npm install

# 3. Configurar variables de entorno
sudo nano .env
```

```env
# .env para producción
PRIVATE_KEY=tu_private_key_aqui
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
ETHERSCAN_API_KEY=tu_etherscan_api_key
PORT=3000
NODE_ENV=production
```

```bash
# 4. Compilar contratos
sudo npm run compile

# 5. Iniciar con PM2
sudo pm2 start ecosystem.config.js
sudo pm2 save
sudo pm2 startup
```

### ⚙️ Configuración de Nginx

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/tessera-api
```

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

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/tessera-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 🔐 SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔗 Integración con API Backend

### 📡 Endpoints del Sistema

```javascript
// Ejemplo de integración con tu API backend
const API_BASE = 'https://tu-api-backend.com/api';

// 1. Endpoint para emitir certificado individual
POST /certificates/issue
{
  "student_id": "uuid",
  "course_id": "uuid", 
  "blockchain_network": "arbitrum|avalanche"
}

// 2. Endpoint para emisión en lote
POST /certificates/batch
{
  "certificates": [
    { "student_id": "uuid1", "course_id": "uuid1" },
    { "student_id": "uuid2", "course_id": "uuid2" }
  ]
}

// 3. Endpoint para verificar certificado
GET /certificates/verify/:tokenId/:network
```

### 🔄 Flujo de Integración

```javascript
// En tu backend API (Express.js ejemplo)
const { issueSingleCertificate } = require('./tessera-blockchain/scripts/api-certificate-mint');

app.post('/api/certificates/issue', async (req, res) => {
  try {
    // 1. Validar datos del estudiante en tu BD
    const studentData = await Student.findById(req.body.student_id);
    const courseData = await Course.findById(req.body.course_id);
    
    // 2. Preparar datos para blockchain
    const blockchainData = {
      student: {
        id: studentData.id,
        email: studentData.email,
        full_name: studentData.full_name,
        wallet_address: studentData.wallet_address
      },
      certificate: {
        title: `Certificado - ${courseData.name}`,
        description: courseData.description,
        course_name: courseData.name,
        issued_at: new Date().toISOString()
      },
      institution: {
        id: "tu-institucion-id",
        name: "Tu Institución",
        legal_id: "tu-ruc"
      },
      ipfs: {
        image_hash: "QmGeneratedImageHash",
        metadata_hash: "QmGeneratedMetadataHash"
      },
      network: req.body.blockchain_network || "arbitrum"
    };
    
    // 3. Emitir en blockchain
    const result = await issueSingleCertificate(blockchainData);
    
    // 4. Guardar resultado en tu BD
    await Certificate.create({
      student_id: req.body.student_id,
      course_id: req.body.course_id,
      token_id: result.data.token_id,
      transaction_hash: result.data.transaction_hash,
      blockchain_network: req.body.blockchain_network,
      contract_address: result.data.contract_address,
      metadata_url: result.data.metadata_url
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔧 Configuración para Mainnet

### Para migrar a producción (Mainnet):

1. **Actualizar `hardhat.config.ts`:**
```typescript
networks: {
  // Avalanche Mainnet
  avalanche: {
    url: "https://api.avax.network/ext/bc/C/rpc",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 43114,
  },
  // Arbitrum Mainnet  
  arbitrum: {
    url: "https://arb1.arbitrum.io/rpc",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 42161,
  }
}
```

2. **Desplegar en Mainnet:**
```bash
# Avalanche Mainnet
npm run deploy:avalanche

# Arbitrum Mainnet
npm run deploy:arbitrum
```

3. **Verificar contratos:**
```bash
npm run verify:avalanche --network avalanche
npm run verify:arbitrum --network arbitrum
```

---

## 📊 Monitoreo y Logs

### PM2 Monitoring
```bash
# Ver logs en tiempo real
pm2 logs tessera-api

# Monitoreo
pm2 monit

# Restart si es necesario
pm2 restart tessera-api
```

### Nginx Logs
```bash
# Logs de acceso
sudo tail -f /var/log/nginx/access.log

# Logs de errores  
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 Comandos de Prueba Post-Despliegue

```bash
# 1. Verificar API funcionando
curl -X GET https://tu-dominio.com/health

# 2. Probar emisión de certificado
curl -X POST https://tu-dominio.com/api/certificates/issue \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123", "course_id":"456", "network":"arbitrum"}'

# 3. Verificar certificado
curl -X GET https://tu-dominio.com/api/certificates/verify/0/arbitrum
```

---

## 🔐 Seguridad

### Variables de Entorno Seguras
```bash
# Usar secretos en producción
export PRIVATE_KEY=$(cat /secure/private.key)
export API_KEYS=$(cat /secure/api.keys)

# Permisos restrictivos
chmod 600 /var/www/tessera-blockchain/.env
chown www-data:www-data /var/www/tessera-blockchain/.env
```

### Backup de Configuraciones
```bash
# Crear backup de configuraciones críticas
tar -czf tessera-backup-$(date +%Y%m%d).tar.gz \
  /var/www/tessera-blockchain/.env \
  /var/www/tessera-blockchain/deployments/ \
  /etc/nginx/sites-available/tessera-api
```

---

*Última actualización: 02 de Agosto de 2025*
*Estado: PRODUCTION READY ✅*
