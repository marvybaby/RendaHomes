// Contract configuration for different networks
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

export const NETWORK_CONFIGS: { [key: string]: NetworkConfig } = {
  testnet: {
    networkId: '296',
    name: 'Hedera Testnet',
    rpcUrl: 'https://testnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/testnet',
    contracts: {
      // These will be populated after deployment
      hrmToken: import.meta.env.VITE_HRM_TOKEN_TESTNET || '',
      wrappedHRM: import.meta.env.VITE_WRAPPED_HRM_TESTNET || '',
      propertyToken: import.meta.env.VITE_PROPERTY_TOKEN_TESTNET || '',
      realEstatePool: import.meta.env.VITE_POOL_CONTRACT_TESTNET || '',
      governance: import.meta.env.VITE_GOVERNANCE_CONTRACT_TESTNET || '',
      disasterManagement: import.meta.env.VITE_DISASTER_MANAGEMENT_TESTNET || ''
    }
  },
  mainnet: {
    networkId: '295',
    name: 'Hedera Mainnet',
    rpcUrl: 'https://mainnet-public.mirrornode.hedera.com/api/v1',
    explorerUrl: 'https://hashscan.io/mainnet',
    contracts: {
      hrmToken: import.meta.env.VITE_HRM_TOKEN_MAINNET || '',
      wrappedHRM: import.meta.env.VITE_WRAPPED_HRM_MAINNET || '',
      propertyToken: import.meta.env.VITE_PROPERTY_TOKEN_MAINNET || '',
      realEstatePool: import.meta.env.VITE_POOL_CONTRACT_MAINNET || '',
      governance: import.meta.env.VITE_GOVERNANCE_CONTRACT_MAINNET || '',
      disasterManagement: import.meta.env.VITE_DISASTER_MANAGEMENT_MAINNET || ''
    }
  }
};

// Default network (from environment or fallback to testnet)
export const DEFAULT_NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'testnet';

// Get current network configuration
export const getCurrentNetworkConfig = (): NetworkConfig => {
  return NETWORK_CONFIGS[DEFAULT_NETWORK] || NETWORK_CONFIGS.testnet;
};

