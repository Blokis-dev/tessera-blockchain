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

// Emitir certificado individual
app.post('/api/certificate/mint', async (req, res) => {
  try {
    console.log('🌐 API: Recibiendo solicitud de emisión de certificado...');
    console.log('📄 Request body:', JSON.stringify(req.body, null, 2));
    
    // Simulación de respuesta exitosa
    res.status(200).json({
      status: 200,
      success: true,
      message: 'Certificado emitido exitosamente (simulado)',
      data: {
        token_id: Math.floor(Math.random() * 1000).toString(),
        transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        block_number: Math.floor(Math.random() * 1000000),
        gas_used: '295422',
        contract_address: req.body.network === 'avalanche' 
          ? '0x2017ee0C335A0f799562006B3d5DD00F345a5033'
          : '0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B',
        metadata_url: 'https://ipfs.io/ipfs/QmExample',
        certificate_id: Math.random().toString(16).substr(2, 16)
      }
    });
    
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
    
    const certificates = req.body.certificates || [];
    const results = certificates.map((cert, index) => ({
      success: true,
      data: {
        token_id: (index + 1000).toString(),
        transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        block_number: Math.floor(Math.random() * 1000000),
        gas_used: '295422'
      }
    }));
    
    res.status(200).json({
      status: 200,
      success: true,
      message: 'Lote procesado exitosamente (simulado)',
      data: results
    });
    
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
app.get('/api/certificate/verify', async (req, res) => {
  try {
    const { tokenId, network } = req.query;
    console.log(`🌐 API: Verificando certificado ${tokenId} en ${network}...`);
    
    res.json({
      status: 200,
      success: true,
      message: 'Verificación simulada',
      data: {
        tokenId: tokenId,
        network: network,
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
      'GET  /api/certificate/verify?tokenId=X&network=Y'
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
  console.log('   GET  /api/certificate/verify        - Verificar certificado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('💡 Este es un servidor de demostración.');
    console.log('💡 Para funcionalidad blockchain real, integrar con hardhat.');
  }
});

module.exports = app;
