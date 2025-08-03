#!/usr/bin/env node
/**
 * 🚀 Tessera Blockchain API Server
 * Servidor Express para exponer las funcionalidades blockchain como API REST
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'tessera-blockchain-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    contracts: {
      arbitrum: '0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B',
      avalanche: '0x2017ee0C335A0f799562006B3d5DD00F345a5033'
    }
  });
});

// Endpoint de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Tessera Blockchain API',
    version: '1.0.0',
    endpoints: [
      'GET  /health - Health check',
      'POST /api/certificate/mint - Emitir certificado individual',
      'POST /api/certificate/batch - Emitir certificados en lote',
      'GET  /api/certificate/verify/:tokenId/:network - Verificar certificado'
    ],
    documentation: 'Ver README.md para más información'
  });
});

// Importar dinámicamente las funciones blockchain
async function loadCertificateController() {
  try {
    // Estas funciones están disponibles cuando se ejecuta en el contexto de Hardhat
    const { issueSingleCertificate, issueBatchCertificates } = await import('./scripts/api-certificate-mint.js');
    return { issueSingleCertificate, issueBatchCertificates };
  } catch (error) {
    console.warn('⚠️ Funciones blockchain no disponibles en modo standalone');
    return null;
  }
}

// Emitir certificado individual
app.post('/api/certificate/mint', async (req, res) => {
  try {
    console.log('🌐 API: Recibiendo solicitud de emisión de certificado...');
    
    const controller = await loadCertificateController();
    if (!controller) {
      return res.status(503).json({
        status: 503,
        success: false,
        message: 'Servicio blockchain no disponible. Ejecutar con Hardhat.',
        hint: 'Use: npx hardhat run server.js --network arbitrumSepolia'
      });
    }
    
    const result = await controller.issueSingleCertificate(req.body);
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error en /api/certificate/mint:', error);
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Emitir certificados en lote
app.post('/api/certificate/batch', async (req, res) => {
  try {
    console.log('🌐 API: Recibiendo solicitud de emisión en lote...');
    
    const controller = await loadCertificateController();
    if (!controller) {
      return res.status(503).json({
        status: 503,
        success: false,
        message: 'Servicio blockchain no disponible. Ejecutar con Hardhat.'
      });
    }
    
    const result = await controller.issueBatchCertificates(req.body.certificates);
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error en /api/certificate/batch:', error);
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Verificar certificado
app.get('/api/certificate/verify/:tokenId/:network', async (req, res) => {
  try {
    console.log(`🌐 API: Verificando certificado ${req.params.tokenId} en ${req.params.network}...`);
    
    // Simulación de verificación (implementar con web3 provider)
    res.json({
      status: 200,
      success: true,
      message: 'Verificación simulada',
      data: {
        tokenId: req.params.tokenId,
        network: req.params.network,
        isValid: true,
        note: 'Implementar verificación real en producción'
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/certificate/verify:', error);
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener datos de certificado
app.get('/api/certificate/data/:tokenId/:network', async (req, res) => {
  try {
    console.log(`🌐 API: Obteniendo datos del certificado ${req.params.tokenId}...`);
    
    res.json({
      status: 200,
      success: true,
      message: 'Datos del certificado',
      data: {
        tokenId: req.params.tokenId,
        network: req.params.network,
        note: 'Implementar lectura de datos en producción'
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/certificate/data:', error);
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: 'Endpoint no encontrado',
    availableEndpoints: [
      'GET  / - Información general',
      'GET  /health - Health check',
      'POST /api/certificate/mint',
      'POST /api/certificate/batch',
      'GET  /api/certificate/verify/:tokenId/:network',
      'GET  /api/certificate/data/:tokenId/:network'
    ]
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  res.status(500).json({
    status: 500,
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Tessera Blockchain API Server iniciado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Servidor corriendo en puerto: ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 API Base URL: http://localhost:${PORT}/api`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('📋 Endpoints disponibles:');
  console.log('   GET  /                              - Información general');
  console.log('   GET  /health                        - Health check');
  console.log('   POST /api/certificate/mint          - Emitir certificado individual');
  console.log('   POST /api/certificate/batch         - Emitir certificados en lote');
  console.log('   GET  /api/certificate/verify/:id/:network - Verificar certificado');
  console.log('   GET  /api/certificate/data/:id/:network   - Obtener datos certificado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('💡 Para funcionalidad completa, ejecutar con:');
    console.log('   npx hardhat run server.js --network arbitrumSepolia');
  }
});

module.exports = app;
