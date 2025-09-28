'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useAlertContext } from '@/components/AlertProvider';
import { useHRMBalance } from '@/hooks/useHRMBalance';

const HashPackFaucet: React.FC = () => {
  const { wallet, isConnected, sendContractTransaction } = useWallet();
  const { success, error, warning } = useAlertContext();
  const { refresh: refreshHRMBalance } = useHRMBalance();
  const [isLoading, setIsLoading] = useState(false);

  const contractAddress = import.meta.env.VITE_HRM_TOKEN_TESTNET;


  const handleMint = async () => {

    if (!isConnected() && !wallet.isConnected) {
      warning('Not Connected', 'Please connect your HashPack wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const contractId = import.meta.env.VITE_HRM_TOKEN_HTS_TESTNET;


      const txId = await sendContractTransaction(contractId, 'publicMint');

      if (txId && txId !== 'SUCCESS') {
        success(
          '🎉 Tokens Minted Successfully!',
          `5,000 HRM tokens sent to your wallet! Transaction ID: ${txId}`
        );
      } else {
        success(
          '🎉 Tokens Minted Successfully!',
          '5,000 HRM tokens have been sent to your wallet!'
        );
      }

      // Refresh HRM balance after successful minting
      setTimeout(() => {
        refreshHRMBalance();
      }, 3000); // Wait 3 seconds for transaction to settle
    } catch (err: any) {

      // Check for different types of errors
      const errorMessage = err.message || err.toString() || 'Unknown error occurred';

      if (errorMessage.includes('User rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
        warning(
          '🚫 Transaction Cancelled',
          'You cancelled the transaction in your HashPack wallet'
        );
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
        error(
          '💰 Insufficient Balance',
          'You need HBAR in your wallet to pay for transaction fees'
        );
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        error(
          '🌐 Network Error',
          'Please check your internet connection and try again'
        );
      } else if (errorMessage.includes('not connected') || errorMessage.includes('missing')) {
        warning(
          '🔗 Wallet Not Connected',
          'Please connect your HashPack wallet and try again'
        );
      } else {
        error(
          '❌ Mint Failed',
          errorMessage.length > 100 ? 'Transaction failed. Please try again.' : errorMessage
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mint Section */}
      {!isConnected() && !wallet.isConnected ? (
        <div className="mb-6 p-4 bg-yellow-900 bg-opacity-50 rounded-lg border border-yellow-600">
          <h3 className="text-xl font-bold text-yellow-100 mb-4">⚠️ Wallet Required</h3>
          <p className="text-yellow-200 text-center">
            Please connect your HashPack wallet using the "Connect HashPack" button in the top right corner to mint tokens.
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-900 bg-opacity-50 rounded-lg border border-green-600">
          <h3 className="text-xl font-bold text-green-100 mb-4">⚡ Mint HRM Tokens</h3>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-white mb-2">5,000 HRM</div>
            <div className="text-sm text-green-200">Free testnet tokens</div>
          </div>

          <button
            onClick={handleMint}
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
              !isLoading
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Minting...' : 'MINT 5,000 HRM'}
          </button>
        </div>
      )}
    </div>
  );
};

export default HashPackFaucet;