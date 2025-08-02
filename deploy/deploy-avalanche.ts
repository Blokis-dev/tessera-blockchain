import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Desplegando CertNFTAvalanche...");

  const [deployer] = await ethers.getSigners();
  console.log("📦 Cuenta deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "AVAX");

  // Deploy del contrato
  const CertNFTAvalanche = await ethers.getContractFactory("CertNFTAvalanche");
  const certNFT = await CertNFTAvalanche.deploy();
  await certNFT.waitForDeployment();

  const contractAddress = await certNFT.getAddress();
  console.log("✅ CertNFTAvalanche desplegado en:", contractAddress);

  // Crear directorio deployments si no existe
  const deploymentDir = path.join(__dirname, "..", "deployments", "avalanche");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Guardar información de despliegue
  const deploymentInfo = {
    contractName: "CertNFTAvalanche",
    contractAddress: contractAddress,
    network: "avalanche",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: certNFT.deploymentTransaction()?.hash,
    gasUsed: certNFT.deploymentTransaction()?.gasLimit.toString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Guardar en deployments/avalanche/
  fs.writeFileSync(
    path.join(deploymentDir, "CertNFTAvalanche.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment guardado en deployments/avalanche/");
  console.log("🔍 Para verificar:");
  console.log(`npx hardhat verify --network avalanche ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
