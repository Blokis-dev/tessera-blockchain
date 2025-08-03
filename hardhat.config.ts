import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    fuji: {
      url: process.env.AVALANCHE_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
      chainId: 43113,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
      chainId: 43114,
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },
  etherscan: {
    // Migración a Etherscan V2 API (Multichain) - Una sola API key para todas las redes
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
