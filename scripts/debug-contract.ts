import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import type { CertNFTArbitrum } from "../typechain-types";

async function main() {
  console.log("🔍 Diagnosticando contratos...");

  // Cargar la dirección del contrato deployado
  const deploymentPath = path.join(__dirname, "../deployments/arbitrum/CertNFTArbitrum.json");
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("❌ Deployment file not found.");
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deploymentData.contractAddress;

  console.log("📄 Contract address:", contractAddress);

  // Obtener signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Account:", deployer.address);
  
  // Verificar balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  // Conectar al contrato
  const CertNFT = await ethers.getContractFactory("CertNFTArbitrum");
  const certNFT = CertNFT.attach(contractAddress) as CertNFTArbitrum;

  console.log("\n🧪 Probando funciones del contrato...");
  
  try {
    // 1. Verificar información básica
    console.log("1️⃣ Información básica:");
    const name = await certNFT.name();
    const symbol = await certNFT.symbol();
    const owner = await certNFT.owner();
    const nextTokenId = await certNFT.getNextTokenId();

    console.log(`   📛 Name: ${name}`);
    console.log(`   🔖 Symbol: ${symbol}`);
    console.log(`   👤 Owner: ${owner}`);
    console.log(`   🆔 Next Token ID: ${nextTokenId}`);

    // 2. Verificar autorización
    console.log("\n2️⃣ Verificar autorización:");
    try {
      const isAuthorized = await certNFT.authorizedInstitutions(deployer.address);
      console.log(`   ✅ Account autorizada: ${isAuthorized}`);
    } catch (error: any) {
      console.log("   ❌ Error verificando autorización:", error.message);
    }

    // 3. Si es owner, autorizar la cuenta
    console.log("\n3️⃣ Autorización:");
    if (deployer.address.toLowerCase() === owner.toLowerCase()) {
      console.log("   👑 Es owner - autorizando cuenta...");
      try {
        const authTx = await certNFT.authorizeInstitution(deployer.address);
        await authTx.wait();
        console.log("   ✅ Cuenta autorizada exitosamente");
        
        // Verificar nuevamente
        const isAuthorizedNow = await certNFT.authorizedInstitutions(deployer.address);
        console.log(`   ✅ Verificación: ${isAuthorizedNow}`);
      } catch (error: any) {
        console.log("   ❌ Error autorizando:", error.message);
      }
    } else {
      console.log("   ⚠️ No es owner, no puede autorizar");
    }

    // 4. Probar mint con datos simples
    console.log("\n4️⃣ Probando mint básico:");
    const testParams = {
      recipient: deployer.address, // Mint a sí mismo
      studentName: "Test Student",
      courseName: "Test Course",
      institutionName: "Test Institution",
      tokenURI: "https://test.com/metadata",
      ipfsHash: "QmTestHash",
      expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 año
    };

    try {
      console.log("   📊 Parámetros de prueba:");
      console.log(`      recipient: ${testParams.recipient}`);
      console.log(`      expirationDate: ${testParams.expirationDate}`);
      console.log(`      currentTimestamp: ${Math.floor(Date.now() / 1000)}`);

      // Estimar gas primero
      console.log("   ⛽ Estimando gas...");
      const gasEstimate = await certNFT.issueCertificate.estimateGas(
        testParams.recipient,
        testParams.studentName,
        testParams.courseName,
        testParams.institutionName,
        testParams.tokenURI,
        testParams.ipfsHash,
        testParams.expirationDate
      );
      console.log(`   ⛽ Gas estimado: ${gasEstimate.toString()}`);

      // Ejecutar transacción
      console.log("   🚀 Ejecutando mint...");
      const tx = await certNFT.issueCertificate(
        testParams.recipient,
        testParams.studentName,
        testParams.courseName,
        testParams.institutionName,
        testParams.tokenURI,
        testParams.ipfsHash,
        testParams.expirationDate,
        { gasLimit: gasEstimate * 120n / 100n }
      );

      console.log("   📝 Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("   ✅ Mint exitoso!");

    } catch (error: any) {
      console.log("   ❌ Error en mint:", error.message);
      if (error.reason) {
        console.log("   💡 Razón:", error.reason);
      }
      if (error.data) {
        console.log("   📊 Data:", error.data);
      }
    }

  } catch (error: any) {
    console.error("❌ Error general:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
