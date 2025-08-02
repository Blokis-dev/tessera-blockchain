#!/usr/bin/env node
/**
 * Script de prueba para demostrar la integración API-Blockchain
 * Este script simula cómo la API enviaría datos a la blockchain
 */

import { CertificateController, CertificateApiExamples } from "../api/certificate-controller";

async function runDemo() {
  console.log("🎯 DEMO: Integración API-Blockchain Tessera");
  console.log("════════════════════════════════════════════════════════════════");
  console.log("Este demo simula cómo tu API envía datos del estudiante");
  console.log("desde la base de datos Supabase hacia la blockchain");
  console.log("");

  try {
    // 1. Mostrar datos que vienen de la API
    console.log("📨 1. DATOS RECIBIDOS DE LA API");
    console.log("───────────────────────────────────────────────────────");
    
    const apiData = CertificateApiExamples.getExampleSingleRequest();
    console.log("👨‍🎓 Estudiante:", apiData.student.full_name);
    console.log("📧 Email:", apiData.student.email);
    console.log("💳 Wallet:", apiData.student.wallet_address);
    console.log("📚 Curso:", apiData.certificate.course_name);
    console.log("🏫 Institución:", apiData.institution.name);
    console.log("🆔 ID Legal:", apiData.institution.legal_id);
    console.log("🖼️ IPFS Hash:", apiData.ipfs.image_hash);
    console.log("🌐 Red:", apiData.network.toUpperCase());
    console.log("");

    // 2. Procesar en blockchain
    console.log("⚡ 2. PROCESANDO EN BLOCKCHAIN");
    console.log("───────────────────────────────────────────────────────");
    console.log("🔄 Validando datos...");
    console.log("🔄 Conectando al contrato...");
    console.log("🔄 Generando metadatos NFT...");
    console.log("🔄 Estimando gas...");
    console.log("🔄 Ejecutando transacción...");
    console.log("");

    // 3. Simular respuesta exitosa
    console.log("✅ 3. CERTIFICADO EMITIDO EXITOSAMENTE");
    console.log("───────────────────────────────────────────────────────");
    
    const mockResponse = {
      success: true,
      data: {
        token_id: "12345",
        transaction_hash: "0x1234567890abcdef1234567890abcdef12345678",
        block_number: 9876543,
        gas_used: "145280",
        contract_address: "0xCertificateContract123456789abcdef",
        metadata_url: "https://ipfs.io/ipfs/QmArbitrumMetadataHash",
        certificate_id: "cert_abc123def456"
      }
    };

    console.log("🆔 Token ID:", mockResponse.data.token_id);
    console.log("🔗 TX Hash:", mockResponse.data.transaction_hash);
    console.log("📦 Block:", mockResponse.data.block_number.toLocaleString());
    console.log("⛽ Gas Usado:", mockResponse.data.gas_used);
    console.log("📄 Contrato:", mockResponse.data.contract_address);
    console.log("🌐 Metadata URL:", mockResponse.data.metadata_url);
    console.log("🆔 Cert ID:", mockResponse.data.certificate_id);
    console.log("");

    // 4. Datos que se guardan en la base de datos
    console.log("💾 4. DATOS PARA GUARDAR EN SUPABASE");
    console.log("───────────────────────────────────────────────────────");
    
    const dbUpdate = {
      certificate_id: apiData.certificate.title.replace(/\s+/g, '_').toLowerCase(),
      student_id: apiData.student.id,
      institution_id: apiData.institution.id,
      blockchain_tx: mockResponse.data.transaction_hash,
      token_id: parseInt(mockResponse.data.token_id),
      nft_metadata_url: mockResponse.data.metadata_url,
      status: "emitido",
      issued_at: new Date().toISOString()
    };

    console.log("📊 Actualización para tabla 'certificates':");
    console.log(JSON.stringify(dbUpdate, null, 2));
    console.log("");

    // 5. Flujo completo
    console.log("🔄 5. FLUJO COMPLETO RESUMIDO");
    console.log("───────────────────────────────────────────────────────");
    console.log("1. 📨 Frontend envía datos del estudiante a la API");
    console.log("2. 🔍 API valida datos y consulta base de datos");
    console.log("3. 📤 API llama a: issueSingleCertificate(studentData)");
    console.log("4. ⚡ Blockchain procesa y emite NFT");
    console.log("5. ✅ Blockchain devuelve: token_id, tx_hash, etc.");
    console.log("6. 💾 API actualiza base de datos con datos blockchain");
    console.log("7. 📱 Frontend muestra certificado emitido");
    console.log("");

    console.log("🎉 DEMO COMPLETADO EXITOSAMENTE");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("");
    console.log("📖 Para implementar en tu proyecto:");
    console.log("   1. Importa: import { issueSingleCertificate } from '...'");
    console.log("   2. Prepara datos del estudiante desde tu DB");
    console.log("   3. Llama: await issueSingleCertificate(studentData)");
    console.log("   4. Guarda el resultado en tu base de datos");
    console.log("");
    console.log("🔗 Ver API-INTEGRATION.md para más detalles");

  } catch (error) {
    console.error("❌ Error en el demo:", error);
  }
}

// Ejecutar demo
if (require.main === module) {
  runDemo();
}
