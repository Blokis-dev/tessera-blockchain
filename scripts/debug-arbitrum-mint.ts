import { ethers } from "hardhat";
import { CertNFTArbitrum } from "../typechain-types";

async function main() {
  console.log("🔍 Debugging Arbitrum contract minting issue...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Account:", deployer.address);
  
  // Cargar el contrato deployado
  const contractAddress = "0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B";
  const CertNFT = await ethers.getContractFactory("CertNFTArbitrum");
  const certNFT = CertNFT.attach(contractAddress) as CertNFTArbitrum;
  
  try {
    // Verificar información básica del contrato
    console.log("\n📊 Contract Info:");
    console.log("  Name:", await certNFT.name());
    console.log("  Symbol:", await certNFT.symbol());
    console.log("  Owner:", await certNFT.owner());
    console.log("  Next Token ID:", await certNFT.getNextTokenId());
    
    // Verificar autorización
    console.log("\n🔐 Authorization Check:");
    console.log("  Is Owner:", deployer.address.toLowerCase() === (await certNFT.owner()).toLowerCase());
    console.log("  Is Authorized Institution:", await certNFT.authorizedInstitutions(deployer.address));
    
    // Datos de prueba simples
    const testData = {
      recipient: deployer.address, // Usar la misma cuenta para simplicidad
      studentName: "Test Student",
      courseName: "Test Course", 
      institutionName: "Test Institution",
      tokenURI: "https://ipfs.io/ipfs/QmTestHash",
      ipfsHash: "QmTestHash",
      expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 año
    };
    
    console.log("\n🧪 Test Data:");
    console.log("  Recipient:", testData.recipient);
    console.log("  Student Name:", testData.studentName);
    console.log("  Course Name:", testData.courseName);
    console.log("  Institution Name:", testData.institutionName);
    console.log("  Token URI:", testData.tokenURI);
    console.log("  IPFS Hash:", testData.ipfsHash);
    console.log("  Expiration Date:", testData.expirationDate);
    console.log("  Current Timestamp:", Math.floor(Date.now() / 1000));
    
    // Intentar llamar la función con call para ver errores específicos
    console.log("\n🔍 Testing with static call...");
    try {
      const result = await certNFT.issueCertificate.staticCall(
        testData.recipient,
        testData.studentName,
        testData.courseName,
        testData.institutionName,
        testData.tokenURI,
        testData.ipfsHash,
        testData.expirationDate
      );
      console.log("✅ Static call successful, would mint token ID:", result);
      
      // Si el static call funciona, intentar la estimación de gas
      console.log("\n⛽ Testing gas estimation...");
      const gasEstimate = await certNFT.issueCertificate.estimateGas(
        testData.recipient,
        testData.studentName,
        testData.courseName,
        testData.institutionName,
        testData.tokenURI,
        testData.ipfsHash,
        testData.expirationDate
      );
      console.log("✅ Gas estimate:", gasEstimate.toString());
      
    } catch (error: any) {
      console.log("❌ Static call failed:", error.message);
      
      // Verificar cada parámetro individualmente
      console.log("\n🔍 Parameter validation:");
      console.log("  Recipient is zero address:", testData.recipient === ethers.ZeroAddress);
      console.log("  Student name is empty:", testData.studentName === "");
      console.log("  Course name is empty:", testData.courseName === "");
      console.log("  Institution name is empty:", testData.institutionName === "");
      console.log("  Expiration in past:", testData.expirationDate <= Math.floor(Date.now() / 1000));
      
      // Intentar obtener el error específico
      if (error.reason) {
        console.log("  Error reason:", error.reason);
      }
      if (error.code) {
        console.log("  Error code:", error.code);
      }
      if (error.data) {
        console.log("  Error data:", error.data);
      }
    }
    
  } catch (error: any) {
    console.log("❌ Contract interaction failed:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
