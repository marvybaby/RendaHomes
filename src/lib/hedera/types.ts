// Re-export types from main types file
export * from '@/types';

// Additional Hedera-specific types
export interface HederaConfig {
  networkType: 'testnet' | 'mainnet';
  operatorId?: string;
  operatorKey?: string;
}

export interface TransactionResult {
  transactionId: string;
  status: string;
}

export interface ContractCall {
  contractId: string;
  functionName: string;
  parameters?: any[];
}