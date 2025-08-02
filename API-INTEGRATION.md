# 🎓 Tessera Blockchain - Sistema de Certificación NFT

## Arquitectura del Sistema

El sistema Tessera está diseñado para emitir certificados como NFTs en las redes Avalanche y Arbitrum, conectando una API backend con contratos inteligentes en blockchain.

### Flujo de Datos: API → Blockchain

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (Portal)      │───▶│   (Supabase)    │───▶│   (Avalanche/   │
│                 │    │                 │    │    Arbitrum)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   IPFS Storage  │
                       │   (Pinata)      │
                       └─────────────────┘
```

## 🚀 Configuración e Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Compilar contratos
```bash
npm run compile
```

### 3. Configurar variables de entorno
Crear archivo `.env` con:
```env
# Redes
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Llaves privadas
PRIVATE_KEY=your_private_key_here

# IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Base de datos
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 📋 Esquema de Base de Datos

### Tablas Principales

1. **users** - Usuarios del sistema (estudiantes, instituciones, admins)
2. **institutions** - Instituciones educativas registradas
3. **certificates** - Certificados emitidos (enlaza DB con blockchain)
4. **tokens** - Control de tokens por institución
5. **ipfs_files** - Archivos subidos a IPFS

## 🔗 Integración API-Blockchain

### Datos que Recibe la API

La API recibe datos desde la base de datos en este formato:

```typescript
// Datos del estudiante desde Supabase
{
  student: {
    id: "uuid-del-estudiante",
    email: "estudiante@email.com", 
    full_name: "Juan Pérez González",
    wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  },
  certificate: {
    title: "Certificado de Finalización - DeFi Protocols",
    description: "Certificado que acredita...",
    course_name: "DeFi Protocols en Arbitrum",
    issued_at: "2025-08-02T00:00:00Z",
    expiration_date: "2030-08-02T00:00:00Z" // opcional
  },
  institution: {
    id: "uuid-de-institucion",
    name: "Academia Crypto Finance",
    legal_id: "RUC-20123456789"
  },
  ipfs: {
    image_hash: "QmArbitrumCertificateImageHash",
    metadata_hash: "QmArbitrumMetadataHash" // opcional
  },
  network: "arbitrum" // o "avalanche"
}
```

### Respuesta de la Blockchain

La blockchain devuelve estos datos a la API:

```typescript
{
  success: true,
  data: {
    token_id: "0",
    transaction_hash: "0x1234567890abcdef...",
    block_number: 12345,
    gas_used: "150000",
    contract_address: "0xContractAddress...",
    metadata_url: "https://ipfs.io/ipfs/QmHash...",
    certificate_id: "abc123def456..."
  }
}
```

## 🎯 Cómo Usar el Sistema

### 1. Emisión Individual

```bash
# Probar con datos de ejemplo
npm run api:mint:arbitrum

# O para Avalanche
npm run api:mint:avalanche
```

**En tu aplicación:**
```typescript
import { issueSingleCertificate } from './scripts/api-certificate-mint';

// Datos que vienen de tu base de datos
const studentData = {
  student_id: "uuid-estudiante",
  student_email: "juan@email.com",
  student_name: "Juan Pérez",
  wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  certificate_title: "Certificado DeFi",
  course_name: "DeFi Protocols",
  institution_id: "uuid-institucion", 
  institution_name: "Academia Crypto",
  institution_legal_id: "RUC-123456789",
  ipfs_image_hash: "QmImageHash",
  blockchain_network: "arbitrum"
};

const result = await issueSingleCertificate(studentData);
console.log(result);
```

### 2. Emisión en Lote

```typescript
import { issueBatchCertificates } from './scripts/api-certificate-mint';

// Array de estudiantes
const studentsData = [
  { /* datos estudiante 1 */ },
  { /* datos estudiante 2 */ },
  // ... más estudiantes
];

const results = await issueBatchCertificates(studentsData);
```

### 3. Verificación

```typescript
import { CertificateController } from './api/certificate-controller';

const verification = await CertificateController.verifyCertificate({
  tokenId: "0",
  network: "arbitrum"
});
```

