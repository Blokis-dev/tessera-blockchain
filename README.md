# 🎓 Tessera Blockchain - Sistema de Certificación NFT

Sistema de certificación digital usando NFTs en las redes Avalanche y Arbitrum, con integración completa API-Blockchain.

## 🌟 Características Principales

- ✅ **Certificados NFT** en Avalanche y Arbitrum
- ✅ **Integración API-Blockchain** completa
- ✅ **Metadatos en IPFS** con Pinata
- ✅ **Emisión individual y en lote**
- ✅ **Validación automática** de datos
- ✅ **Logs de auditoría** completos
- ✅ **Base de datos Supabase** integrada

## 🏗️ Arquitectura

```
Frontend (Portal) → API Backend → Blockchain (Avalanche/Arbitrum) 
                      ↓
                  IPFS (Pinata)
                      ↓  
               Base de Datos (Supabase)
```

Este proyecto implementa contratos inteligentes para la emisión de certificados NFT con:

- **Avalanche C-Chain**: Contrato principal con soporte para ICM (Interchain Messaging)
- **Arbitrum One**: Contrato optimizado para menores costos de gas
- **Interoperabilidad**: Comunicación entre chains mediante ICM
- **Verificación**: Sistema robusto de verificación y validación
- **Gestión de Instituciones**: Control de acceso basado en roles

## 📁 Estructura del Proyecto

```
tessera-blockchain/
├── contracts/
│   ├── avalanche/
│   │   └── CertNFT_Avalanche.sol       # eERC‑721 + ICM/ICTT
│   └── arbitrum/
│       └── CertNFT_Arbitrum.sol        # ERC‑721 optimizado
│
├── deploy/
│   ├── deploy-avalanche.ts             # Despliegue en Avalanche
│   ├── deploy-arbitrum.ts              # Despliegue en Arbitrum
│
├── api/
│   ├── certificate-service.ts          # Lógica principal blockchain
│   └── certificate-controller.ts       # Controlador API REST
│
├── scripts/
│   ├── api-certificate-mint.ts         # 🎯 Script principal para API
│   ├── mint-avalanche.ts               # Mint + envío ICM (legacy)
│   ├── mint-arbitrum.ts                # Mint en Arbitrum (legacy)
│   ├── verify-avalanche.ts             # Verificación SnowTrace
│   ├── verify-arbitrum.ts              # Verificación Arbiscan
│   └── utils/
│       ├── metadata-builder.ts         # Utilidades para metadatos
│       └── contract-utils.ts           # Utilidades contratos
│
├── types/
│   └── api-types.ts                    # Tipos TypeScript completos
│
├── test/
│   ├── avalanche.test.ts               # Tests Avalanche
│   └── arbitrum.test.ts                # Tests Arbitrum
│
├── deployments/                        # Direcciones deployadas
│   ├── avalanche/
│   └── arbitrum/
│
├── hardhat.config.ts                   # Configuración Hardhat
├── .env                                # Variables de entorno
└── README.md
```

## 🚀 Instalación Rápida

```bash
npm install
npm run compile
```

### Configurar variables de entorno
```bash
# Crear archivo .env
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here
```

## 🎯 Uso Principal (API Integration)

### 🌐 Emisión desde API (RECOMENDADO)

El sistema está diseñado para recibir datos de la API/base de datos y emitir certificados automáticamente:

```typescript
import { issueSingleCertificate } from './scripts/api-certificate-mint';

// Datos que vienen de tu base de datos Supabase
const studentData = {
  student_id: "uuid-estudiante",
  student_name: "Juan Pérez González", 
  student_email: "juan@email.com",
  wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  course_name: "DeFi Protocols en Arbitrum",
  institution_name: "Academia Crypto Finance",
  institution_id: "uuid-institucion",
  institution_legal_id: "RUC-123456789",
  ipfs_image_hash: "QmImageHash",
  blockchain_network: "arbitrum"
};

const result = await issueSingleCertificate(studentData);
// ✅ Certificado emitido en blockchain
```

### 📊 Emisión en Lote

```typescript
import { issueBatchCertificates } from './scripts/api-certificate-mint';

const studentsData = [
  { /* estudiante 1 */ },
  { /* estudiante 2 */ },
  // ... más estudiantes con la misma estructura
];

const results = await issueBatchCertificates(studentsData);
// ✅ Múltiples certificados emitidos en una transacción
```

### 🧪 Probar con Datos de Ejemplo

```bash
# Ver demo completo del flujo API-Blockchain
npm run demo

# Probar integración API completa
npm run api:mint              # Datos de ejemplo en ambas redes
npm run api:mint:arbitrum     # Solo Arbitrum con ejemplos
npm run api:mint:avalanche    # Solo Avalanche con ejemplos
```

## 📋 Scripts Disponibles

### 🎯 API Integration (Principal)
```bash
npm run api:mint              # Probar con datos de ejemplo
npm run api:mint:arbitrum     # Específico para Arbitrum  
npm run api:mint:avalanche    # Específico para Avalanche
```

### Compilación y Testing
```bash
npm run compile          # Compila los contratos
npm run test            # Ejecuta todos los tests
npm run test:avalanche  # Tests solo de Avalanche
npm run test:arbitrum   # Tests solo de Arbitrum
npm run clean           # Limpia artifacts
```

