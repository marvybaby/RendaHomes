const { ethers } = require('ethers');
require('dotenv').config();

const PROPERTY_TOKEN_ABI = [
  "function getPlatformStats() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function getProperty(uint256 propertyId) view returns (uint256 id, string metadataURI, uint256 totalValue, uint256 totalTokens, uint256 availableTokens, uint256 tokenPrice, address propertyOwner, bool isActive, bool isVerified, uint256 createdAt, uint8 propertyType, uint8 riskLevel)"
];

async function checkProperties() {
  try {
    console.log('🔍 Checking property contract state...\n');

    // Setup provider and contract
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const contractAddress = process.env.VITE_PROPERTY_TOKEN_TESTNET;

    if (!contractAddress) {
      throw new Error('VITE_PROPERTY_TOKEN_TESTNET not found in environment variables');
    }

    const contract = new ethers.Contract(contractAddress, PROPERTY_TOKEN_ABI, provider);
    console.log(`📄 Contract address: ${contractAddress}`);

    // Get platform stats
    const stats = await contract.getPlatformStats();
    const totalProperties = Number(stats[0]);
    const activeProperties = Number(stats[1]);
    const totalValueLocked = Number(ethers.formatEther(stats[2]));
    const totalTokensSold = Number(stats[3]);
    const totalInvestors = Number(stats[4]);

    console.log(`📊 Platform Statistics:`);
    console.log(`   Total Properties: ${totalProperties}`);
    console.log(`   Active Properties: ${activeProperties}`);
    console.log(`   Total Value Locked: $${totalValueLocked.toLocaleString()}`);
    console.log(`   Total Tokens Sold: ${totalTokensSold.toLocaleString()}`);
    console.log(`   Total Investors: ${totalInvestors}`);

    // Check the last few properties
    if (totalProperties > 0) {
      console.log(`\n🏠 Last 5 properties:`);
      const startId = Math.max(0, totalProperties - 5);

      for (let i = startId; i < totalProperties; i++) {
        try {
          const property = await contract.getProperty(i);
          const totalValue = Number(ethers.formatEther(property.totalValue));
          const createdAt = new Date(Number(property.createdAt) * 1000);

          console.log(`   Property ${i}:`);
          console.log(`     Value: $${totalValue.toLocaleString()}`);
          console.log(`     Tokens: ${Number(property.totalTokens).toLocaleString()}`);
          console.log(`     Owner: ${property.propertyOwner}`);
          console.log(`     Active: ${property.isActive}`);
          console.log(`     Verified: ${property.isVerified}`);
          console.log(`     Created: ${createdAt.toLocaleString()}`);
          console.log(`     URI: ${property.metadataURI}`);
          console.log('');
        } catch (error) {
          console.log(`   Property ${i}: Error loading - ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking properties:', error.message);
  }
}

checkProperties();