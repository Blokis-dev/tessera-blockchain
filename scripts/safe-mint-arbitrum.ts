import { ethers } from "hardhat";
import { CertNFTArbitrum } from "../typechain-types";
import { ContractUtils } from "./utils/contract-utils";
import { MetadataBuilder } from "./utils/metadata-builder";

async function main() {
  console.log("🎯 Safe Minting certificate on Arbitrum...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Account:", deployer.address);
  
  // Cargar el contrato deployado
  const contractAddress = "0x52B13E3F00079c00824E68DC9f1dBCc7D0BE808B";
  const CertNFT = await ethers.getContractFactory("CertNFTArbitrum");
  const certNFT = CertNFT.attach(contractAddress) as CertNFTArbitrum;
  
  // Usar la misma cuenta como recipient para evitar problemas
  const certificateData = {
    recipient: deployer.address, // Usar la cuenta del deployer
    studentName: "Carlos Rivera Mendoza",
    courseName: "DeFi Protocols en Arbitrum", 
    institutionName: "Academia Crypto Finance",
    imageUrl: "https://ipfs.io/ipfs/QmArbitrumCertificateImageHash",
    ipfsHash: "QmArbitrumMetadataHash"
  };

  console.log("📋 Certificate Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`👨‍🎓 Student: ${certificateData.studentName}`);
  console.log(`📚 Course: ${certificateData.courseName}`);
  console.log(`🏫 Institution: ${certificateData.institutionName}`);
  console.log(`💳 Recipient: ${certificateData.recipient}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Verificar estado del contrato
    const owner = await certNFT.owner();
    const nextTokenId = await certNFT.getNextTokenId();
    const isAuthorized = await certNFT.authorizedInstitutions(deployer.address);
    
    console.log("📊 Contract State:");
    console.log(`  Owner: ${owner}`);
    console.log(`  Next Token ID: ${nextTokenId}`);
    console.log(`  Account Authorized: ${isAuthorized}`);
    console.log(`  Is Owner: ${deployer.address.toLowerCase() === owner.toLowerCase()}`);
    
    // Generar datos del certificado
    const now = new Date();
    const expirationDate = new Date(now.getTime() + (5 * 365 * 24 * 60 * 60 * 1000)); // 5 años
    const expirationTimestamp = Math.floor(expirationDate.getTime() / 1000);
    const tokenURI = `https://ipfs.io/ipfs/${certificateData.ipfsHash}`;
    
    console.log("\n📅 Timing:");
    console.log(`  Issue Date: ${now.toISOString()}`);
    console.log(`  Expiration: ${expirationDate.toISOString()}`);
    console.log(`  Current Timestamp: ${Math.floor(Date.now() / 1000)}`);
    console.log(`  Expiration Timestamp: ${expirationTimestamp}`);
    console.log(`  Valid Duration: ${expirationTimestamp > Math.floor(Date.now() / 1000) ? 'YES' : 'NO'}`);
    
    // Validar datos antes del mint
    console.log("\n🔍 Pre-mint Validation:");
    console.log(`  Recipient valid: ${certificateData.recipient !== ethers.ZeroAddress}`);
    console.log(`  Student name not empty: ${certificateData.studentName.length > 0}`);
    console.log(`  Course name not empty: ${certificateData.courseName.length > 0}`);
    console.log(`  Institution name not empty: ${certificateData.institutionName.length > 0}`);
    console.log(`  Expiration in future: ${expirationTimestamp > Math.floor(Date.now() / 1000)}`);
    
    // Test con static call primero
    console.log("\n🧪 Testing with static call...");
    const staticResult = await certNFT.issueCertificate.staticCall(
      certificateData.recipient,
      certificateData.studentName,
      certificateData.courseName,
      certificateData.institutionName,
      tokenURI,
      certificateData.ipfsHash,
      expirationTimestamp
    );
    console.log(`✅ Static call successful - would mint token ID: ${staticResult}`);
    
    // Estimar gas
    console.log("\n⛽ Estimating gas...");
    const gasEstimate = await certNFT.issueCertificate.estimateGas(
      certificateData.recipient,
      certificateData.studentName,
      certificateData.courseName,
      certificateData.institutionName,
      tokenURI,
      certificateData.ipfsHash,
      expirationTimestamp
    );
    console.log(`✅ Gas estimate: ${gasEstimate.toString()}`);
    
    // Ejecutar la transacción real
    console.log("\n🚀 Executing mint transaction...");
    const tx = await certNFT.issueCertificate(
      certificateData.recipient,
      certificateData.studentName,
      certificateData.courseName,
      certificateData.institutionName,
      tokenURI,
      certificateData.ipfsHash,
      expirationTimestamp,
      { gasLimit: gasEstimate * 12n / 10n } // 20% buffer
    );
    
    console.log(`📝 Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log(`⛽ Gas used: ${receipt?.gasUsed?.toString()}`);
    
    // Obtener el nuevo token ID
    const newNextTokenId = await certNFT.getNextTokenId();
    const tokenId = newNextTokenId - 1n;
    console.log(`🆔 Minted Token ID: ${tokenId}`);
    
    // Verificar ownership
    const tokenOwner = await certNFT.ownerOf(tokenId);
    console.log(`👤 Token Owner: ${tokenOwner}`);
    
    // Verificar certificado
    const isValid = await certNFT.verifyCertificate(tokenId);
    console.log(`✅ Certificate Valid: ${isValid}`);
    
    console.log("\n🎉 SUCCESS! Certificate minted successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
  } catch (error: any) {
    console.log("❌ Error:", error.message);
    if (error.reason) {
      console.log("❌ Reason:", error.reason);
    }
    if (error.data) {
      console.log("❌ Data:", error.data);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