// Contract ABIs (simplified versions for key functions)
export const CONTRACT_ABIS = {
  HRMToken: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function mint(address to, uint256 amount)',
    'function addToWhitelist(address account)',
    'function removeFromWhitelist(address account)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],
  
  PropertyToken: [
    'function listProperty(string metadataURI, uint256 totalValue, uint256 totalTokens, uint8 propertyType, uint8 riskLevel) returns (uint256)',
    'function purchaseTokens(uint256 propertyId, uint256 tokens)',
    'function getProperty(uint256 propertyId) view returns (tuple(uint256 id, string metadataURI, uint256 totalValue, uint256 totalTokens, uint256 availableTokens, uint256 tokenPrice, address propertyOwner, bool isActive, bool isVerified, uint256 createdAt, uint8 propertyType, uint8 riskLevel))',
    'function getInvestment(uint256 propertyId, address investor) view returns (tuple(address investor, uint256 tokensOwned, uint256 investmentAmount, uint256 purchaseDate))',
    'function getInvestorPortfolio(address investor) view returns (tuple(uint256[] propertyIds, uint256 totalInvestment, uint256 totalTokens))',
    'function getPlatformStats() view returns (tuple(uint256 totalProperties, uint256 totalInvestors, uint256 totalValueLocked, uint256 totalTokens))',
    'function verifyProperty(uint256 propertyId)',
    'function distributeRentalIncome(uint256 propertyId, uint256 totalIncome)',
    'function createSellOrder(uint256 propertyId, uint256 tokensForSale, uint256 pricePerToken, uint256 durationDays) returns (uint256)',
    'function buyFromOrder(uint256 orderId, uint256 tokensToBuy)',
    'function cancelSellOrder(uint256 orderId)',
    'function getActiveSellOrders(uint256 propertyId) view returns (tuple(uint256 id, uint256 propertyId, address seller, uint256 tokensForSale, uint256 pricePerToken, uint256 totalPrice, bool isActive, uint256 createdAt, uint256 expiresAt)[])',
    'event PropertyListed(uint256 indexed propertyId, address indexed owner, uint256 totalValue, uint256 tokenPrice)',
    'event TokensPurchased(uint256 indexed propertyId, address indexed investor, uint256 tokens, uint256 amount)',
    'event PropertyVerified(uint256 indexed propertyId)',
    'event RentalIncomeDistributed(uint256 indexed propertyId, uint256 totalAmount)',
    'event SellOrderCreated(uint256 indexed orderId, uint256 indexed propertyId, address indexed seller, uint256 tokensForSale, uint256 pricePerToken)',
    'event SellOrderFulfilled(uint256 indexed orderId, address indexed buyer, uint256 tokensBought, uint256 totalPrice)',
    'event SellOrderCancelled(uint256 indexed orderId)'
  ],
  
  RealEstatePool: [
    'function createPool(string name, string description, uint256 minInvestment, uint256 maxInvestment, uint8 riskLevel) returns (uint256)',
    'function addPropertyToPool(uint256 poolId, uint256 propertyId)',
    'function investInPool(uint256 poolId, uint256 amount)',
    'function getPool(uint256 poolId) view returns (tuple(uint256 id, string name, string description, uint256[] propertyIds, uint256 totalValue, uint256 totalInvested, uint256 minInvestment, uint256 maxInvestment, bool isActive, uint256 createdAt, uint8 riskLevel))',
    'function getInvestorPoolInvestment(uint256 poolId, address investor) view returns (tuple(uint256 poolId, address investor, uint256 amount, uint256 shares, uint256 timestamp))',
    'function distributePoolReturns(uint256 poolId, uint256 totalReturns)',
    'event PoolCreated(uint256 indexed poolId, string name, uint256 minInvestment, uint8 riskLevel)',
    'event PoolInvestmentMade(uint256 indexed poolId, address indexed investor, uint256 amount, uint256 shares)',
    'event PoolReturnsDistributed(uint256 indexed poolId, uint256 totalReturns, uint256 investorCount)'
  ],
  
  RendaGovernance: [
    'function createProposal(string title, string description, uint8 proposalType, bytes executionData) returns (uint256)',
    'function castVote(uint256 proposalId, bool support, string reason)',
    'function executeProposal(uint256 proposalId)',
    'function getProposal(uint256 proposalId) view returns (tuple(uint256 id, string title, string description, address proposer, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 quorum, bool executed, bool cancelled, uint8 proposalType, bytes executionData))',
    'function getProposalState(uint256 proposalId) view returns (uint8)',
    'function getVotingPower(address account) view returns (uint256)',
    'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint8 proposalType)',
    'event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 votes, string reason)',
    'event ProposalExecuted(uint256 indexed proposalId)'
  ]
  ,

  WrappedHRM: [
    'function wrapHRM(uint256 amount)',
    'function unwrapHRM(uint256 amount)', 
    'function getHRMBalance(address account) view returns (uint256)',
    'function getWrappedHRMBalance(address account) view returns (uint256)',
    'function getTotalLocked() view returns (uint256)',
    'function getExchangeRate() view returns (uint256)',
    'function canWrap(address account, uint256 amount) view returns (bool)',
    'function canUnwrap(address account, uint256 amount) view returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'event Wrapped(address indexed user, uint256 amount)',
    'event Unwrapped(address indexed user, uint256 amount)'
  ],

  DisasterManagement: [
    'function reportDisaster(uint256 propertyId, uint8 disasterType, uint8 severity, string description, string location, uint256 estimatedDamage, string[] evidenceUris) returns (uint256)',
    'function updateDisasterStatus(uint256 disasterId, uint8 newStatus, string notes)',
    'function getDisasterLog(uint256 disasterId) view returns (tuple(uint256 id, uint256 propertyId, uint8 disasterType, uint8 severity, uint8 status, string description, string location, uint256 estimatedDamage, uint256 actualDamage, uint256 insuranceClaim, uint256 insurancePayout, address reporter, address investigator, uint256 reportedAt, uint256 verifiedAt, uint256 resolvedAt, string[] evidenceUris, string resolutionNotes))',
    'function getPropertyDisasterLogs(uint256 propertyId) view returns (uint256[])',
    'function getDisasterStatistics() view returns (uint256 totalDisasters, uint256 totalDamage, uint256 totalPayouts, uint256 pendingClaims, uint256 resolvedCases)',
    'function getDisastersByStatus(uint8 status) view returns (uint256[])',
    'function getDisastersByType(uint8 disasterType) view returns (uint256[])',
    'function addInsurancePolicy(uint256 propertyId, string provider, string policyNumber, uint256 coverageAmount, uint256 deductible, uint256 premiumPaid, uint256 expiresAt, uint8[] coveredTypes)',
    'function getInsurancePolicy(uint256 propertyId) view returns (tuple(uint256 propertyId, string provider, string policyNumber, uint256 coverageAmount, uint256 deductible, uint256 premiumPaid, uint256 expiresAt, bool isActive, uint8[] coveredTypes))',
    'event DisasterReported(uint256 indexed disasterId, uint256 indexed propertyId, uint8 disasterType, uint8 severity, address reporter)',
    'event DisasterStatusUpdated(uint256 indexed disasterId, uint8 oldStatus, uint8 newStatus, address updatedBy)',
    'event InsuranceClaimFiled(uint256 indexed disasterId, uint256 claimAmount)',
    'event InsurancePayoutProcessed(uint256 indexed disasterId, uint256 payoutAmount)'
  ]
};

