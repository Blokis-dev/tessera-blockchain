# 🔑 INSTRUCCIONES PARA OBTENER API KEY DE ARBITRUM

## Problema Detectado
❌ La API key actual de Arbitrum está **INVÁLIDA**: `1EM9HYN75FAY7EJKISMD9DDF1UKNS3BD17`

## Solución: Obtener Nueva API Key

### 1. Ir a Arbiscan.io
🌐 Visita: https://arbiscan.io/apis

### 2. Crear Cuenta/Iniciar Sesión
- Si no tienes cuenta, regístrate
- Si ya tienes cuenta, inicia sesión

### 3. Generar Nueva API Key
- Ve a la sección "API Keys"
- Haz clic en "Add" o "Create New API Key"
- Asigna un nombre descriptivo: "Tessera Blockchain Verification"
- Copia la nueva API key

### 4. Actualizar .env
Reemplaza la línea en tu archivo `.env`:

```bash
# Cambiar esta línea:
ARBISCAN_API_KEY=1EM9HYN75FAY7EJKISMD9DDF1UKNS3BD17

# Por esta (con tu nueva API key):
ARBISCAN_API_KEY=TU_NUEVA_API_KEY_AQUI
```

### 5. Verificar que Funciona
Ejecuta este comando para probar:

```bash
Invoke-WebRequest -Uri "https://api-sepolia.arbiscan.io/api?module=account&action=balance&address=0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B&tag=latest&apikey=TU_NUEVA_API_KEY" | Select-Object -ExpandProperty Content
```

Si funciona, verás algo como:
```json
{"status":"1","message":"OK","result":"248987739310822300"}
```

Si no funciona, verás:
```json
{"status":"0","message":"NOTOK","result":"Invalid API Key (#err2)|ARBTESTNET"}
```

## ✅ Una vez actualizada la API key:

1. Podrás verificar contratos en Arbitrum:
   ```bash
   npm run verify:arbitrum
   ```

2. Los scripts de minting funcionarán correctamente:
   ```bash
   npm run mint:arbitrum
   npm run api:mint:arbitrum
   ```

## 📝 Notas Importantes:
- ✅ Tu API key de Etherscan funciona perfecto para Avalanche/SnowTrace
- ❌ Necesitas una API key específica para Arbitrum/Arbiscan
- 🔄 Las API keys son gratuitas pero tienen límites de uso
- 🔒 No compartas tus API keys públicamente
