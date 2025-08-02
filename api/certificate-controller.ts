import { CertificateService, CertificateRequest, CertificateResponse } from "./certificate-service";

/**
 * Controlador de la API para manejo de certificados
 * Este archivo simula endpoints REST que recibirían las llamadas del frontend
 */
export class CertificateController {

  /**
   * Endpoint: POST /api/certificates/issue
   * Emite un certificado individual
   */
  static async issueCertificate(requestBody: any): Promise<{
    status: number;
    data?: CertificateResponse;
    message?: string;
  }> {
    try {
      console.log("🌐 API: Recibiendo solicitud de emisión de certificado...");
      console.log("📄 Datos recibidos:", JSON.stringify(requestBody, null, 2));

      // Validar que los datos requeridos estén presentes
      const validation = this.validateApiRequest(requestBody);
      if (!validation.isValid) {
        return {
          status: 400,
          message: `Datos inválidos: ${validation.errors.join(", ")}`
        };
      }

      // Transformar datos de la API al formato del servicio
      const certificateRequest = this.transformApiRequestToCertificateRequest(requestBody);

      // Emitir el certificado
      const result = await CertificateService.issueCertificate(certificateRequest);

      if (result.success) {
        console.log("✅ API: Certificado emitido exitosamente");
        return {
          status: 200,
          data: result
        };
      } else {
        console.error("❌ API: Error emitiendo certificado:", result.error);
        return {
          status: 500,
          message: result.error || "Error interno del servidor"
        };
      }

    } catch (error: any) {
      console.error("❌ API: Error inesperado:", error);
      return {
        status: 500,
        message: error.message || "Error interno del servidor"
      };
    }
  }

