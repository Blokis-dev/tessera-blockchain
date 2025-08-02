export interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  certificate_data: {
    student_name: string;
    course_name: string;
    institution_name: string;
    issue_date: string;
    expiration_date: string;
    certificate_id: string;
    blockchain: string;
  };
}

export class MetadataBuilder {
  /**
   * Construye metadatos NFT para un certificado
   */
  static buildCertificateMetadata(
    studentName: string,
    courseName: string,
    institutionName: string,
    issueDate: Date,
    expirationDate: Date,
    imageUrl: string,
    certificateId: string,
    blockchain: string = "Avalanche"
  ): CertificateMetadata {
    const metadata: CertificateMetadata = {
      name: `${courseName} - ${studentName}`,
      description: `Certificado digital de ${courseName} otorgado por ${institutionName} a ${studentName}. Este certificado está verificado en blockchain y es inmutable.`,
      image: imageUrl,
      external_url: `https://certchain.com/verify/${certificateId}`,
      attributes: [
        {
          trait_type: "Student Name",
          value: studentName
        },
        {
          trait_type: "Course",
          value: courseName
        },
        {
          trait_type: "Institution",
          value: institutionName
        },
        {
          trait_type: "Issue Date",
          value: issueDate.toISOString().split('T')[0]
        },
        {
          trait_type: "Expiration Date",
          value: expirationDate.toISOString().split('T')[0]
        },
        {
          trait_type: "Blockchain",
          value: blockchain
        },
        {
          trait_type: "Certificate Type",
          value: "Digital Certificate"
        },
        {
          trait_type: "Valid",
          value: "Yes"
        }
      ],
      certificate_data: {
        student_name: studentName,
        course_name: courseName,
        institution_name: institutionName,
        issue_date: issueDate.toISOString(),
        expiration_date: expirationDate.toISOString(),
        certificate_id: certificateId,
        blockchain: blockchain
      }
    };

    return metadata;
  }

  /**
   * Valida que los metadatos sean correctos
   */
  static validateMetadata(metadata: CertificateMetadata): boolean {
    try {
      // Validaciones básicas
      if (!metadata.name || metadata.name.trim() === "") return false;
      if (!metadata.description || metadata.description.trim() === "") return false;
      if (!metadata.image || metadata.image.trim() === "") return false;
      if (!Array.isArray(metadata.attributes)) return false;
      if (!metadata.certificate_data) return false;

      // Validar certificate_data
      const certData = metadata.certificate_data;
      if (!certData.student_name || certData.student_name.trim() === "") return false;
      if (!certData.course_name || certData.course_name.trim() === "") return false;
      if (!certData.institution_name || certData.institution_name.trim() === "") return false;
      if (!certData.issue_date || !certData.expiration_date) return false;
      if (!certData.certificate_id || certData.certificate_id.trim() === "") return false;

      // Validar fechas
      const issueDate = new Date(certData.issue_date);
      const expirationDate = new Date(certData.expiration_date);
      if (isNaN(issueDate.getTime()) || isNaN(expirationDate.getTime())) return false;
      if (expirationDate <= issueDate) return false;

      return true;
    } catch (error) {
      console.error("Error validating metadata:", error);
      return false;
    }
  }

  /**
   * Convierte los metadatos a JSON string
   */
  static toJSONString(metadata: CertificateMetadata): string {
    return JSON.stringify(metadata, null, 2);
  }

  /**
   * Genera un ID único para el certificado
   */
  static generateCertificateId(
    studentName: string,
    courseName: string,
    institutionName: string,
    timestamp: number
  ): string {
    const crypto = require('crypto');
    const data = `${studentName}-${courseName}-${institutionName}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Crea metadatos de ejemplo para testing
   */
  static createSampleMetadata(): CertificateMetadata {
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setFullYear(now.getFullYear() + 5); // 5 años de validez

    return this.buildCertificateMetadata(
      "Juan Pérez García",
      "Desarrollo de Smart Contracts con Solidity",
      "Universidad Blockchain Tech",
      now,
      expirationDate,
      "https://ipfs.io/ipfs/QmSampleImageHash",
      this.generateCertificateId("Juan Pérez García", "Desarrollo de Smart Contracts con Solidity", "Universidad Blockchain Tech", now.getTime()),
      "Avalanche"
    );
  }
}

/**
 * Utilidades para trabajar con IPFS
 */
export class IPFSUtils {
  /**
   * Convierte un hash IPFS a URL HTTP
   */
  static hashToHttpUrl(ipfsHash: string, gateway: string = "https://ipfs.io/ipfs/"): string {
    // Remover prefijo ipfs:// si existe
    const cleanHash = ipfsHash.replace(/^ipfs:\/\//, '');
    return `${gateway}${cleanHash}`;
  }

  /**
   * Convierte una URL HTTP de IPFS a hash
   */
  static httpUrlToHash(url: string): string {
    // Extraer el hash de la URL
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : url;
  }

  /**
   * Valida que un hash IPFS sea válido
   */
  static isValidIPFSHash(hash: string): boolean {
    // Básico: verificar longitud y caracteres válidos
    const cleanHash = hash.replace(/^ipfs:\/\//, '');
    return /^[a-zA-Z0-9]{46,59}$/.test(cleanHash);
  }
}

/**
 * Utilidades para trabajar con direcciones y fechas
 */
export class ContractUtils {
  /**
   * Convierte una fecha a timestamp Unix
   */
  static dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Convierte un timestamp Unix a fecha
   */
  static timestampToDate(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * Valida que una dirección Ethereum sea válida
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Formatea una dirección para mostrar (0x1234...5678)
   */
  static formatAddress(address: string, prefixLength: number = 6, suffixLength: number = 4): string {
    if (!this.isValidAddress(address)) return address;
    return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
  }

  /**
   * Genera una fecha de expiración por defecto (5 años)
   */
  static generateDefaultExpirationDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return date;
  }
}
