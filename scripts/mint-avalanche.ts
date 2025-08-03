import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { MetadataBuilder, ContractUtils } from "./utils/metadata-builder";
import type { CertNFTAvalanche } from "../typechain-types";

async function main() {
  console.log("🎯 Minting certificate on Avalanche...");

  // Cargar la dirección del contrato deployado
  const deploymentPath = path.join(__dirname, "../deployments/avalanche/CertNFTAvalanche.json");
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("❌ Deployment file not found. Please deploy the contract first.");
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deploymentData.contractAddress;

  console.log("📄 Contract address:", contractAddress);

  // Obtener signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Minting with account:", deployer.address);

  // Conectar al contrato con tipos correctos
  const CertNFT = await ethers.getContractFactory("CertNFTAvalanche");
  const certNFT = CertNFT.attach(contractAddress) as CertNFTAvalanche;

  // Datos del certificado (puedes modificar estos datos)
  const certificateData = {
    recipient: deployer.address, // Usar la cuenta del deployer para evitar problemas
    studentName: "María González López",
    courseName: "Desarrollo de DApps en Avalanche",
    institutionName: "Instituto Blockchain Avanzado",
    imageUrl: "https://ipfs.io/ipfs/QmSampleCertificateImageHash", // URL de la imagen en IPFS
    ipfsHash: "QmSampleMetadataHash" // Hash de los metadatos en IPFS
  };

  // Generar metadatos
  const now = new Date();
  const expirationDate = ContractUtils.generateDefaultExpirationDate();
  const certificateId = MetadataBuilder.generateCertificateId(
    certificateData.studentName,
    certificateData.courseName,
    certificateData.institutionName,
    now.getTime()
  );

  const metadata = MetadataBuilder.buildCertificateMetadata(
    certificateData.studentName,
    certificateData.courseName,
    certificateData.institutionName,
    now,
    expirationDate,
    certificateData.imageUrl,
    certificateId,
    "Avalanche"
  );

  console.log("\n📋 Certificate Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`👨‍🎓 Student: ${certificateData.studentName}`);
  console.log(`📚 Course: ${certificateData.courseName}`);
  console.log(`🏫 Institution: ${certificateData.institutionName}`);
  console.log(`📅 Issue Date: ${now.toLocaleDateString()}`);
  console.log(`⏰ Expiration: ${expirationDate.toLocaleDateString()}`);
  console.log(`🆔 Certificate ID: ${certificateId}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Verificar si el deployer puede mintear (debe ser owner o institución autorizada)
  try {
    const isAuthorized: boolean = await certNFT.authorizedInstitutions(deployer.address);
    const owner: string = await certNFT.owner();
    
    if (!isAuthorized && deployer.address.toLowerCase() !== owner.toLowerCase()) {
      console.log("⚠️  Current account is not authorized. Authorizing as institution...");
      
      // Si es el owner, autorizar la cuenta actual como institución
      if (deployer.address.toLowerCase() === owner.toLowerCase()) {
        const authTx = await certNFT.authorizeInstitution(deployer.address);
        await authTx.wait();
        console.log("✅ Account authorized as institution");
      } else {
        throw new Error("Account is not owner and cannot authorize itself");
      }
    }
  } catch (error) {
    console.log("⚠️  Could not check authorization, proceeding anyway...");
  }

  // Preparar los parámetros para el mint
  const tokenURI = `https://ipfs.io/ipfs/${certificateData.ipfsHash}`;
  const expirationTimestamp = ContractUtils.dateToTimestamp(expirationDate);

  console.log("\n🎯 Minting NFT...");
  
  try {
    // Estimar gas
    const gasEstimate = await certNFT.issueCertificate.estimateGas(
      certificateData.recipient,
      certificateData.studentName,
      certificateData.courseName,
      certificateData.institutionName,
      tokenURI,
      certificateData.ipfsHash,
      expirationTimestamp
    );

    console.log("⛽ Estimated gas:", gasEstimate.toString());

    // Ejecutar la transacción
    const tx = await certNFT.issueCertificate(
      certificateData.recipient,
      certificateData.studentName,
      certificateData.courseName,
      certificateData.institutionName,
      tokenURI,
      certificateData.ipfsHash,
      expirationTimestamp,
      { gasLimit: gasEstimate * 120n / 100n } // 20% buffer
    );

    console.log("📝 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    // Obtener el token ID del evento
    const events = receipt?.logs || [];
    let tokenId = null;

    for (const log of events) {
      try {
        const parsedLog = certNFT.interface.parseLog(log);
        if (parsedLog?.name === "CertificateIssued") {
          tokenId = parsedLog.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Ignorar logs que no podemos parsear
      }
    }

    console.log("\n🎉 Certificate Minted Successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🆔 Token ID: ${tokenId}`);
    console.log(`👨‍🎓 Recipient: ${certificateData.recipient}`);
    console.log(`🔗 Transaction: ${receipt?.hash}`);
    console.log(`⛽ Gas Used: ${receipt?.gasUsed?.toString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Guardar información del mint
    const mintData = {
      tokenId: tokenId,
      recipient: certificateData.recipient,
      studentName: certificateData.studentName,
      courseName: certificateData.courseName,
      institutionName: certificateData.institutionName,
      transactionHash: receipt?.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      timestamp: new Date().toISOString(),
      metadata: metadata,
      contractAddress: contractAddress,
      network: "Avalanche Fuji"
    };

    const mintPath = "./deployments/avalanche";
    const mintFile = `${mintPath}/mint-${tokenId || Date.now()}.json`;
    
    fs.writeFileSync(mintFile, JSON.stringify(mintData, null, 2));
    console.log(`📄 Mint data saved to: ${mintFile}`);

    // Verificar el certificado
    if (tokenId) {
      console.log("\n🔍 Verifying certificate...");
      const isValid: boolean = await certNFT.verifyCertificate(tokenId);
      console.log(`✅ Certificate is valid: ${isValid}`);

      const certData = await certNFT.getCertificateData(tokenId);
      console.log(`📊 On-chain data: ${certData.studentName} - ${certData.courseName}`);
    }

  } catch (error: any) {
    console.error("❌ Minting failed:", error);
    
    if (error.reason) {
      console.error("💡 Reason:", error.reason);
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
