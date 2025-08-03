// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertNFTAvalanche
 * @dev Contrato de certificados NFT en Avalanche con soporte ICM/ICTT
 * @notice Este contrato implementa certificados digitales como NFTs en la red Avalanche
 */
contract CertNFTAvalanche is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapeo de instituciones autorizadas
    mapping(address => bool) public authorizedInstitutions;
    
    // Mapeo de certificados para verificación
    mapping(uint256 => CertificateData) public certificates;
    
    // =============== EVENTOS ICM/ICTT ===============
    
    /// @notice Evento para notificaciones ICM entre blockchains
    event ICMMessageSent(
        bytes32 indexed messageId,
        address indexed destinationBlockchain,
        uint256 indexed tokenId,
        bytes message
    );
    
    /// @notice Evento para preparación de transferencias ICTT
    event TokenPreparedForTransfer(
        uint256 indexed tokenId,
        address indexed destinationChain
    );
    
    // =============== ESTRUCTURAS DE DATOS ===============
    
    // Estructura de datos del certificado
    struct CertificateData {
        string studentName;
        string courseName;
        string institutionName;
        uint256 issueDate;
        uint256 expirationDate;
        string ipfsHash;
        bool isValid;
    }
    
    // Errores personalizados
    error InvalidAddress();
    error NotAuthorizedInstitution();
    error EmptyString();
    error InvalidExpirationDate();
    error TokenNotExists();
    error ArrayLengthMismatch();
    
    // Eventos
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        string studentName,
        string courseName,
        string institutionName
    );
    
    event CertificateRevoked(uint256 indexed tokenId);
    
    event InstitutionAuthorized(address indexed institution);
    
    event InstitutionRevoked(address indexed institution);

    modifier onlyAuthorizedInstitution() {
        if (!authorizedInstitutions[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedInstitution();
        }
        _;
    }

    constructor() ERC721("CertChain Certificate Avalanche", "CERT-AVAX") Ownable(msg.sender) {
        // Constructor para Avalanche
    }

    /**
     * @dev Autoriza una institución para emitir certificados
     */
    function authorizeInstitution(address institution) external onlyOwner {
        if (institution == address(0)) revert InvalidAddress();
        authorizedInstitutions[institution] = true;
        emit InstitutionAuthorized(institution);
    }

    /**
     * @dev Revoca la autorización de una institución
     */
    function revokeInstitution(address institution) external onlyOwner {
        authorizedInstitutions[institution] = false;
        emit InstitutionRevoked(institution);
    }

    /**
     * @dev Emite un nuevo certificado NFT
     */
    function issueCertificate(
        address recipient,
        string memory studentName,
        string memory courseName,
        string memory institutionName,
        string memory certificateURI,
        string memory ipfsHash,
        uint256 expirationDate
    ) public onlyAuthorizedInstitution returns (uint256) {
        if (recipient == address(0)) revert InvalidAddress();
        if (bytes(studentName).length == 0) revert EmptyString();
        if (bytes(courseName).length == 0) revert EmptyString();
        if (bytes(institutionName).length == 0) revert EmptyString();
        if (expirationDate <= block.timestamp) revert InvalidExpirationDate();

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, certificateURI);

        certificates[tokenId] = CertificateData({
            studentName: studentName,
            courseName: courseName,
            institutionName: institutionName,
            issueDate: block.timestamp,
            expirationDate: expirationDate,
            ipfsHash: ipfsHash,
            isValid: true
        });

        emit CertificateIssued(
            tokenId,
            recipient,
            studentName,
            courseName,
            institutionName
        );

        return tokenId;
    }

    /**
     * @dev Revoca un certificado
     */
    function revokeCertificate(uint256 tokenId) external onlyAuthorizedInstitution {
        if (!_exists(tokenId)) revert TokenNotExists();
        certificates[tokenId].isValid = false;
        emit CertificateRevoked(tokenId);
    }

    /**
     * @dev Verifica si un certificado es válido
     */
    function verifyCertificate(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) {
            return false;
        }
        
        CertificateData memory cert = certificates[tokenId];
        return cert.isValid && block.timestamp <= cert.expirationDate;
    }

    /**
     * @dev Obtiene los datos de un certificado
     */
    function getCertificateData(uint256 tokenId) external view returns (CertificateData memory) {
        if (!_exists(tokenId)) revert TokenNotExists();
        return certificates[tokenId];
    }

    /**
     * @dev Función para obtener el siguiente token ID
     */
    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Función para batch minting (útil para instituciones)
     */
    function batchIssueCertificates(
        address[] memory recipients,
        string[] memory studentNames,
        string[] memory courseNames,
        string memory institutionName,
        string[] memory tokenURIs,
        string[] memory ipfsHashes,
        uint256[] memory expirationDates
    ) external onlyAuthorizedInstitution returns (uint256[] memory) {
        if (recipients.length != studentNames.length) revert ArrayLengthMismatch();
        if (recipients.length != courseNames.length) revert ArrayLengthMismatch();
        if (recipients.length != tokenURIs.length) revert ArrayLengthMismatch();
        if (recipients.length != ipfsHashes.length) revert ArrayLengthMismatch();
        if (recipients.length != expirationDates.length) revert ArrayLengthMismatch();

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = issueCertificate(
                recipients[i],
                studentNames[i],
                courseNames[i],
                institutionName,
                tokenURIs[i],
                ipfsHashes[i],
                expirationDates[i]
            );
        }

        return tokenIds;
    }

    // =============== FUNCIONES ICM/ICTT ===============
    
    /**
     * @dev Envía notificación ICM a otra blockchain
     * @param destinationBlockchain Dirección del contrato destino
     * @param tokenId ID del token certificado
     * @param message Mensaje a enviar
     */
    function sendICMNotification(
        address destinationBlockchain,
        uint256 tokenId,
        bytes memory message
    ) external onlyAuthorizedInstitution {
        if (!_exists(tokenId)) revert TokenNotExists();
        
        bytes32 messageId = keccak256(
            abi.encodePacked(
                tokenId,
                block.timestamp,
                message,
                destinationBlockchain
            )
        );
        
        emit ICMMessageSent(messageId, destinationBlockchain, tokenId, message);
    }
    
    /**
     * @dev Prepara token para transferencia ICTT
     * @param tokenId Token a transferir
     * @param destinationChain Blockchain destino
     */
    function prepareICTTransfer(
        uint256 tokenId,
        address destinationChain
    ) external {
        if (ownerOf(tokenId) != msg.sender && msg.sender != owner()) {
            revert NotAuthorizedInstitution();
        }
        if (!_exists(tokenId)) revert TokenNotExists();
        
        // Marcar como en tránsito (temporal para ICTT)
        certificates[tokenId].isValid = false;
        
        emit TokenPreparedForTransfer(tokenId, destinationChain);
    }
    
    /**
     * @dev Completa transferencia ICTT (recibe token de otra chain)
     * @param tokenId ID del token
     * @param originalChain Chain de origen
     */
    function completeICTTransfer(
        uint256 tokenId,
        address originalChain
    ) external onlyOwner {
        if (_exists(tokenId)) {
            // Reactivar token recibido
            certificates[tokenId].isValid = true;
        }
        
        emit TokenPreparedForTransfer(tokenId, originalChain);
    }

    /**
     * @dev Verifica si un token existe
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Override required by Solidity
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
