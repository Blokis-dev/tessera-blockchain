/**
 * Tipos de datos para la integración API-Blockchain
 */

// ==========================================
// TIPOS DE LA BASE DE DATOS (SUPABASE)
// ==========================================

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'institucion' | 'estudiante';
  institution_id?: string;
  created_at: string;
}

export interface DbInstitution {
  id: string;
  name: string;
  legal_id: string;
  email_institucional: string;
  website?: string;
  description?: string;
  logo_url?: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  submitted_by: string;
  approved_by?: string;
  created_at: string;
}

export interface DbCertificate {
  id: string;
  title: string;
  description?: string;
  student_id: string;
  institution_id: string;
  issued_at: string;
  ipfs_hash?: string;
  blockchain_tx?: string;
  qr_code_url?: string;
  nft_metadata_url?: string;
  token_id?: number;
  status: 'emitido' | 'revocado';
}

export interface DbTokens {
  id: string;
  institution_id: string;
  total_tokens: number;
  tokens_used: number;
  tokens_remaining: number;
  updated_at: string;
}

export interface DbIpfsFile {
  id: string;
  file_name: string;
  file_type: 'certificate' | 'metadata';
  ipfs_hash: string;
  uploaded_by: string;
  uploaded_at: string;
}

// ==========================================
// TIPOS PARA LA API REST
// ==========================================

export interface ApiCertificateRequest {
  student: {
    id: string;
    email: string;
    full_name: string;
    wallet_address: string;
  };
  certificate: {
    title: string;
    description?: string;
    course_name: string;
    issued_at: string;
    expiration_date?: string;
  };
  institution: {
    id: string;
    name: string;
    legal_id: string;
  };
  ipfs: {
    image_hash: string;
    metadata_hash?: string;
  };
  network: 'avalanche' | 'arbitrum';
}

export interface ApiCertificateResponse {
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

export interface ApiBatchRequest {
  certificates: ApiCertificateRequest[];
}

export interface ApiVerificationRequest {
  token_id: string;
  network: 'avalanche' | 'arbitrum';
}

export interface ApiVerificationResponse {
  is_valid: boolean;
  token_id: string;
  network: string;
  certificate_data?: {
    student_name: string;
    course_name: string;
    institution_name: string;
    issue_date: string;
    expiration_date: string;
    ipfs_hash: string;
  };
  verified_at: string;
}

// ==========================================
// TIPOS PARA METADATOS NFT
// ==========================================

export interface CertificateAttribute {
  trait_type: string;
  value: string;
}

export interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: CertificateAttribute[];
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

// ==========================================
// TIPOS PARA CONTRATOS BLOCKCHAIN
// ==========================================

export interface ContractCertificateData {
  studentName: string;
  courseName: string;
  institutionName: string;
  issueDate: bigint;
  expirationDate: bigint;
  ipfsHash: string;
  isValid: boolean;
}

export interface ContractMintParams {
  recipient: string;
  studentName: string;
  courseName: string;
  institutionName: string;
  tokenURI: string;
  ipfsHash: string;
  expirationDate: number;
}

export interface ContractBatchMintParams {
  recipients: string[];
  studentNames: string[];
  courseNames: string[];
  institutionName: string;
  tokenURIs: string[];
  ipfsHashes: string[];
  expirationDates: number[];
}

// ==========================================
// TIPOS PARA LOGS Y AUDITORÍA
// ==========================================

export interface MintLogData {
  // Datos de la solicitud original
  request: {
    student: ApiCertificateRequest['student'];
    certificate: ApiCertificateRequest['certificate'];
    institution: ApiCertificateRequest['institution'];
    ipfs: ApiCertificateRequest['ipfs'];
  };
  
  // Datos del mint en blockchain
  mint: {
    token_id: string;
    transaction_hash: string;
    block_number: number;
    gas_used: string;
    contract_address: string;
    metadata_url: string;
    certificate_id: string;
  };
  
  // Metadatos generados
  metadata: CertificateMetadata;
  
  // Info adicional
  network: string;
  timestamp: string;
  api_version: string;
}

export interface ErrorLogData {
  error_type: 'validation' | 'blockchain' | 'ipfs' | 'database' | 'unknown';
  error_message: string;
  error_details?: any;
  request_data?: any;
  timestamp: string;
  network?: string;
}

// ==========================================
// TIPOS PARA CONFIGURACIÓN
// ==========================================

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  contractName: string;
  isTestnet: boolean;
  blockExplorer: string;
}

export interface IpfsConfig {
  gateway: string;
  pinataApiKey: string;
  pinataSecretKey: string;
}

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface ApiConfig {
  port: number;
  corsOrigins: string[];
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
}

// ==========================================
// TIPOS PARA RESPUESTAS DE ENDPOINTS
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// ENUMS ÚTILES
// ==========================================

export enum CertificateStatus {
  EMITIDO = 'emitido',
  REVOCADO = 'revocado'
}

export enum InstitutionStatus {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada'
}

export enum UserRole {
  ADMIN = 'admin',
  INSTITUCION = 'institucion',
  ESTUDIANTE = 'estudiante'
}

export enum SupportedNetwork {
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum'
}

export enum FileType {
  CERTIFICATE = 'certificate',
  METADATA = 'metadata'
}

// ==========================================
// TIPOS PARA VALIDACIÓN
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidation {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'email' | 'address' | 'date' | 'uuid';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

// ==========================================
// UTILIDADES DE EXPORTACIÓN
// ==========================================

export type NetworkType = 'avalanche' | 'arbitrum';
export type CertificateStatusType = 'emitido' | 'revocado';
export type InstitutionStatusType = 'pendiente' | 'aprobada' | 'rechazada';
export type UserRoleType = 'admin' | 'institucion' | 'estudiante';

// Tipo helper para datos parciales
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Tipo helper para hacer campos opcionales
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
