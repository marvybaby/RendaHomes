import { ethers } from 'ethers';
import { getCurrentNetworkConfig, CONTRACT_ABIS } from '../config/contracts';
import { Property, SellOrder, DisasterLog, Proposal } from '../types';

export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private networkConfig = getCurrentNetworkConfig();

  constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  setProvider(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  async getAllProperties(): Promise<Property[]> {
    if (!this.provider) throw new Error('Provider not connected');


    if (!this.networkConfig.contracts.propertyToken) {
      throw new Error('Property token contract not configured');
    }

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.provider
    );

    try {
      const stats = await contract.getPlatformStats();
      const totalProperties = Number(stats[0]);

      if (totalProperties === 0) {
        return [];
      }


    const properties: Property[] = [];
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;

    console.log(`Loading ${totalProperties} properties from contract...`);
    for (let i = 0; i < Math.max(totalProperties, 100); i++) {
      try {
        let propertyData;

        try {
          propertyData = await contract.getProperty(i);
        } catch (abiError) {
          const rawCall = await this.provider.call({
            to: this.networkConfig.contracts.propertyToken,
            data: contract.interface.encodeFunctionData('getProperty', [i])
          });

          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ['tuple(uint256,string,uint256,uint256,uint256,uint256,address,bool,bool,uint256,uint8,uint8)'],
            rawCall
          );
          propertyData = decoded[0];
        }

        consecutiveFailures = 0;

        const propertyImages = [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
          'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800',
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
          'https://images.unsplash.com/photo-1516156008625-3a99312bc7fd?w=800',
          'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
          'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
        ];

        let metadata = {
          title: `Property ${i}`,
          description: 'Real estate property on Hedera blockchain',
          location: 'Unknown Location',
          images: [propertyImages[i % propertyImages.length]]
        };


        const property: Property = {
          id: i,
          title: metadata.title,
          description: metadata.description,
          location: metadata.location,
          totalValue: Number(ethers.formatEther(propertyData[2])),
          tokenPrice: Number(ethers.formatEther(propertyData[5])),
          totalTokens: Number(propertyData[3]),
          availableTokens: Number(propertyData[4]),
          images: metadata.images || [],
          propertyType: this.getPropertyTypeName(Number(propertyData[10])),
          riskLevel: this.getRiskLevelName(Number(propertyData[11])),
          isActive: true,
          isVerified: propertyData[8],
          rentalYield: this.calculateRentalYield(Number(ethers.formatEther(propertyData[2]))),
          propertyOwner: propertyData[6],
          createdAt: Number(propertyData[9]) * 1000,
          tags: ['On-Chain', propertyData[8] ? 'Verified' : 'Unverified']
        };

        if (property.isActive) {
          properties.push(property);
        }

      } catch (error) {
        consecutiveFailures++;

        if (consecutiveFailures >= maxConsecutiveFailures) {
          break;
        }
        continue;
      }
    }

    return properties;
    } catch (contractError) {
      throw new Error(`Failed to load properties from contract: ${contractError.message}`);
    }
  }


  async getProperty(propertyId: number): Promise<Property | null> {
    if (!this.provider) throw new Error('Provider not connected');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.provider
    );

    try {
      let propertyData;

      try {
        propertyData = await contract.getProperty(propertyId);
      } catch (abiError) {
        const rawCall = await this.provider.call({
          to: this.networkConfig.contracts.propertyToken,
          data: contract.interface.encodeFunctionData('getProperty', [propertyId])
        });

        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['tuple(uint256,string,uint256,uint256,uint256,uint256,address,bool,bool,uint256,uint8,uint8)'],
          rawCall
        );
        propertyData = decoded[0];
      }

      const propertyImages = [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        'https://images.unsplash.com/photo-1516156008625-3a99312bc7fd?w=800',
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
      ];

      let metadata = {
        title: `Property ${propertyId}`,
        description: 'Real estate property on Hedera blockchain',
        location: 'Unknown Location',
        images: [propertyImages[propertyId % propertyImages.length]]
      };

      return {
        id: propertyId,
        title: metadata.title,
        description: metadata.description,
        location: metadata.location,
        totalValue: Number(ethers.formatEther(propertyData[2])),
        tokenPrice: Number(ethers.formatEther(propertyData[5])),
        totalTokens: Number(propertyData[3]),
        availableTokens: Number(propertyData[4]),
        images: metadata.images || [],
        propertyType: this.getPropertyTypeName(Number(propertyData[10])),
        riskLevel: this.getRiskLevelName(Number(propertyData[11])),
        isActive: true,
        isVerified: propertyData[8],
        rentalYield: this.calculateRentalYield(Number(ethers.formatEther(propertyData[2]))),
        propertyOwner: propertyData[6],
        createdAt: Number(propertyData[9]) * 1000,
        tags: ['On-Chain', propertyData[8] ? 'Verified' : 'Unverified']
      };
    } catch {
      return null;
    }
  }

  async purchaseTokens(propertyId: number, tokenAmount: number): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const property = await this.getProperty(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const totalCost = property.tokenPrice * tokenAmount;
    const userAddress = await this.signer.getAddress();

    const hrmContract = new ethers.Contract(
      this.networkConfig.contracts.hrmToken,
      CONTRACT_ABIS.HRMToken,
      this.signer
    );

    const balance = await hrmContract.balanceOf(userAddress);
    const balanceFormatted = Number(ethers.formatEther(balance));

    if (balanceFormatted < totalCost) {
      throw new Error(`Insufficient HRM balance. Need ${totalCost} HRM, have ${balanceFormatted.toLocaleString()} HRM`);
    }

    const propertyContract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.signer
    );

    const approveTx = await hrmContract.approve(
      this.networkConfig.contracts.propertyToken,
      ethers.parseEther(totalCost.toString())
    );
    await approveTx.wait();

    const purchaseTx = await propertyContract.purchaseTokens(propertyId, tokenAmount);
    await purchaseTx.wait();

    return purchaseTx.hash;
  }

  async listProperty(
    metadataURI: string,
    totalValue: string,
    totalTokens: number,
    propertyType: number,
    riskLevel: number
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.signer
    );

    const tx = await contract.listProperty(
      metadataURI,
      ethers.parseEther(totalValue),
      totalTokens,
      propertyType,
      riskLevel
    );
    return tx.hash;
  }

  async getInvestorPortfolio(investorAddress: string): Promise<Property[]> {
    if (!this.provider) throw new Error('Provider not connected');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.provider
    );

    try {
      const portfolioData = await contract.getInvestorPortfolio(investorAddress);
      const propertyIds = portfolioData.propertyIds;
      const properties: Property[] = [];

      for (let i = 0; i < propertyIds.length; i++) {
        const propertyId = Number(propertyIds[i]);
        const property = await this.getProperty(propertyId);
        if (property) {
          const investment = await contract.getInvestment(propertyId, investorAddress);
          (property as any).tokensOwned = Number(investment.tokensOwned);
          (property as any).investmentAmount = Number(ethers.formatEther(investment.investmentAmount));
          (property as any).purchaseDate = Number(investment.purchaseDate) * 1000;
          (property as any).isOwned = false; // This is an investment, not owned
          properties.push(property);
        }
      }

      return properties;
    } catch {
      return [];
    }
  }

  async getOwnedProperties(ownerAddress: string): Promise<Property[]> {
    if (!this.provider) throw new Error('Provider not connected');

    console.log('Getting owned properties for address:', ownerAddress);
    const allProperties = await this.getAllProperties();
    const ownedProperties: Property[] = [];

    console.log(`Checking ${allProperties.length} properties for ownership...`);

    for (const property of allProperties) {
      console.log(`Property ${property.id}:`, {
        propertyOwner: property.propertyOwner,
        userAddress: ownerAddress,
        match: property.propertyOwner?.toLowerCase() === ownerAddress.toLowerCase()
      });

      if (property.propertyOwner?.toLowerCase() === ownerAddress.toLowerCase()) {
        console.log(`✅ Found owned property: ${property.title} (ID: ${property.id})`);
        (property as any).tokensOwned = property.totalTokens; // Owner has all tokens initially
        (property as any).investmentAmount = 0; // No investment, they own it
        (property as any).purchaseDate = property.createdAt || Date.now();
        (property as any).isOwned = true; // This is owned, not an investment
        ownedProperties.push(property);
      }
    }

    console.log(`Found ${ownedProperties.length} owned properties`);
    return ownedProperties;
  }

  async getCompletePortfolio(userAddress: string): Promise<Property[]> {
    try {
      const [investments, ownedProperties] = await Promise.all([
        this.getInvestorPortfolio(userAddress),
        this.getOwnedProperties(userAddress)
      ]);

      // Combine both arrays, avoiding duplicates (in case someone owns and invests in same property)
      const allProperties = [...ownedProperties];

      for (const investment of investments) {
        const exists = allProperties.find(p => p.id === investment.id);
        if (!exists) {
          allProperties.push(investment);
        }
      }

      return allProperties;
    } catch {
      return [];
    }
  }

  async getActiveSellOrders(propertyId: number): Promise<SellOrder[]> {
    if (!this.provider) throw new Error('Provider not connected');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.provider
    );

    try {
      const orders = await contract.getActiveSellOrders(propertyId);
      return orders.map((order: any) => ({
        id: Number(order.id),
        propertyId: Number(order.propertyId),
        seller: order.seller,
        tokensForSale: Number(order.tokensForSale),
        pricePerToken: Number(ethers.formatEther(order.pricePerToken)),
        totalPrice: Number(ethers.formatEther(order.totalPrice)),
        isActive: order.isActive,
        createdAt: Number(order.createdAt) * 1000,
        expiresAt: Number(order.expiresAt) * 1000
      }));
    } catch {
      return [];
    }
  }

  async createSellOrder(
    propertyId: number,
    tokensForSale: number,
    pricePerToken: string,
    durationDays: number
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.signer
    );

    const tx = await contract.createSellOrder(
      propertyId,
      tokensForSale,
      ethers.parseEther(pricePerToken),
      durationDays
    );
    return tx.hash;
  }

  async buyFromOrder(orderId: number, tokensToBuy: number): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.propertyToken,
      CONTRACT_ABIS.PropertyToken,
      this.signer
    );

    const tx = await contract.buyFromOrder(orderId, tokensToBuy);
    return tx.hash;
  }

  async getDisasterLogs(): Promise<DisasterLog[]> {
    if (!this.provider) throw new Error('Provider not connected');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.disasterManagement,
      CONTRACT_ABIS.DisasterManagement,
      this.provider
    );

    try {
      const stats = await contract.getDisasterStatistics();
      const totalDisasters = Number(stats.totalDisasters);
      const logs: DisasterLog[] = [];

      for (let i = 0; i < totalDisasters; i++) {
        try {
          const log = await contract.getDisasterLog(i);

          logs.push({
            id: i,
            propertyId: Number(log.propertyId),
            disasterType: Number(log.disasterType),
            severity: Number(log.severity),
            status: Number(log.status),
            description: log.description,
            location: log.location,
            estimatedDamage: Number(ethers.formatEther(log.estimatedDamage)),
            actualDamage: Number(ethers.formatEther(log.actualDamage)),
            insuranceClaim: Number(ethers.formatEther(log.insuranceClaim)),
            insurancePayout: Number(ethers.formatEther(log.insurancePayout)),
            reporter: log.reporter,
            investigator: log.investigator,
            reportedAt: Number(log.reportedAt) * 1000,
            verifiedAt: Number(log.verifiedAt) * 1000,
            resolvedAt: Number(log.resolvedAt) * 1000,
            evidenceUris: log.evidenceUris,
            resolutionNotes: log.resolutionNotes
          });
        } catch {
          continue;
        }
      }

      return logs;
    } catch {
      return [];
    }
  }

  async reportDisaster(
    propertyId: number,
    disasterType: number,
    severity: number,
    description: string,
    location: string,
    estimatedDamage: string,
    evidenceUris: string[]
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.disasterManagement,
      CONTRACT_ABIS.DisasterManagement,
      this.signer
    );

    const tx = await contract.reportDisaster(
      propertyId,
      disasterType,
      severity,
      description,
      location,
      ethers.parseEther(estimatedDamage),
      evidenceUris
    );
    return tx.hash;
  }

  async getAllProposals(): Promise<Proposal[]> {
    if (!this.provider) throw new Error('Provider not connected');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.governance,
      CONTRACT_ABIS.RendaGovernance,
      this.provider
    );

    try {
      const proposals: Proposal[] = [];
      let proposalId = 0;

      while (true) {
        try {
          const proposal = await contract.getProposal(proposalId);

          proposals.push({
            id: proposalId,
            title: proposal.title,
            description: proposal.description,
            proposer: proposal.proposer,
            startTime: Number(proposal.startTime) * 1000,
            endTime: Number(proposal.endTime) * 1000,
            forVotes: Number(ethers.formatEther(proposal.forVotes)),
            againstVotes: Number(ethers.formatEther(proposal.againstVotes)),
            quorum: Number(ethers.formatEther(proposal.quorum)),
            executed: proposal.executed,
            cancelled: proposal.cancelled,
            proposalType: Number(proposal.proposalType),
            executionData: proposal.executionData
          });

          proposalId++;
        } catch {
          break;
        }
      }

      return proposals;
    } catch {
      return [];
    }
  }

  async createProposal(
    title: string,
    description: string,
    proposalType: number,
    executionData: string
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.governance,
      CONTRACT_ABIS.RendaGovernance,
      this.signer
    );

    const tx = await contract.createProposal(title, description, proposalType, executionData);
    return tx.hash;
  }

  async castVote(proposalId: number, support: boolean, reason: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.governance,
      CONTRACT_ABIS.RendaGovernance,
      this.signer
    );

    const tx = await contract.castVote(proposalId, support, reason);
    return tx.hash;
  }

  async getVotingPower(address: string): Promise<number> {
    if (!this.provider) throw new Error('Provider not connected');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.governance,
      CONTRACT_ABIS.RendaGovernance,
      this.provider
    );

    try {
      const votingPower = await contract.getVotingPower(address);
      return Number(ethers.formatEther(votingPower));
    } catch {
      return 0;
    }
  }


  async approveHRM(spender: string, amount: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(
      this.networkConfig.contracts.hrmToken,
      CONTRACT_ABIS.HRMToken,
      this.signer
    );

    const tx = await contract.approve(spender, ethers.parseEther(amount));
    return tx.hash;
  }

  private getPropertyTypeName(type: number): string {
    const types = ['Residential', 'Commercial', 'Industrial', 'Mixed'];
    return types[type] || 'Unknown';
  }

  private getRiskLevelName(level: number): string {
    const levels = ['Low', 'Medium', 'High'];
    return levels[level] || 'Unknown';
  }

  private calculateRentalYield(totalValue: number): number {
    return 6.5 + (Math.random() * 4);
  }
}

export default BlockchainService;