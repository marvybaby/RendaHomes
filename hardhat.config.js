require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.HEDERA_PRIVATE_KEY],
      chainId: 296,
      gas: 3000000,
      gasPrice: 400000000000, // 400 Gwei (minimum for Hedera)
      timeout: 120000,
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: [process.env.HEDERA_PRIVATE_KEY],
      chainId: 295,
      gas: 3000000,
      gasPrice: 100000000,
      timeout: 120000,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./hardhat-artifacts"
  },
  mocha: {
    timeout: 120000
  }
};