## 📁 Estructura de Archivos

```
tessera-blockchain/
├── api/
│   ├── certificate-service.ts     # Lógica principal blockchain
│   └── certificate-controller.ts  # Controlador API
├── scripts/
│   ├── api-certificate-mint.ts    # Script principal para API
│   └── utils/
│       ├── metadata-builder.ts    # Generador de metadatos
│       └── contract-utils.ts      # Utilidades contratos
├── contracts/
│   ├── arbitrum/
│   │   └── CertNFT_Arbitrum.sol
│   └── avalanche/
│       └── CertNFT_Avalanche.sol
├── deployments/
│   ├── arbitrum/
│   │   ├── CertNFTArbitrum.json
│   │   └── api-mint-*.json        # Logs de emisiones
│   └── avalanche/
│       ├── CertNFTAvalanche.json
│       └── api-mint-*.json
├── types/
│   └── api-types.ts               # Tipos TypeScript
└── test/
    ├── arbitrum.test.ts
    └── avalanche.test.ts
```

## 🔧 Funciones Principales

### CertificateService

- `issueCertificate()` - Emite certificado individual
- `batchIssueCertificates()` - Emite múltiples certificados
- `validateRequest()` - Valida datos de entrada
- `getContractInfo()` - Obtiene info del contrato deployado

### CertificateController

- `issueCertificate()` - Endpoint REST para emisión
- `batchIssueCertificates()` - Endpoint REST para lotes
- `verifyCertificate()` - Endpoint REST para verificación

### MetadataBuilder

- `buildCertificateMetadata()` - Genera metadatos NFT
- `generateCertificateId()` - Genera ID único
- `validateMetadata()` - Valida metadatos

## 📊 Logs y Auditoría

Cada emisión guarda un archivo JSON con:

```json
{
  "request": { /* datos originales */ },
  "mint": { /* datos blockchain */ },
  "metadata": { /* metadatos generados */ },
  "network": "arbitrum",
  "timestamp": "2025-08-02T...",
  "api_version": "1.0.0"
}
```

## 🌐 Redes Soportadas

### Arbitrum
- **Testnet:** Arbitrum Sepolia
- **Mainnet:** Arbitrum One
- **Contrato:** CertNFTArbitrum

### Avalanche  
- **Testnet:** Fuji
- **Mainnet:** Avalanche C-Chain
- **Contrato:** CertNFTAvalanche

## 🚨 Manejo de Errores

El sistema maneja estos tipos de errores:

1. **Validación:** Datos incorrectos de entrada
2. **Blockchain:** Problemas con transacciones
3. **IPFS:** Problemas subiendo archivos
4. **Base de datos:** Errores de conexión/consulta

## 🔐 Seguridad

- Validación de direcciones Ethereum
- Verificación de autorización de instituciones
- Estimación de gas antes de transacciones
- Logs completos para auditoría

## 📈 Monitoreo

Para producción, considera monitorear:

- Gas usado por transacción
- Tiempo de confirmación
- Errores de transacción
- Uso de tokens por institución

## 🤝 Integración con Frontend

El frontend puede llamar directamente a las funciones:

```javascript
// Desde Next.js API route
import { issueSingleCertificate } from '@/blockchain/scripts/api-certificate-mint';

export default async function handler(req, res) {
  try {
    const result = await issueSingleCertificate(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 📝 Comandos Útiles

```bash
# Compilar y testear
npm run compile
npm run test

# Deployar contratos
npm run deploy:arbitrum-sepolia
npm run deploy:fuji

# Probar API
npm run api:mint

# Scripts individuales (legacy)
npm run mint:arbitrum
npm run mint:avalanche
```

---

## 🎯 Listo para Producción

Este sistema está preparado para:

✅ Recibir datos de la API/base de datos  
✅ Validar información del estudiante  
✅ Generar metadatos NFT automáticamente  
✅ Emitir certificados en blockchain  
✅ Manejar errores y logs  
✅ Soportar emisión individual y en lote  
✅ Guardar auditoría completa  

**La API envía → Blockchain procesa → Respuesta estructurada**
