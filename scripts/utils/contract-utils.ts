/**
 * Utilidades para trabajar con contratos y timestamps
 */
export class ContractUtils {
  
  /**
   * Convierte una fecha a timestamp para el contrato
   */
  static dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Convierte un timestamp a fecha
   */
  static timestampToDate(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * Genera una fecha de expiración por defecto (5 años desde ahora)
   */
  static generateDefaultExpirationDate(): Date {
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setFullYear(now.getFullYear() + 5);
    return expirationDate;
  }

  /**
   * Valida si una fecha de expiración es válida
   */
  static isValidExpirationDate(expirationDate: Date): boolean {
    const now = new Date();
    return expirationDate > now;
  }

  /**
   * Formatea una dirección de Ethereum
   */
  static formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Valida una dirección de Ethereum
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Convierte Wei a Ether
   */
  static weiToEther(wei: bigint): string {
    return (Number(wei) / 1e18).toString();
  }

  /**
   * Convierte Ether a Wei
   */
  static etherToWei(ether: string): bigint {
    return BigInt(Math.floor(parseFloat(ether) * 1e18));
  }

  /**
   * Calcula el gas buffer para transacciones
   */
  static calculateGasBuffer(gasEstimate: bigint, bufferPercent: number = 20): bigint {
    return gasEstimate * BigInt(100 + bufferPercent) / BigInt(100);
  }

  /**
   * Genera un hash único para el certificado
   */
  static generateCertificateHash(data: {
    studentName: string;
    courseName: string;
    institutionName: string;
    timestamp: number;
  }): string {
    const crypto = require('crypto');
    const dataString = `${data.studentName}-${data.courseName}-${data.institutionName}-${data.timestamp}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Valida los parámetros de un certificado
   */
  static validateCertificateParams(params: {
    recipient: string;
    studentName: string;
    courseName: string;
    institutionName: string;
    tokenURI: string;
    ipfsHash: string;
    expirationDate: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isValidAddress(params.recipient)) {
      errors.push("Dirección de destinatario inválida");
    }

    if (!params.studentName?.trim()) {
      errors.push("Nombre del estudiante requerido");
    }

    if (!params.courseName?.trim()) {
      errors.push("Nombre del curso requerido");
    }

    if (!params.institutionName?.trim()) {
      errors.push("Nombre de la institución requerido");
    }

    if (!params.tokenURI?.trim()) {
      errors.push("URI del token requerido");
    }

    if (!params.ipfsHash?.trim()) {
      errors.push("Hash IPFS requerido");
    }

    const expirationDate = this.timestampToDate(params.expirationDate);
    if (!this.isValidExpirationDate(expirationDate)) {
      errors.push("Fecha de expiración debe ser futura");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatea los datos de gas para logging
   */
  static formatGasInfo(gasUsed: bigint, gasPrice?: bigint): string {
    const gasUsedFormatted = gasUsed.toString();
    
    if (gasPrice) {
      const cost = gasUsed * gasPrice;
      const costInEther = this.weiToEther(cost);
      return `Gas usado: ${gasUsedFormatted}, Costo: ${costInEther} ETH`;
    }
    
    return `Gas usado: ${gasUsedFormatted}`;
  }

  /**
   * Obtiene información de la red desde el provider
   */
  static async getNetworkInfo(provider: any): Promise<{
    chainId: number;
    name: string;
    isTestnet: boolean;
  }> {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    let name = "Unknown";
    let isTestnet = false;

    switch (chainId) {
      case 1:
        name = "Ethereum Mainnet";
        break;
      case 43114:
        name = "Avalanche Mainnet";
        break;
      case 43113:
        name = "Avalanche Fuji Testnet";
        isTestnet = true;
        break;
      case 42161:
        name = "Arbitrum One";
        break;
      case 421614:
        name = "Arbitrum Sepolia Testnet";
        isTestnet = true;
        break;
      default:
        name = `Chain ${chainId}`;
        isTestnet = chainId < 1000000; // Heurística simple
    }

    return { chainId, name, isTestnet };
  }

  /**
   * Espera a que una transacción sea confirmada
   */
  static async waitForTransaction(
    provider: any, 
    txHash: string, 
    confirmations: number = 1
  ): Promise<any> {
    console.log(`⏳ Esperando ${confirmations} confirmación(es) para ${txHash}...`);
    
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    
    if (receipt?.status === 1) {
      console.log("✅ Transacción confirmada exitosamente");
    } else {
      console.log("❌ Transacción falló");
    }
    
    return receipt;
  }
}
