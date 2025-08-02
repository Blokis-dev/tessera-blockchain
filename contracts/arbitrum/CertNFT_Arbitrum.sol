// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertNFTArbitrum
 * @dev Contrato de certificados NFT en Arbitrum
 * @notice Este contrato implementa certificados digitales como NFTs en la red Arbitrum
 */
contract CertNFTArbitrum is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapeo de instituciones autorizadas
    mapping(address => bool) public authorizedInstitutions;
    
    // Mapeo de certificados para verificación
    mapping(uint256 => CertificateData) public certificates;
    
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

    constructor() ERC721("CertChain Certificate Arbitrum", "CERT-ARB") Ownable(msg.sender) {
        // Constructor para Arbitrum
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