  /**
   * Endpoint: POST /api/certificates/batch-issue
   * Emite múltiples certificados en lote
   */
  static async batchIssueCertificates(requestBody: any): Promise<{
    status: number;
    data?: CertificateResponse[];
    message?: string;
  }> {
    try {
      console.log("🌐 API: Recibiendo solicitud de emisión en lote...");
      console.log(`📄 Cantidad de certificados: ${requestBody.certificates?.length || 0}`);

      if (!Array.isArray(requestBody.certificates) || requestBody.certificates.length === 0) {
        return {
          status: 400,
          message: "Se requiere un array de certificados no vacío"
        };
      }

      // Validar cada certificado
      const certificateRequests: CertificateRequest[] = [];
      for (let i = 0; i < requestBody.certificates.length; i++) {
        const certData = requestBody.certificates[i];
        const validation = this.validateApiRequest(certData);
        
        if (!validation.isValid) {
          return {
            status: 400,
            message: `Certificado ${i + 1} inválido: ${validation.errors.join(", ")}`
          };
        }

        certificateRequests.push(this.transformApiRequestToCertificateRequest(certData));
      }

      // Emitir certificados en lote
      const results = await CertificateService.batchIssueCertificates(certificateRequests);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`✅ API: Lote completado. Éxitos: ${successCount}, Fallos: ${failureCount}`);

      return {
        status: 200,
        data: results
      };

    } catch (error: any) {
      console.error("❌ API: Error inesperado en lote:", error);
      return {
        status: 500,
        message: error.message || "Error interno del servidor"
      };
    }
  }

  /**
   * Endpoint: GET /api/certificates/verify/:tokenId
   * Verifica un certificado por su token ID
   */
  static async verifyCertificate(params: { 
    tokenId: string; 
    network: string; 
  }): Promise<{
    status: number;
    data?: any;
    message?: string;
  }> {
    try {
      console.log(`🌐 API: Verificando certificado ${params.tokenId} en ${params.network}...`);

      // Aquí iría la lógica de verificación usando el contrato
      // Por ahora retornamos un ejemplo de respuesta

      return {
        status: 200,
        data: {
          isValid: true,
          tokenId: params.tokenId,
          network: params.network,
          verified: true
        }
      };

    } catch (error: any) {
      console.error("❌ API: Error verificando certificado:", error);
      return {
        status: 500,
        message: error.message || "Error interno del servidor"
      };
    }
  }

  /**
   * Valida los datos recibidos de la API
   */
  private static validateApiRequest(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar estructura del estudiante
    if (!data.student) {
      errors.push("Datos del estudiante requeridos");
    } else {
      if (!data.student.id?.trim()) errors.push("ID del estudiante requerido");
      if (!data.student.email?.trim()) errors.push("Email del estudiante requerido");
      if (!data.student.full_name?.trim()) errors.push("Nombre completo del estudiante requerido");
      if (!data.student.wallet_address?.trim()) errors.push("Dirección de wallet del estudiante requerida");
    }

    // Validar estructura del certificado
    if (!data.certificate) {
      errors.push("Datos del certificado requeridos");
    } else {
      if (!data.certificate.title?.trim()) errors.push("Título del certificado requerido");
      if (!data.certificate.course_name?.trim()) errors.push("Nombre del curso requerido");
      if (!data.certificate.issued_at?.trim()) errors.push("Fecha de emisión requerida");
    }

    // Validar estructura de la institución
    if (!data.institution) {
      errors.push("Datos de la institución requeridos");
    } else {
      if (!data.institution.id?.trim()) errors.push("ID de la institución requerido");
      if (!data.institution.name?.trim()) errors.push("Nombre de la institución requerido");
      if (!data.institution.legal_id?.trim()) errors.push("ID legal de la institución requerido");
    }

    // Validar IPFS
    if (!data.ipfs) {
      errors.push("Datos IPFS requeridos");
    } else {
      if (!data.ipfs.image_hash?.trim()) errors.push("Hash de imagen IPFS requerido");
    }

    // Validar red
    if (!data.network || !["avalanche", "arbitrum"].includes(data.network)) {
      errors.push("Red debe ser 'avalanche' o 'arbitrum'");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transforma los datos de la API al formato interno
   */
  private static transformApiRequestToCertificateRequest(data: any): CertificateRequest {
    return {
      student: {
        id: data.student.id,
        email: data.student.email,
        full_name: data.student.full_name,
        wallet_address: data.student.wallet_address
      },
      certificate: {
        title: data.certificate.title,
        description: data.certificate.description || "",
        course_name: data.certificate.course_name,
        issued_at: data.certificate.issued_at,
        expiration_date: data.certificate.expiration_date
      },
      institution: {
        id: data.institution.id,
        name: data.institution.name,
        legal_id: data.institution.legal_id
      },
      ipfs: {
        image_hash: data.ipfs.image_hash,
        metadata_hash: data.ipfs.metadata_hash
      },
      network: data.network
    };
  }
}

/**
 * Ejemplos de uso de la API
 */
export class CertificateApiExamples {
  
  /**
   * Ejemplo de solicitud individual
   */
  static getExampleSingleRequest() {
    return {
      student: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "juan.perez@email.com",
        full_name: "Juan Pérez González",
        wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
      },
      certificate: {
        title: "Certificado de Finalización - DeFi Protocols",
        description: "Certificado que acredita la finalización exitosa del curso DeFi Protocols",
        course_name: "DeFi Protocols en Arbitrum",
        issued_at: "2025-08-02T00:00:00Z",
        expiration_date: "2030-08-02T00:00:00Z"
      },
      institution: {
        id: "660f9500-f3ac-52e5-b827-557766551111",
        name: "Academia Crypto Finance",
        legal_id: "RUC-20123456789"
      },
      ipfs: {
        image_hash: "QmArbitrumCertificateImageHash",
        metadata_hash: "QmArbitrumMetadataHash"
      },
      network: "arbitrum"
    };
  }

  /**
   * Ejemplo de solicitud en lote
   */
  static getExampleBatchRequest() {
    return {
      certificates: [
        {
          student: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "ana.martin@email.com",
            full_name: "Ana Martín González",
            wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
          },
          certificate: {
            title: "Certificado de Finalización - Smart Contracts Avanzados",
            description: "Certificado que acredita la finalización exitosa del curso",
            course_name: "Smart Contracts Avanzados",
            issued_at: "2025-08-02T00:00:00Z"
          },
          institution: {
            id: "660f9500-f3ac-52e5-b827-557766551111",
            name: "Academia Crypto Finance",
            legal_id: "RUC-20123456789"
          },
          ipfs: {
            image_hash: "QmBatchCert1"
          },
          network: "arbitrum"
        },
        {
          student: {
            id: "550e8400-e29b-41d4-a716-446655440002",
            email: "luis.fernandez@email.com",
            full_name: "Luis Fernández Ruiz",
            wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
          },
          certificate: {
            title: "Certificado de Finalización - Smart Contracts Avanzados",
            description: "Certificado que acredita la finalización exitosa del curso",
            course_name: "Smart Contracts Avanzados",
            issued_at: "2025-08-02T00:00:00Z"
          },
          institution: {
            id: "660f9500-f3ac-52e5-b827-557766551111",
            name: "Academia Crypto Finance",
            legal_id: "RUC-20123456789"
          },
          ipfs: {
            image_hash: "QmBatchCert2"
          },
          network: "arbitrum"
        }
      ]
    };
  }
}
