import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { MetadataBuilder } from "../scripts/utils/metadata-builder";
import { ContractUtils } from "../scripts/utils/contract-utils";
import { CertNFTArbitrum } from "../typechain-types/contracts/arbitrum/CertNFT_Arbitrum.sol/CertNFTArbitrum";
import { CertNFTAvalanche } from "../typechain-types/contracts/avalanche/CertNFT_Avalanche.sol/CertNFTAvalanche";

// Tipos de datos que recibe la API
export interface CertificateRequest {
  // Datos del estudiante (vienen de la base de datos)
  student: {
    id: string;
    email: string;
    full_name: string;
    wallet_address: string;
  };
  
  // Datos del certificado
  certificate: {
    title: string;
    description: string;
    course_name: string;
    issued_at: string;
    expiration_date?: string;
  };
  
  // Datos de la institución
  institution: {
    id: string;
    name: string;
    legal_id: string;
  };
  
  // URLs de IPFS (subidas previamente por la API)
  ipfs: {
    image_hash: string;
    metadata_hash?: string;
  };
  
  // Red donde emitir el certificado
  network: "avalanche" | "arbitrum";
}

export interface CertificateResponse {
  success: boolean;
  data?: {
    token_id: string;
    transaction_hash: string;
    block_number: number;
    gas_used: string;
    contract_address: string;
    metadata_url: string;
    certificate_id: string;
  };
  error?: string;
}

export class CertificateService {
  
  /**
   * Emite un certificado NFT basado en los datos recibidos de la API
   */
  static async issueCertificate(request: CertificateRequest): Promise<CertificateResponse> {
    try {
      console.log(`🎯 Emitiendo certificado en ${request.network.toUpperCase()}...`);
      console.log(`👨‍🎓 Estudiante: ${request.student.full_name}`);
      console.log(`📚 Curso: ${request.certificate.course_name}`);
      console.log(`🏫 Institución: ${request.institution.name}`);

      // Validar datos de entrada
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(", ")}`
        };
      }

      // Obtener el contrato según la red
      const contractInfo = await this.getContractInfo(request.network);
      
      // Conectar al contrato
      const [deployer] = await ethers.getSigners();
      const CertNFT = await ethers.getContractFactory(contractInfo.contractName);
      const certNFT = CertNFT.attach(contractInfo.address) as unknown as CertNFTArbitrum | CertNFTAvalanche;

      // Generar metadatos del certificado
      const now = new Date(request.certificate.issued_at);
      const expirationDate = request.certificate.expiration_date 
        ? new Date(request.certificate.expiration_date)
        : ContractUtils.generateDefaultExpirationDate();

      const certificateId = MetadataBuilder.generateCertificateId(
        request.student.full_name,
        request.certificate.course_name,
        request.institution.name,
        now.getTime()
      );

      const metadata = MetadataBuilder.buildCertificateMetadata(
        request.student.full_name,
        request.certificate.course_name,
        request.institution.name,
        now,
        expirationDate,
        `https://ipfs.io/ipfs/${request.ipfs.image_hash}`,
        certificateId,
        request.network === "avalanche" ? "Avalanche" : "Arbitrum"
      );

      // Verificar autorización
      await this.ensureAuthorization(certNFT, deployer);

      // Preparar parámetros para el mint
      const tokenURI = `https://ipfs.io/ipfs/${request.ipfs.metadata_hash || request.ipfs.image_hash}`;
      const expirationTimestamp = ContractUtils.dateToTimestamp(expirationDate);

      console.log("🔍 DEBUG - Parámetros del mint:");
      console.log(`   recipient: ${request.student.wallet_address}`);
      console.log(`   studentName: ${request.student.full_name}`);
      console.log(`   courseName: ${request.certificate.course_name}`);
      console.log(`   institutionName: ${request.institution.name}`);
      console.log(`   tokenURI: ${tokenURI}`);
      console.log(`   ipfsHash: ${request.ipfs.image_hash}`);
      console.log(`   expirationDate: ${expirationDate.toISOString()}`);
      console.log(`   expirationTimestamp: ${expirationTimestamp}`);
      console.log(`   currentTimestamp: ${Math.floor(Date.now() / 1000)}`);

      console.log("⛽ Estimando gas...");
      
      // Estimar gas
      const gasEstimate = await certNFT.issueCertificate.estimateGas(
        request.student.wallet_address,
        request.student.full_name,
        request.certificate.course_name,
        request.institution.name,
        tokenURI,
        request.ipfs.image_hash,
        expirationTimestamp
      );