// Contract function signatures for easier interaction
export const FUNCTION_SIGNATURES = {
  // HRM Token functions
  TRANSFER: 'transfer(address,uint256)',
  APPROVE: 'approve(address,uint256)',
  BALANCE_OF: 'balanceOf(address)',
  
  // Property Token functions
  LIST_PROPERTY: 'listProperty(string,uint256,uint256,uint8,uint8)',
  PURCHASE_TOKENS: 'purchaseTokens(uint256,uint256)',
  GET_PROPERTY: 'getProperty(uint256)',
  VERIFY_PROPERTY: 'verifyProperty(uint256)',
  
  // Pool functions
  CREATE_POOL: 'createPool(string,string,uint256,uint256,uint8)',
  INVEST_IN_POOL: 'investInPool(uint256,uint256)',
  
  // Governance functions
  CREATE_PROPOSAL: 'createProposal(string,string,uint8,bytes)',
  CAST_VOTE: 'castVote(uint256,bool,string)',
  
  // Wrapped HRM functions
  WRAP_HRM: 'wrapHRM(uint256)',
  UNWRAP_HRM: 'unwrapHRM(uint256)',
  GET_HRM_BALANCE: 'getHRMBalance(address)',
  GET_WRAPPED_HRM_BALANCE: 'getWrappedHRMBalance(address)',
  
  // Marketplace functions
  CREATE_SELL_ORDER: 'createSellOrder(uint256,uint256,uint256,uint256)',
  BUY_FROM_ORDER: 'buyFromOrder(uint256,uint256)',
  CANCEL_SELL_ORDER: 'cancelSellOrder(uint256)',
  GET_ACTIVE_SELL_ORDERS: 'getActiveSellOrders(uint256)',
  
  // Enhanced query functions
  GET_ALL_PROPERTIES: 'getAllProperties(uint256,uint256)',
  GET_INVESTOR_PORTFOLIO: 'getInvestorPortfolio(address)',
  GET_PLATFORM_STATS: 'getPlatformStats()',
  
  // Disaster management functions
  REPORT_DISASTER: 'reportDisaster(uint256,uint8,uint8,string,string,uint256,string[])',
  UPDATE_DISASTER_STATUS: 'updateDisasterStatus(uint256,uint8,string)',
  GET_DISASTER_LOG: 'getDisasterLog(uint256)',
  GET_PROPERTY_DISASTER_LOGS: 'getPropertyDisasterLogs(uint256)',
  GET_DISASTER_STATISTICS: 'getDisasterStatistics()'
};

// Event topics for filtering
export const EVENT_TOPICS = {
  PROPERTY_LISTED: '0x...',
  TOKENS_PURCHASED: '0x...',
  POOL_CREATED: '0x...',
  PROPOSAL_CREATED: '0x...',
  VOTE_CAST: '0x...'
};

// Gas limits for different operations
export const GAS_LIMITS = {
  TRANSFER: 100_000,
  APPROVE: 100_000,
  LIST_PROPERTY: 500_000,
  PURCHASE_TOKENS: 300_000,
  CREATE_POOL: 400_000,
  INVEST_IN_POOL: 200_000,
  CREATE_PROPOSAL: 300_000,
  CAST_VOTE: 150_000,
  VERIFY_PROPERTY: 100_000,
  WRAP_HRM: 150_000,
  UNWRAP_HRM: 150_000,
  CREATE_SELL_ORDER: 200_000,
  BUY_FROM_ORDER: 300_000,
  CANCEL_SELL_ORDER: 100_000,
  REPORT_DISASTER: 250_000,
  UPDATE_DISASTER_STATUS: 100_000,
  ADD_INSURANCE_POLICY: 200_000
};

// Platform constants
export const PLATFORM_CONSTANTS = {
  MIN_INVESTMENT: 100, // 100 HRM tokens
  PLATFORM_FEE_PERCENT: 250, // 2.5%
  VOTING_PERIOD: 7 * 24 * 60 * 60, // 7 days in seconds
  VOTING_DELAY: 24 * 60 * 60, // 1 day in seconds
  PROPOSAL_THRESHOLD: 10000, // 10,000 HRM tokens to create proposal
  QUORUM_PERCENTAGE: 10 // 10% of total supply
};

// Helper function to get contract address
export const getContractAddress = (contractName: keyof NetworkConfig['contracts'], network?: string): string => {
  const targetNetwork = network || DEFAULT_NETWORK;
  const config = NETWORK_CONFIGS[targetNetwork];
  return config?.contracts[contractName] || '';
};

// Helper function to validate contract addresses
export const validateContractAddresses = (network: string = DEFAULT_NETWORK): boolean => {
  const config = NETWORK_CONFIGS[network];
  if (!config) return false;
  
  const { contracts } = config;
  return !!(contracts.hrmToken && contracts.propertyToken && contracts.realEstatePool && contracts.governance);
};

export default {
  NETWORK_CONFIGS,
  DEFAULT_NETWORK,
  getCurrentNetworkConfig,
  CONTRACT_ABIS,
  FUNCTION_SIGNATURES,
  EVENT_TOPICS,
  GAS_LIMITS,
  PLATFORM_CONSTANTS,
  getContractAddress,
  validateContractAddresses
};