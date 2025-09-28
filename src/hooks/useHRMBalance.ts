import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

export interface HRMBalanceData {
  balance: string;
  formattedBalance: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useHRMBalance = (): HRMBalanceData => {
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
      const hrmTokenAddress = import.meta.env.VITE_HRM_TOKEN_TESTNET;
      const mirrorNodeUrl = import.meta.env.VITE_HEDERA_MIRROR_NODE_URL;

      if (!hrmTokenAddress || !mirrorNodeUrl) {
        throw new Error('HRM token address or mirror node URL not configured');
      }


      let evmAddress = wallet.address;

      if (wallet.address.startsWith('0.0.')) {
        try {
          const accountResponse = await fetch(`${mirrorNodeUrl}/accounts/${wallet.address}`);
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            evmAddress = accountData.evm_address;
          }
        } catch (err) {
        }
      }




      const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];


      const contract = new ethers.Contract(hrmTokenAddress, erc20Abi, provider);

      try {
        const balance = await contract.balanceOf(evmAddress);

        const decimals = await contract.decimals();


        const formattedBalance = ethers.formatUnits(balance, decimals);

        setBalance(formattedBalance);

      } catch (contractError) {

        try {
          const symbol = await contract.symbol();
          setBalance('0');
        } catch (symbolError) {
          throw new Error('Invalid ERC20 contract address');
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
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