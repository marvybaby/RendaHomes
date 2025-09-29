const { ethers } = require('ethers');
require('dotenv').config();

const PROPERTY_TOKEN_ABI = [
  "function getPlatformStats() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function getProperty(uint256 propertyId) view returns (uint256 id, string metadataURI, uint256 totalValue, uint256 totalTokens, uint256 availableTokens, uint256 tokenPrice, address propertyOwner, bool isActive, bool isVerified, uint256 createdAt, uint8 propertyType, uint8 riskLevel)"
];

async function debugOwners() {
  try {
    console.log('🔍 Checking property owners...\n');

    // Setup provider and contract
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const contractAddress = process.env.VITE_PROPERTY_TOKEN_TESTNET;

    if (!contractAddress) {
      throw new Error('VITE_PROPERTY_TOKEN_TESTNET not found in environment variables');
    }

    const contract = new ethers.Contract(contractAddress, PROPERTY_TOKEN_ABI, provider);

    // Get total properties
    const stats = await contract.getPlatformStats();
    const totalProperties = Number(stats[0]);
    console.log(`📊 Total properties: ${totalProperties}\n`);

    // Check the last 10 properties for owners
    const startId = Math.max(0, totalProperties - 10);

    for (let i = startId; i < totalProperties; i++) {
      try {
        const property = await contract.getProperty(i);
        console.log(`Property ${i}:`);
        console.log(`  Owner: ${property.propertyOwner}`);
        console.log(`  Active: ${property.isActive}`);
        console.log(`  Verified: ${property.isVerified}`);
        console.log('');
      } catch (error) {
        console.log(`Property ${i}: Error - ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugOwners();