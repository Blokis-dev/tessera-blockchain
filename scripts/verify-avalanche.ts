import { ethers } from "hardhat";
import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import type { CertNFTAvalanche } from "../typechain-types";

async function main() {
  console.log("🔍 Verifying CertNFT_Avalanche contract on SnowTrace...");

  // Cargar la dirección del contrato deployado
  const deploymentPath = path.join(__dirname, "../deployments/avalanche/CertNFTAvalanche.json");
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("❌ Deployment file not found. Please deploy the contract first.");
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deploymentData.contractAddress;
  const teleporterMessenger = deploymentData.teleporterMessenger;

  console.log("📄 Contract address:", contractAddress);
  console.log("📡 Teleporter Messenger:", teleporterMessenger);

  try {
    // Ejecutar verificación
    console.log("\n⏳ Starting verification process...");
    
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [teleporterMessenger],
    });

    console.log("✅ Contract verified successfully!");
    console.log(`🔗 View on SnowTrace: https://testnet.snowtrace.io/address/${contractAddress}`);

    // Actualizar el archivo de deployment con información de verificación
    deploymentData.verified = true;
    deploymentData.verificationTime = new Date().toISOString();
    deploymentData.explorerUrl = `https://testnet.snowtrace.io/address/${contractAddress}`;

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("📄 Deployment file updated with verification info");

    // Verificar que el contrato esté funcionando
    console.log("\n🧪 Testing contract functionality...");
    
    const CertNFT = await ethers.getContractFactory("CertNFTAvalanche");
    const certNFT = CertNFT.attach(contractAddress) as CertNFTAvalanche;

    // Obtener información básica del contrato
    const name: string = await certNFT.name();
    const symbol: string = await certNFT.symbol();
    const owner: string = await certNFT.owner();
    const nextTokenId: bigint = await certNFT.getNextTokenId();

    console.log("\n📊 Contract Information:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📛 Name: ${name}`);
    console.log(`🔖 Symbol: ${symbol}`);
    console.log(`👤 Owner: ${owner}`);
    console.log(`🆔 Next Token ID: ${nextTokenId}`);
    console.log(`📡 Teleporter: ${teleporterMessenger}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n✅ All tests passed! Contract is ready for use.");

  } catch (error: any) {
    console.error("❌ Verification failed:", error);

    if (error.message.includes("already verified")) {
      console.log("ℹ️  Contract was already verified");
      console.log(`🔗 View on SnowTrace: https://testnet.snowtrace.io/address/${contractAddress}`);
    } else if (error.message.includes("does not have bytecode")) {
      console.error("💡 Make sure the contract address is correct and deployed");
    } else if (error.message.includes("API Key")) {
      console.error("💡 Make sure ETHERSCAN_API_KEY is set in your .env file");
    } else {
      throw error;
    }
  }

  console.log("\n📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏠 Contract: ${contractAddress}`);
  console.log(`🔗 Network: Avalanche Fuji Testnet`);
  console.log(`🌐 Explorer: https://testnet.snowtrace.io/address/${contractAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
