import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

export interface WrappedHRMBalanceData {
  balance: string;
  formattedBalance: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useWrappedHRMBalance = (): WrappedHRMBalanceData => {
  const { wallet, isConnected } = useWallet();
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!isConnected() || !wallet.address) {
      setBalance('0');
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get WrappedHRM token contract address (ERC20) from environment
      const wrappedHrmTokenAddress = import.meta.env.VITE_WRAPPED_HRM_TESTNET;
      const mirrorNodeUrl = import.meta.env.VITE_HEDERA_MIRROR_NODE_URL;

      if (!wrappedHrmTokenAddress || !mirrorNodeUrl) {
        throw new Error('WrappedHRM token address or mirror node URL not configured');
      }

      // For ERC20 tokens, we need to query the contract directly
      // First convert wallet address to EVM format if needed
      let evmAddress = wallet.address;

      // If wallet address is in Hedera format (0.0.x), get the EVM address
      if (wallet.address.startsWith('0.0.')) {
        try {
          const accountResponse = await fetch(`${mirrorNodeUrl}/accounts/${wallet.address}`);
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            evmAddress = accountData.evm_address;
          }
        } catch (err) {
          // Could not get EVM address, will use Hedera format
        }
      }

      // Create provider for Hedera testnet
      const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

      // ERC20 ABI for balanceOf function
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];

      // Create contract instance
      const contract = new ethers.Contract(wrappedHrmTokenAddress, erc20Abi, provider);

      try {
        // Call balanceOf function
        const balance = await contract.balanceOf(evmAddress);

        // Get decimals
        const decimals = await contract.decimals();

        // Convert from wei to tokens
        const formattedBalance = ethers.formatUnits(balance, decimals);

        setBalance(formattedBalance);

      } catch (contractError) {

        // Fallback: try to get symbol to verify contract exists
        try {
          const symbol = await contract.symbol();
          setBalance('0');
        } catch (symbolError) {
          throw new Error('Invalid WrappedHRM contract address');
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch WrappedHRM balance');
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [wallet.address, isConnected()]);

  useEffect(() => {
    if (!isConnected()) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected(), wallet.address]);

  const formattedBalance = parseFloat(balance).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refresh: fetchBalance
  };
};