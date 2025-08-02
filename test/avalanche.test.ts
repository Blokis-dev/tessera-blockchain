import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertNFTAvalanche", function () {
  let certNFT: any;
  let owner: SignerWithAddress;
  let institution: SignerWithAddress;
  let student: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [owner, institution, student, other] = await ethers.getSigners();
    
    const CertNFT = await ethers.getContractFactory("CertNFTAvalanche");
    certNFT = await CertNFT.deploy();
    await certNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await certNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await certNFT.name()).to.equal("CertChain Certificate Avalanche");
      expect(await certNFT.symbol()).to.equal("CERT-AVAX");
    });

    it("Should start with token ID 0", async function () {
      expect(await certNFT.getNextTokenId()).to.equal(0);
    });
  });

  describe("Institution Management", function () {
    it("Should allow owner to authorize institutions", async function () {
      await expect(certNFT.authorizeInstitution(institution.address))
        .to.emit(certNFT, "InstitutionAuthorized")
        .withArgs(institution.address);
      
      expect(await certNFT.authorizedInstitutions(institution.address)).to.be.true;
    });

    it("Should allow owner to revoke institutions", async function () {
      await certNFT.authorizeInstitution(institution.address);
      
      await expect(certNFT.revokeInstitution(institution.address))
        .to.emit(certNFT, "InstitutionRevoked")
        .withArgs(institution.address);
      
      expect(await certNFT.authorizedInstitutions(institution.address)).to.be.false;
    });

    it("Should not allow non-owner to authorize institutions", async function () {
      await expect(
        certNFT.connect(other).authorizeInstitution(institution.address)
      ).to.be.revertedWithCustomError(certNFT, "OwnableUnauthorizedAccount");
    });

    it("Should not allow authorizing zero address", async function () {
      await expect(
        certNFT.authorizeInstitution(ethers.ZeroAddress)
      ).to.be.revertedWith("CertNFT: Invalid institution address");
    });
  });

  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
    });

    it("Should allow authorized institution to issue certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60); // 1 year

      await expect(
        certNFT.connect(institution).issueCertificate(
          student.address,
          "Juan Pérez",
          "Blockchain Development",
          "Tech University",
          "https://ipfs.io/ipfs/QmTest",
          "QmTest",
          expirationTime
        )
      ).to.emit(certNFT, "CertificateIssued")
        .withArgs(0, student.address, "Juan Pérez", "Blockchain Development", "Tech University");

      expect(await certNFT.ownerOf(0)).to.equal(student.address);
      expect(await certNFT.getNextTokenId()).to.equal(1);
    });

    it("Should allow owner to issue certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await expect(
        certNFT.issueCertificate(
          student.address,
          "María García",
          "Smart Contracts",
          "Crypto Academy",
          "https://ipfs.io/ipfs/QmTest2",
          "QmTest2",
          expirationTime
        )
      ).to.emit(certNFT, "CertificateIssued");
    });

    it("Should not allow unauthorized address to issue certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await expect(
        certNFT.connect(other).issueCertificate(
          student.address,
          "Test Student",
          "Test Course",
          "Test Institution",
          "https://ipfs.io/ipfs/QmTest",
          "QmTest",
          expirationTime
        )
      ).to.be.revertedWith("CertNFT: Not authorized institution");
    });

    it("Should validate certificate data", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      // Invalid recipient
      await expect(
        certNFT.connect(institution).issueCertificate(
          ethers.ZeroAddress,
          "Test Student",
          "Test Course",
          "Test Institution",
          "https://ipfs.io/ipfs/QmTest",
          "QmTest",
          expirationTime
        )
      ).to.be.revertedWith("CertNFT: Invalid recipient address");

      // Empty student name
      await expect(
        certNFT.connect(institution).issueCertificate(
          student.address,
          "",
          "Test Course",
          "Test Institution",
          "https://ipfs.io/ipfs/QmTest",
          "QmTest",
          expirationTime
        )
      ).to.be.revertedWith("CertNFT: Student name required");

      // Invalid expiration date
      await expect(
        certNFT.connect(institution).issueCertificate(
          student.address,
          "Test Student",
          "Test Course",
          "Test Institution",
          "https://ipfs.io/ipfs/QmTest",
          "QmTest",
          currentTime - 1000
        )
      ).to.be.revertedWith("CertNFT: Invalid expiration date");
    });

    it("Should store certificate data correctly", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Ana López",
        "DeFi Protocols",
        "Blockchain Institute",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );

      const certData = await certNFT.getCertificateData(0);
      expect(certData.studentName).to.equal("Ana López");
      expect(certData.courseName).to.equal("DeFi Protocols");
      expect(certData.institutionName).to.equal("Blockchain Institute");
      expect(certData.ipfsHash).to.equal("QmTest");
      expect(certData.isValid).to.be.true;
      expect(certData.expirationDate).to.equal(expirationTime);
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
    });

    it("Should verify valid certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );

      expect(await certNFT.verifyCertificate(0)).to.be.true;
    });

    it("Should not verify non-existent certificate", async function () {
      expect(await certNFT.verifyCertificate(999)).to.be.false;
    });

    it("Should not verify revoked certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );

      await certNFT.connect(institution).revokeCertificate(0);
      expect(await certNFT.verifyCertificate(0)).to.be.false;
    });

    it("Should not verify expired certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + 1; // Expires in 1 second

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );

      // Wait for expiration
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      expect(await certNFT.verifyCertificate(0)).to.be.false;
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );
    });

    it("Should allow authorized institution to revoke certificate", async function () {
      await expect(certNFT.connect(institution).revokeCertificate(0))
        .to.emit(certNFT, "CertificateRevoked")
        .withArgs(0);

      const certData = await certNFT.getCertificateData(0);
      expect(certData.isValid).to.be.false;
    });

    it("Should not allow unauthorized address to revoke certificate", async function () {
      await expect(
        certNFT.connect(other).revokeCertificate(0)
      ).to.be.revertedWith("CertNFT: Not authorized institution");
    });

    it("Should not allow revoking non-existent certificate", async function () {
      await expect(
        certNFT.connect(institution).revokeCertificate(999)
      ).to.be.revertedWith("CertNFT: Token does not exist");
    });
  });

  describe("ICM Functionality", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );
    });

    it("Should emit ICM message event", async function () {
      const destinationBlockchain = "0x742d35Cc6634C0532925a3b8D5c2B7FF2e1E5B12";
      const message = ethers.toUtf8Bytes("test message");

      await expect(
        certNFT.connect(institution).sendICMNotification(
          destinationBlockchain,
          0,
          message
        )
      ).to.emit(certNFT, "ICMMessageSent");
    });

    it("Should not allow ICM for non-existent certificate", async function () {
      const destinationBlockchain = "0x742d35Cc6634C0532925a3b8D5c2B7FF2e1E5B12";
      const message = ethers.toUtf8Bytes("test message");

      await expect(
        certNFT.connect(institution).sendICMNotification(
          destinationBlockchain,
          999,
          message
        )
      ).to.be.revertedWith("CertNFT: Token does not exist");
    });
  });

  describe("Token URI and Metadata", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
    });

    it("Should return correct token URI", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);
      const tokenURI = "https://ipfs.io/ipfs/QmTest";

      await certNFT.connect(institution).issueCertificate(
        student.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        tokenURI,
        "QmTest",
        expirationTime
      );

      expect(await certNFT.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should support ERC721 interface", async function () {
      const ERC721InterfaceId = "0x80ac58cd";
      expect(await certNFT.supportsInterface(ERC721InterfaceId)).to.be.true;
    });
  });
});