### Despliegue
```bash
# Avalanche Fuji Testnet
npm run deploy:fuji

# Avalanche Mainnet
npm run deploy:avalanche

# Arbitrum Sepolia Testnet
npm run deploy:arbitrum-sepolia

# Arbitrum One Mainnet
npm run deploy:arbitrum
```

### Verificación
```bash
npm run verify:fuji      # Verifica en SnowTrace
npm run verify:arbitrum  # Verifica en Arbiscan
```

### 🔧 Scripts Legacy (datos hardcodeados)
```bash
npm run mint:avalanche   # Mint en Avalanche
npm run mint:arbitrum    # Mint en Arbitrum
```

## 🔧 Uso de los Contratos

### Desplegar Contratos

1. **Desplegar en Avalanche Fuji**
```bash
npm run deploy:fuji
```

2. **Desplegar en Arbitrum Sepolia**
```bash
npm run deploy:arbitrum-sepolia
```

### Emitir Certificados

```typescript
// Autorizar una institución
await certNFT.authorizeInstitution(institutionAddress);

// Emitir un certificado
await certNFT.issueCertificate(
  studentAddress,
  "Juan Pérez García",
  "Desarrollo Blockchain",
  "Universidad Tech",
  "https://ipfs.io/ipfs/QmHash",
  "QmMetadataHash",
  expirationTimestamp
);
```

### Verificar Certificados

```typescript
// Verificar validez
const isValid = await certNFT.verifyCertificate(tokenId);

// Obtener datos del certificado
const certData = await certNFT.getCertificateData(tokenId);
```

## 🧪 Testing

El proyecto incluye tests completos para ambos contratos:

```bash
# Ejecutar todos los tests
npm run test

# Tests específicos
npm run test:avalanche
npm run test:arbitrum

# Tests con coverage
npx hardhat coverage
```

### Casos de Prueba Incluidos

- ✅ Despliegue de contratos
- ✅ Gestión de instituciones autorizadas
- ✅ Emisión de certificados
- ✅ Verificación de certificados
- ✅ Revocación de certificados
- ✅ Batch minting (Arbitrum)
- ✅ Funcionalidad ICM (Avalanche)
- ✅ Manejo de errores
- ✅ Eficiencia de gas

## 🌐 Redes Soportadas

### Testnets
- **Avalanche Fuji**: Chain ID 43113
- **Arbitrum Sepolia**: Chain ID 421614

### Mainnets
- **Avalanche C-Chain**: Chain ID 43114
- **Arbitrum One**: Chain ID 42161

## 📊 Características de los Contratos

### CertNFT_Avalanche
- ✅ ERC-721 compliant
- ✅ Soporte ICM para comunicación interchain
- ✅ Gestión de instituciones autorizadas
- ✅ Certificados con fecha de expiración
- ✅ Sistema de revocación
- ✅ Metadatos IPFS

### CertNFT_Arbitrum
- ✅ ERC-721 optimizado para Arbitrum
- ✅ Batch minting para eficiencia
- ✅ Menores costos de gas
- ✅ Compatibilidad total con el contrato de Avalanche
- ✅ Funciones de utilidad adicionales

## 🔐 Seguridad

### Controles Implementados
- **Ownable**: Solo el owner puede autorizar instituciones
- **Access Control**: Solo instituciones autorizadas pueden emitir
- **Validaciones**: Verificación de parámetros de entrada
- **Reentrancy Protection**: Usando OpenZeppelin
- **Expiration Checks**: Certificados con validez temporal

### Auditoría
- Usar OpenZeppelin para componentes seguros
- Tests exhaustivos incluidos
- Validaciones robustas en todos los métodos

## 🎯 Integración con Frontend

### APIs Expuestas

```typescript
// Verificación pública
function verifyCertificate(uint256 tokenId) external view returns (bool)

// Datos del certificado
function getCertificateData(uint256 tokenId) external view returns (CertificateData)

// Metadatos estándar
function tokenURI(uint256 tokenId) public view returns (string memory)
```

### Eventos para Tracking

```solidity
event CertificateIssued(uint256 indexed tokenId, address indexed recipient, ...);
event CertificateRevoked(uint256 indexed tokenId);
event InstitutionAuthorized(address indexed institution);
```

## 🌟 Funcionalidades Avanzadas

### Metadatos Dinámicos
- Constructor de metadatos automatizado
- Soporte completo para estándares NFT
- Integración con IPFS

### Comunicación Interchain (ICM)
- Notificaciones entre Avalanche y Arbitrum
- Sincronización de estados
- Preparado para TeleporterMessenger

### Optimizaciones
- Batch minting en Arbitrum
- Gas optimizado
- Almacenamiento eficiente

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una branch para tu feature
3. Commit tus cambios
4. Push a la branch
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- 📧 Email: soporte@certchain.com
- 💬 Discord: [CertChain Community](https://discord.gg/certchain)
- 📖 Docs: [docs.certchain.com](https://docs.certchain.com)

## 🗺️ Roadmap

- [ ] Integración con más blockchains
- [ ] Portal web completo
- [ ] API REST
- [ ] Móvil app
- [ ] Integración institucional
- [ ] Analytics dashboard

---

**CertChain** - Certificación digital del futuro 🎓⛓️hat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