      console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);

      // Ejecutar la transacción
      const tx = await certNFT.issueCertificate(
        request.student.wallet_address,
        request.student.full_name,
        request.certificate.course_name,
        request.institution.name,
        tokenURI,
        request.ipfs.image_hash,
        expirationTimestamp,
        { gasLimit: gasEstimate * 120n / 100n }
      );

      console.log(`📝 Hash de transacción: ${tx.hash}`);
      console.log("⏳ Esperando confirmación...");

      const receipt = await tx.wait();
      console.log("✅ Transacción confirmada!");

      // Extraer el token ID del evento
      const tokenId = this.extractTokenIdFromReceipt(receipt, certNFT);

      // Preparar respuesta
      const response: CertificateResponse = {
        success: true,
        data: {
          token_id: tokenId || "unknown",
          transaction_hash: receipt?.hash || "",
          block_number: receipt?.blockNumber || 0,
          gas_used: receipt?.gasUsed?.toString() || "0",
          contract_address: contractInfo.address,
          metadata_url: tokenURI,
          certificate_id: certificateId
        }
      };

      // Guardar información del mint para auditoría
      await this.saveMintData(request, response.data!, metadata, request.network);

      console.log("🎉 Certificado emitido exitosamente!");
      console.log(`🆔 Token ID: ${tokenId}`);
      console.log(`🔗 Transacción: ${receipt?.hash}`);

      return response;

    } catch (error: any) {
      console.error("❌ Error emitiendo certificado:", error);
      
      return {
        success: false,
        error: error.reason || error.message || "Error desconocido"
      };
    }
  }

  /**
   * Emite múltiples certificados en una sola transacción (batch)
   */
  static async batchIssueCertificates(requests: CertificateRequest[]): Promise<CertificateResponse[]> {
    if (requests.length === 0) {
      return [];
    }

    // Validar que todos los certificados sean de la misma red
    const network = requests[0].network;
    if (!requests.every(req => req.network === network)) {
      return requests.map(() => ({
        success: false,
        error: "Todos los certificados deben ser de la misma red"
      }));
    }

    try {
      console.log(`🎯 Emitiendo ${requests.length} certificados en lote en ${network.toUpperCase()}...`);

      // Obtener el contrato
      const contractInfo = await this.getContractInfo(network);
      const [deployer] = await ethers.getSigners();
      const CertNFT = await ethers.getContractFactory(contractInfo.contractName);
      const certNFT = CertNFT.attach(contractInfo.address) as unknown as CertNFTArbitrum | CertNFTAvalanche;

      // Verificar autorización
      await this.ensureAuthorization(certNFT, deployer);

      // Preparar arrays para batch minting
      const recipients: string[] = [];
      const studentNames: string[] = [];
      const courseNames: string[] = [];
      const institutionNames: string[] = [];
      const tokenURIs: string[] = [];
      const ipfsHashes: string[] = [];
      const expirationDates: number[] = [];

      // Procesar cada solicitud
      for (const request of requests) {
        const expirationDate = request.certificate.expiration_date 
          ? new Date(request.certificate.expiration_date)
          : ContractUtils.generateDefaultExpirationDate();

        recipients.push(request.student.wallet_address);
        studentNames.push(request.student.full_name);
        courseNames.push(request.certificate.course_name);
        institutionNames.push(request.institution.name);
        tokenURIs.push(`https://ipfs.io/ipfs/${request.ipfs.metadata_hash || request.ipfs.image_hash}`);
        ipfsHashes.push(request.ipfs.image_hash);
        expirationDates.push(ContractUtils.dateToTimestamp(expirationDate));
      }

      // Ejecutar batch minting
      const batchTx = await certNFT.batchIssueCertificates(
        recipients,
        studentNames,
        courseNames,
        institutionNames[0], // Asumiendo misma institución para el batch
        tokenURIs,
        ipfsHashes,
        expirationDates
      );

      const batchReceipt = await batchTx.wait();
      console.log("✅ Lote de certificados emitido!");
      console.log(`🔗 Transacción: ${batchReceipt?.hash}`);

      // Preparar respuestas individuales
      const responses: CertificateResponse[] = requests.map((request, index) => {
        const certificateId = MetadataBuilder.generateCertificateId(
          request.student.full_name,
          request.certificate.course_name,
          request.institution.name,
          new Date().getTime()
        );

        return {
          success: true,
          data: {
            token_id: `batch_${index}`, // En batch, los IDs se asignan secuencialmente
            transaction_hash: batchReceipt?.hash || "",
            block_number: batchReceipt?.blockNumber || 0,
            gas_used: (Number(batchReceipt?.gasUsed?.toString() || "0") / requests.length).toString(),
            contract_address: contractInfo.address,
            metadata_url: tokenURIs[index],
            certificate_id: certificateId
          }
        };
      });

      return responses;

    } catch (error: any) {
      console.error("❌ Error en batch minting:", error);
      
      return requests.map(() => ({
        success: false,
        error: error.reason || error.message || "Error en batch minting"
      }));
    }
  }

  /**
   * Valida los datos de la solicitud
   */
  private static validateRequest(request: CertificateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar estudiante
    if (!request.student.wallet_address || !ethers.isAddress(request.student.wallet_address)) {
      errors.push("Dirección de wallet del estudiante inválida");
    }
    if (!request.student.full_name?.trim()) {
      errors.push("Nombre completo del estudiante requerido");
    }

    // Validar certificado
    if (!request.certificate.course_name?.trim()) {
      errors.push("Nombre del curso requerido");
    }

    // Validar institución
    if (!request.institution.name?.trim()) {
      errors.push("Nombre de la institución requerido");
    }

    // Validar IPFS
    if (!request.ipfs.image_hash?.trim()) {
      errors.push("Hash de imagen IPFS requerido");
    }

    // Validar red
    if (!["avalanche", "arbitrum"].includes(request.network)) {
      errors.push("Red no soportada");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtiene información del contrato según la red
   */
  private static async getContractInfo(network: string): Promise<{ address: string; contractName: string }> {
    const deploymentFolder = network === "avalanche" ? "avalanche" : "arbitrum";
    const deploymentPath = path.join(__dirname, `../deployments/${deploymentFolder}`);
    const fileName = network === "avalanche" ? "CertNFTAvalanche.json" : "CertNFTArbitrum.json";
    const contractName = network === "avalanche" ? "CertNFTAvalanche" : "CertNFTArbitrum";
    
    const deploymentFile = path.join(deploymentPath, fileName);
    
    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`Contrato no deployado en ${network}. Archivo no encontrado: ${deploymentFile}`);
    }

    const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    
    return {
      address: deploymentData.contractAddress,
      contractName
    };
  }

  /**
   * Asegura que la cuenta actual esté autorizada para mintear
   */
  private static async ensureAuthorization(certNFT: any, deployer: any): Promise<void> {
    try {
      // Intentar obtener el owner primero
      let owner: string;
      try {
        owner = await certNFT.owner();
      } catch (error: any) {
        console.log("❌ Error obteniendo owner:", error.message);
        throw new Error("No se puede verificar el owner del contrato");
      }

      // Si es el owner, puede mintear sin autorización adicional
      if (deployer.address.toLowerCase() === owner.toLowerCase()) {
        console.log("✅ Cuenta es owner del contrato, puede mintear");
        
        // Intentar autorizar como institución para futuros usos
        try {
          const isAuthorized = await certNFT.authorizedInstitutions(deployer.address);
          if (!isAuthorized) {
            console.log("🔑 Autorizando owner como institución para consistencia...");
            const authTx = await certNFT.authorizeInstitution(deployer.address);
            await authTx.wait();
            console.log("✅ Owner autorizado como institución");
          }
        } catch (authError: any) {
          console.log("⚠️ Error autorizando owner como institución (no crítico):", authError.message);
        }
        return;
      }
      
      // Si no es owner, verificar autorización
      let isAuthorized = false;
      try {
        isAuthorized = await certNFT.authorizedInstitutions(deployer.address);
      } catch (error: any) {
        console.log("❌ Error verificando autorización:", error.message);
        throw new Error("No se puede verificar la autorización de la cuenta");
      }

      if (isAuthorized) {
        console.log("✅ Cuenta está autorizada como institución");
        return;
      }
      
      // No es owner y no está autorizado
      throw new Error(`Cuenta ${deployer.address} no está autorizada para mintear. Owner: ${owner}`);
      
    } catch (error: any) {
      console.log("❌ Error en autorización:", error.message);
      throw error;
    }
  }

  /**
   * Extrae el token ID del receipt de la transacción
   */
  private static extractTokenIdFromReceipt(receipt: any, certNFT: any): string | null {
    const events = receipt?.logs || [];
    
    for (const log of events) {
      try {
        const parsedLog = certNFT.interface.parseLog(log);
        if (parsedLog?.name === "CertificateIssued") {
          return parsedLog.args.tokenId.toString();
        }
      } catch (e) {
        // Ignorar logs que no podemos parsear
      }
    }
    
    return null;
  }

  /**
   * Guarda los datos del mint para auditoría
   */
  private static async saveMintData(
    request: CertificateRequest, 
    responseData: any, 
    metadata: any, 
    network: string
  ): Promise<void> {
    const mintData = {
      // Datos de la solicitud original
      request: {
        student: request.student,
        certificate: request.certificate,
        institution: request.institution,
        ipfs: request.ipfs
      },
      
      // Datos del mint
      mint: {
        token_id: responseData.token_id,
        transaction_hash: responseData.transaction_hash,
        block_number: responseData.block_number,
        gas_used: responseData.gas_used,
        contract_address: responseData.contract_address,
        metadata_url: responseData.metadata_url,
        certificate_id: responseData.certificate_id
      },
      
      // Metadatos generados
      metadata: metadata,
      
      // Info adicional
      network: network,
      timestamp: new Date().toISOString(),
      api_version: "1.0.0"
    };

    const mintPath = `./deployments/${network}`;
    const mintFile = `${mintPath}/api-mint-${responseData.token_id || Date.now()}.json`;
    
    if (!fs.existsSync(mintPath)) {
      fs.mkdirSync(mintPath, { recursive: true });
    }
    
    fs.writeFileSync(mintFile, JSON.stringify(mintData, null, 2));
    console.log(`📄 Datos del mint guardados en: ${mintFile}`);
  }
}
