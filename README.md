# RendaHomes - Real Estate Tokenization Platform

A fully functional real estate tokenization platform built on the Hedera blockchain. RendaHomes enables fractional ownership of real estate through HRM (RendaHomes Real Estate Monetization) tokens, providing investors with access to property investments, rental income, and governance rights.

## 🏗️ Architecture

### Smart Contracts
- **HRM Token**: ERC-20 compatible governance and utility token
- **Property Token**: NFT contract for tokenized real estate with fractional ownership
- **Real Estate Pool**: Investment pools for diversified property exposure
- **Governance Contract**: DAO functionality for platform decision-making

### Frontend Features
- **Property Marketplace**: Browse and invest in tokenized properties
- **Portfolio Management**: Track investments, returns, and token holdings
- **Governance Dashboard**: Vote on platform proposals and decisions
- **Admin Panel**: Property listing, verification, and income distribution
- **Wallet Integration**: HashPack and Blade wallet support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Hedera testnet account with HBAR
- HashPack or Blade wallet extension

### Installation

1. **Download the repository**
   ```bash
   git clone <repository-url>
   cd rendahomes-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Hedera SDK and Web3 dependencies**
   ```bash
   npm install @hashgraph/sdk @hashgraph/hedera-wallet-connect hashconnect
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Hedera account details and other configuration.

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🔧 Smart Contract Deployment

### 1. Prepare Environment
```bash
# Set up your Hedera testnet account
export HEDERA_ACCOUNT_ID="0.0.YOUR_ACCOUNT"
export HEDERA_PRIVATE_KEY="YOUR_PRIVATE_KEY"
export HEDERA_NETWORK="testnet"
```

### 2. Deploy Contracts
```bash
# Run the deployment script
npx ts-node scripts/deploy.ts
```

### 3. Update Configuration
After deployment, update `.env.local` with the deployed contract addresses:
```bash
NEXT_PUBLIC_HRM_TOKEN_TESTNET=0.0.TOKEN_ID
NEXT_PUBLIC_PROPERTY_TOKEN_TESTNET=0.0.CONTRACT_ID
NEXT_PUBLIC_POOL_CONTRACT_TESTNET=0.0.CONTRACT_ID
NEXT_PUBLIC_GOVERNANCE_CONTRACT_TESTNET=0.0.CONTRACT_ID
```

## 💼 Platform Features

### For Investors
- **Browse Properties**: Explore tokenized real estate opportunities
- **Fractional Investment**: Buy property tokens starting from 1 token
- **Portfolio Tracking**: Monitor investments, returns, and performance
- **Rental Income**: Receive proportional rental income distributions
- **Governance Rights**: Vote on platform decisions and property management

### For Property Owners
- **Property Tokenization**: List properties for fractional investment
- **Instant Liquidity**: Access capital without traditional financing
- **Automated Distribution**: Rental income automatically distributed to investors
- **Professional Management**: Platform handles investor relations and compliance

### For Administrators
- **Property Verification**: Review and approve property listings
- **Income Distribution**: Manage rental income payments to investors
- **Platform Governance**: Execute community decisions and upgrades
- **Analytics Dashboard**: Monitor platform performance and metrics

## 🛠️ Technical Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management

### Blockchain
- **Hedera Hashgraph**: L1 blockchain platform
- **Solidity**: Smart contract development
- **HashConnect**: Wallet integration
- **IPFS**: Decentralized metadata storage

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Conventional Commits**: Commit standards

## 🔐 Security Features

### Smart Contract Security
- **Multi-signature Controls**: Admin functions require multiple signatures
- **Pausable Contracts**: Emergency pause functionality
- **Reentrancy Protection**: Protected against reentrancy attacks
- **Access Controls**: Role-based permissions system

### Platform Security
- **Wallet Integration**: Secure connection to Hedera wallets
- **IPFS Verification**: Cryptographic verification of property metadata
- **Audit Trail**: Complete transaction history on-chain
- **Rate Limiting**: Protection against spam and abuse

## 📊 Governance

### Proposal Types
- **Platform Fees**: Adjust platform fee percentages
- **Property Verification**: Community verification of new properties
- **Pool Creation**: Creation of new investment pools
- **Emergency Actions**: Emergency pause/unpause functionality
- **Platform Upgrades**: Smart contract upgrades and improvements

### Voting Mechanics
- **Token-based Voting**: 1 HRM = 1 vote
- **Quorum Requirements**: Minimum 10% participation for validity
- **Voting Period**: 7-day voting window
- **Execution Delay**: 1-day delay before execution

## 🚀 Deployment

### Environment Setup
1. **Development**: Local development with mock data
2. **Testnet**: Hedera testnet deployment for testing
3. **Mainnet**: Production deployment on Hedera mainnet

### Deployment Checklist
- [ ] Smart contracts compiled and tested
- [ ] Environment variables configured
- [ ] Wallet integration tested
- [ ] IPFS integration configured
- [ ] Admin accounts set up
- [ ] Security audit completed

## 📖 API Documentation

### Contract Interactions
```typescript
// Purchase property tokens
await propertyService.purchaseTokens({
  propertyId: 1,
  tokenAmount: 10,
  maxPrice: 25000
});

// Create investment pool
await poolService.createPool({
  name: "Residential Portfolio",
  minInvestment: 1000,
  riskLevel: "Medium"
});
```

### Wallet Integration
```typescript
// Connect HashPack wallet
const { connectHashPack, wallet } = useHederaWallet();
await connectHashPack();

// Send transaction
const txId = await sendTransaction({
  to: contractAddress,
  data: encodedData,
  value: amount
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.rendahomes.app](https://docs.rendahomes.app)
- **Discord**: [Join our community](https://discord.gg/rendahomes)
- **Email**: support@rendahomes.app

## 🏆 Acknowledgments

- Hedera team for the robust blockchain platform
- OpenZeppelin for secure smart contract libraries
- The DeFi community for inspiration and best practices

---

**⚠️ Disclaimer**: This is a demonstration platform. Real estate investments carry risks. Always conduct due diligence and consult financial advisors before investing.
