import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertNFTArbitrum", function () {
  let certNFT: any;
  let owner: SignerWithAddress;
  let institution: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [owner, institution, student1, student2, other] = await ethers.getSigners();
    
    const CertNFT = await ethers.getContractFactory("CertNFTArbitrum");
    certNFT = await CertNFT.deploy();
    await certNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await certNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await certNFT.name()).to.equal("CertChain Certificate Arbitrum");
      expect(await certNFT.symbol()).to.equal("CERT-ARB");
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
          student1.address,
          "Juan Pérez",
          "DeFi Protocols",
          "Arbitrum Academy",
          "https://ipfs.io/ipfs/QmTest",
          "QmTest",
          expirationTime
        )
      ).to.emit(certNFT, "CertificateIssued")
        .withArgs(0, student1.address, "Juan Pérez", "DeFi Protocols", "Arbitrum Academy");

      expect(await certNFT.ownerOf(0)).to.equal(student1.address);
      expect(await certNFT.getNextTokenId()).to.equal(1);
    });

    it("Should allow owner to issue certificate", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      await expect(
        certNFT.issueCertificate(
          student1.address,
          "María García",
          "Smart Contracts Avanzados",
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
          student1.address,
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
          student1.address,
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
          student1.address,
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
        student1.address,
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

  describe("Batch Certificate Issuance", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
    });

    it("Should allow batch minting of certificates", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      const recipients = [student1.address, student2.address];
      const studentNames = ["Estudiante 1", "Estudiante 2"];
      const courseNames = ["Curso A", "Curso B"];
      const institutionName = "Instituto Blockchain";
      const tokenURIs = [
        "https://ipfs.io/ipfs/QmTest1",
        "https://ipfs.io/ipfs/QmTest2"
      ];
      const ipfsHashes = ["QmTest1", "QmTest2"];
      const expirationDates = [expirationTime, expirationTime];

      const tokenIds = await certNFT.connect(institution).batchIssueCertificates(
        recipients,
        studentNames,
        courseNames,
        institutionName,
        tokenURIs,
        ipfsHashes,
        expirationDates
      );

      // Verificar que se emitieron los NFTs
      expect(await certNFT.ownerOf(0)).to.equal(student1.address);
      expect(await certNFT.ownerOf(1)).to.equal(student2.address);
      expect(await certNFT.getNextTokenId()).to.equal(2);
    });

    it("Should revert if arrays have different lengths", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      // Arrays con diferentes longitudes
      const recipients = [student1.address, student2.address];
      const studentNames = ["Estudiante 1"]; // Solo un elemento
      const courseNames = ["Curso A", "Curso B"];
      const institutionName = "Instituto Blockchain";
      const tokenURIs = [
        "https://ipfs.io/ipfs/QmTest1",
        "https://ipfs.io/ipfs/QmTest2"
      ];
      const ipfsHashes = ["QmTest1", "QmTest2"];
      const expirationDates = [expirationTime, expirationTime];

      await expect(
        certNFT.connect(institution).batchIssueCertificates(
          recipients,
          studentNames,
          courseNames,
          institutionName,
          tokenURIs,
          ipfsHashes,
          expirationDates
        )
      ).to.be.revertedWith("CertNFT: Arrays length mismatch");
    });

    it("Should not allow unauthorized address to batch mint", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      const recipients = [student1.address];
      const studentNames = ["Test Student"];
      const courseNames = ["Test Course"];
      const institutionName = "Test Institution";
      const tokenURIs = ["https://ipfs.io/ipfs/QmTest"];
      const ipfsHashes = ["QmTest"];
      const expirationDates = [expirationTime];

      await expect(
        certNFT.connect(other).batchIssueCertificates(
          recipients,
          studentNames,
          courseNames,
          institutionName,
          tokenURIs,
          ipfsHashes,
          expirationDates
        )
      ).to.be.revertedWith("CertNFT: Not authorized institution");
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
        student1.address,
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
        student1.address,
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
        student1.address,
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
        student1.address,
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

  describe("Token URI and Metadata", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
    });

    it("Should return correct token URI", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);
      const tokenURI = "https://ipfs.io/ipfs/QmTest";

      await certNFT.connect(institution).issueCertificate(
        student1.address,
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

  describe("Gas Efficiency", function () {
    beforeEach(async function () {
      await certNFT.authorizeInstitution(institution.address);
    });

    it("Should have reasonable gas costs for minting", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      const tx = await certNFT.connect(institution).issueCertificate(
        student1.address,
        "Test Student",
        "Test Course",
        "Test Institution",
        "https://ipfs.io/ipfs/QmTest",
        "QmTest",
        expirationTime
      );

      const receipt = await tx.wait();
      console.log(`Gas used for minting: ${receipt?.gasUsed?.toString()}`);
      
      // El gas debería ser menor a 200,000 para un mint simple
      expect(receipt?.gasUsed).to.be.lessThan(200000);
    });

    it("Should be more efficient for batch minting", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (365 * 24 * 60 * 60);

      // Mint individual
      const singleTx = await certNFT.connect(institution).issueCertificate(
        student1.address,
        "Student 1",
        "Course 1",
        "Institution",
        "https://ipfs.io/ipfs/QmTest1",
        "QmTest1",
        expirationTime
      );
      const singleReceipt = await singleTx.wait();

      // Batch mint de 2 certificados
      const batchTx = await certNFT.connect(institution).batchIssueCertificates(
        [student1.address, student2.address],
        ["Student 2", "Student 3"],
        ["Course 2", "Course 3"],
        "Institution",
        ["https://ipfs.io/ipfs/QmTest2", "https://ipfs.io/ipfs/QmTest3"],
        ["QmTest2", "QmTest3"],
        [expirationTime, expirationTime]
      );
      const batchReceipt = await batchTx.wait();

      console.log(`Single mint gas: ${singleReceipt?.gasUsed?.toString()}`);
      console.log(`Batch mint gas (2x): ${batchReceipt?.gasUsed?.toString()}`);

      // El batch mint debería ser más eficiente que 2 mints individuales
      const estimatedDoubleGas = (singleReceipt?.gasUsed || 0n) * 2n;
      expect(batchReceipt?.gasUsed).to.be.lessThan(estimatedDoubleGas);
    });
  });
});
