'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashPackService } from '@/services/hashpackService';
import { WalletState } from '@/types';
import { useAlertContext } from '@/components/AlertProvider';

interface WalletContextType {
  wallet: WalletState;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  sendContractTransaction: (contractId: string, functionData: string) => Promise<string>;
  getAccountId: () => string | null;
  isConnected: () => boolean;
  provider: any;
  account: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [hashpackService] = useState(() => new HashPackService());
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useAlertContext();

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Check if already connected
    if (hashpackService.isConnected()) {
      const accountId = hashpackService.getAccountId();
      setWallet({
        isConnected: true,
        address: accountId || undefined,
        walletType: 'hashpack',
        network: 'testnet'
      });
    }
  }, [hashpackService]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const connectionData = await hashpackService.connect();

      setWallet({
        isConnected: true,
        address: connectionData.accountId,
        walletType: 'hashpack',
        network: connectionData.network as 'testnet' | 'mainnet'
      });

      success('Connected!', `Connected to HashPack: ${connectionData.accountId}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to HashPack';
      setError(errorMessage);
      showError('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await hashpackService.disconnect();
      setWallet({ isConnected: false });
      setError(null);
      success('Disconnected', 'Disconnected from HashPack');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to disconnect';
      setError(errorMessage);
      showError('Disconnect Failed', errorMessage);
    }
  };

  const sendContractTransaction = async (contractId: string, functionData: string): Promise<string> => {
    try {
      setError(null);
      const txId = await hashpackService.sendContractTransaction(contractId, functionData);
      success('Transaction Successful!', `Transaction completed with ID: ${txId}`);
      return txId;
    } catch (err: any) {
      const errorMessage = err.message || 'Transaction failed';
      setError(errorMessage);
      showError('Transaction Failed', errorMessage);
      throw err;
    }
  };

  const getAccountId = (): string | null => {
    return hashpackService.getAccountId();
  };

  const isConnected = (): boolean => {
    return hashpackService.isConnected();
  };

  const value: WalletContextType = {
    wallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    sendContractTransaction,
    getAccountId,
    isConnected,
    provider: null,
    account: wallet.address || null,
  };

  // Prevent hydration mismatch during initial render
  if (!isMounted) {
    return (
      <WalletContext.Provider value={{
        wallet: { isConnected: false },
        isConnecting: false,
        error: null,
        connectWallet: async () => {},
        disconnectWallet: async () => {},
        sendContractTransaction: async () => '',
        getAccountId: () => null,
        isConnected: () => false,
        provider: null,
        account: null,
      }}>
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};