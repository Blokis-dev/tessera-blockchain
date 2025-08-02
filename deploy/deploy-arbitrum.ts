import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Desplegando CertNFTArbitrum...");

  const [deployer] = await ethers.getSigners();
  console.log("📦 Cuenta deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  // Deploy del contrato
  const CertNFTArbitrum = await ethers.getContractFactory("CertNFTArbitrum");
  const certNFT = await CertNFTArbitrum.deploy();
  await certNFT.waitForDeployment();

  const contractAddress = await certNFT.getAddress();
  console.log("✅ CertNFTArbitrum desplegado en:", contractAddress);

  // Crear directorio deployments si no existe
  const deploymentDir = path.join(__dirname, "..", "deployments", "arbitrum");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Guardar información de despliegue
  const deploymentInfo = {
    contractName: "CertNFTArbitrum",
    contractAddress: contractAddress,
    network: "arbitrum",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: certNFT.deploymentTransaction()?.hash,
    gasUsed: certNFT.deploymentTransaction()?.gasLimit.toString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Guardar en deployments/arbitrum/
  fs.writeFileSync(
    path.join(deploymentDir, "CertNFTArbitrum.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment guardado en deployments/arbitrum/");
  console.log("🔍 Para verificar:");
  console.log(`npx hardhat verify --network arbitrum ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
