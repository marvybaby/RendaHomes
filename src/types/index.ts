export interface Property {
  id: number;
  title: string;
  description: string;
  location: string;
  totalValue: number;
  tokenPrice: number;
  totalTokens: number;
  availableTokens: number;
  images: string[];
  propertyType: string;
  riskLevel: string;
  isActive: boolean;
  isVerified: boolean;
  rentalYield: number;
  propertyOwner: string;
  createdAt: number;
  tags: string[];
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  startTime: number;
  endTime: number;
  forVotes: number;
  againstVotes: number;
  quorum: number;
  executed: boolean;
  cancelled: boolean;
  proposalType: number;
  executionData: string;
}

export interface DisasterLog {
  id: number;
  propertyId: number;
  disasterType: number;
  severity: number;
  status: number;
  description: string;
  location: string;
  estimatedDamage: number;
  actualDamage: number;
  insuranceClaim: number;
  insurancePayout: number;
  reporter: string;
  investigator: string;
  reportedAt: number;
  verifiedAt: number;
  resolvedAt: number;
  evidenceUris: string[];
  resolutionNotes: string;
}

export interface SellOrder {
  id: number;
  propertyId: number;
  seller: string;
  tokensForSale: number;
  pricePerToken: number;
  totalPrice: number;
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface NetworkConfig {
  networkId: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    hrmToken: string;
    wrappedHRM: string;
    propertyToken: string;
    realEstatePool: string;
    governance: string;
    disasterManagement: string;
  };
}

export interface PropertyCardProps {
  property: Property;
  showInvestButton?: boolean;
  compact?: boolean;
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  balance?: number;
  chainId?: number;
  walletType?: 'hashpack' | 'blade';
  network?: 'testnet' | 'mainnet';
}