import { CertificateController, CertificateApiExamples } from "../api/certificate-controller";

/**
 * Script principal para emitir certificados desde la API
 * Este script recibe datos del estudiante desde la base de datos/API
 * y emite el certificado en la blockchain correspondiente
 */
async function main() {
  console.log("🚀 Iniciando servicio de emisión de certificados...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Ejemplo 1: Emitir certificado individual
    console.log("\n🎯 Ejemplo 1: Emisión individual de certificado");
    console.log("═══════════════════════════════════════════════");
    
    const singleRequest = CertificateApiExamples.getExampleSingleRequest();
    console.log("📨 Datos del estudiante recibidos de la API:");
    console.log(`   👨‍🎓 Estudiante: ${singleRequest.student.full_name}`);
    console.log(`   📧 Email: ${singleRequest.student.email}`);
    console.log(`   💳 Wallet: ${singleRequest.student.wallet_address}`);
    console.log(`   📚 Curso: ${singleRequest.certificate.course_name}`);
    console.log(`   🏫 Institución: ${singleRequest.institution.name}`);
    console.log(`   🌐 Red: ${singleRequest.network.toUpperCase()}`);

    const singleResult = await CertificateController.issueCertificate(singleRequest);
    
    if (singleResult.status === 200 && singleResult.data?.success) {
      console.log("\n✅ CERTIFICADO EMITIDO EXITOSAMENTE");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🆔 Token ID: ${singleResult.data.data?.token_id}`);
      console.log(`🔗 Transaction Hash: ${singleResult.data.data?.transaction_hash}`);
      console.log(`📦 Block Number: ${singleResult.data.data?.block_number}`);
      console.log(`⛽ Gas Used: ${singleResult.data.data?.gas_used}`);
      console.log(`📄 Contract: ${singleResult.data.data?.contract_address}`);
      console.log(`🌐 Metadata URL: ${singleResult.data.data?.metadata_url}`);
      console.log(`🆔 Certificate ID: ${singleResult.data.data?.certificate_id}`);
    } else {
      console.error("❌ ERROR en emisión individual:", singleResult.message);
    }

    // Ejemplo 2: Emitir certificados en lote
    console.log("\n\n🎯 Ejemplo 2: Emisión en lote de certificados");
    console.log("═══════════════════════════════════════════════");
    
    const batchRequest = CertificateApiExamples.getExampleBatchRequest();
    console.log(`📨 Lote recibido con ${batchRequest.certificates.length} certificados:`);
    
    batchRequest.certificates.forEach((cert, index) => {
      console.log(`   ${index + 1}. ${cert.student.full_name} - ${cert.certificate.course_name}`);
    });

    const batchResult = await CertificateController.batchIssueCertificates(batchRequest);
    
    if (batchResult.status === 200 && batchResult.data) {
      console.log("\n✅ LOTE DE CERTIFICADOS PROCESADO");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      const successCount = batchResult.data.filter(r => r.success).length;
      const errorCount = batchResult.data.filter(r => !r.success).length;
      
      console.log(`✅ Éxitos: ${successCount}`);
      console.log(`❌ Errores: ${errorCount}`);
      
      batchResult.data.forEach((result, index) => {
        if (result.success && result.data) {
          console.log(`   ${index + 1}. ✅ Token ID: ${result.data.token_id} - TX: ${result.data.transaction_hash}`);
        } else {
          console.log(`   ${index + 1}. ❌ Error: ${result.error}`);
        }
      });
    } else {
      console.error("❌ ERROR en emisión en lote:", batchResult.message);
    }

    // Ejemplo 3: Verificación de certificado
    console.log("\n\n🎯 Ejemplo 3: Verificación de certificado");
    console.log("═══════════════════════════════════════════════");
    
    const verifyResult = await CertificateController.verifyCertificate({
      tokenId: "0",
      network: "arbitrum"
    });
    
    if (verifyResult.status === 200) {
      console.log("✅ Certificado verificado exitosamente");
      console.log(`   Válido: ${verifyResult.data?.isValid}`);
      console.log(`   Token ID: ${verifyResult.data?.tokenId}`);
      console.log(`   Red: ${verifyResult.data?.network}`);
    } else {
      console.error("❌ ERROR en verificación:", verifyResult.message);
    }

  } catch (error: any) {
    console.error("❌ Error fatal en el servicio:", error);
    process.exit(1);
  }

  console.log("\n🏁 Servicio completado exitosamente");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

/**
 * Función para emitir un certificado individual (llamada por la API)
 */
export async function issueSingleCertificate(studentData: any) {
  console.log("🌐 API llamando a emisión de certificado individual...");
  
  // Transformar datos de la base de datos al formato requerido
  const requestData = {
    student: {
      id: studentData.student_id,
      email: studentData.student_email,
      full_name: studentData.student_name,
      wallet_address: studentData.wallet_address
    },
    certificate: {
      title: studentData.certificate_title,
      description: studentData.certificate_description,
      course_name: studentData.course_name,
      issued_at: studentData.issued_at || new Date().toISOString()
    },
    institution: {
      id: studentData.institution_id,
      name: studentData.institution_name,
      legal_id: studentData.institution_legal_id
    },
    ipfs: {
      image_hash: studentData.ipfs_image_hash,
      metadata_hash: studentData.ipfs_metadata_hash
    },
    network: studentData.blockchain_network || "arbitrum"
  };

  return await CertificateController.issueCertificate(requestData);
}

/**
 * Función para emitir certificados en lote (llamada por la API)
 */
export async function issueBatchCertificates(studentsData: any[]) {
  console.log(`🌐 API llamando a emisión en lote de ${studentsData.length} certificados...`);
  
  const certificates = studentsData.map(studentData => ({
    student: {
      id: studentData.student_id,
      email: studentData.student_email,
      full_name: studentData.student_name,
      wallet_address: studentData.wallet_address
    },
    certificate: {
      title: studentData.certificate_title,
      description: studentData.certificate_description,
      course_name: studentData.course_name,
      issued_at: studentData.issued_at || new Date().toISOString()
    },
    institution: {
      id: studentData.institution_id,
      name: studentData.institution_name,
      legal_id: studentData.institution_legal_id
    },
    ipfs: {
      image_hash: studentData.ipfs_image_hash,
      metadata_hash: studentData.ipfs_metadata_hash
    },
    network: studentData.blockchain_network || "arbitrum"
  }));

  return await CertificateController.batchIssueCertificates({ certificates });
}

// Ejecutar ejemplos si el script se ejecuta directamente
if (require.main === module) {
  main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}
