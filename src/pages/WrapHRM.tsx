import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useAlertContext } from '@/components/AlertProvider';
import { useHRMBalance } from '@/hooks/useHRMBalance';
import { useWrappedHRMBalance } from '@/hooks/useWrappedHRMBalance';
import { getCurrentNetworkConfig } from '@/config/contracts';

const WrapHRMPage: React.FC = () => {
  const { wallet, sendContractTransaction } = useWallet();
  const { success, error, warning } = useAlertContext();
  const { balance: hrmBalance, refresh: refreshHRM } = useHRMBalance();
  const { balance: wHrmBalance, refresh: refreshWHRM } = useWrappedHRMBalance();
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const networkConfig = getCurrentNetworkConfig();


  const handleWrap = async () => {

    if (!wallet?.isConnected || !wallet?.address) {
      warning('Wallet Required', 'Please connect your wallet to wrap/unwrap HRM tokens');
      return;
    }

    setIsLoading(true);
    try {
      const hrmContractId = import.meta.env.VITE_HRM_TOKEN_HTS_TESTNET;
      const whrmContractId = import.meta.env.VITE_WRAPPED_HRM_HTS_TESTNET;
      const whrmEvmAddress = import.meta.env.VITE_WRAPPED_HRM_TESTNET;


      if (!hrmContractId || !whrmContractId || !whrmEvmAddress) {
        throw new Error(`Missing contract configuration: HRM=${hrmContractId}, wHRM=${whrmContractId}, wHRM_EVM=${whrmEvmAddress}`);
      }

      const amountNumber = parseFloat(amount);
      const amountWei = (BigInt(Math.floor(amountNumber * 1e18))).toString();


      const approveCall = `approve(${whrmEvmAddress},${amountWei})`;

      try {
        const approveTxId = await sendContractTransaction(hrmContractId, approveCall);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (approveError) {
        throw new Error(`Approval transaction failed: ${approveError.message}`);
      }

      const wrapCall = `wrap(${amountWei})`;

      const txId = await sendContractTransaction(whrmContractId, wrapCall);
      
      success('Wrap Successful!', `Successfully wrapped ${amount} HRM to wHRM. Transaction ID: ${txId}`);
      setAmount('');

      setTimeout(() => {
        refreshHRM(); // Refresh HRM balance using hook
        refreshWHRM(); // Refresh wHRM balance using hook
        const refreshWHRM = async () => {
          if (!wallet?.address) return;
          try {
            const { ethers } = await import('ethers');
            const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
            const hederaAccountId = wallet.address.replace('0.0.', '');
            const accountNumber = parseInt(hederaAccountId);
            const evmAddress = '0x' + accountNumber.toString(16).padStart(40, '0');
            const whrmContractAddress = import.meta.env.VITE_WRAPPED_HRM_TESTNET;
            const erc20Abi = ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'];
            const contract = new ethers.Contract(whrmContractAddress, erc20Abi, provider);
            const balance = await contract.balanceOf(evmAddress);
            const decimals = await contract.decimals();
            const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
            setWhrmBalance(formattedBalance);
          } catch (error) {
          }
        };
        refreshWHRM();
      }, 2000); // Wait 2 seconds for transaction to settle
      
    } catch (err) {
      error('Wrap Failed', `Unable to wrap tokens: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnwrap = async () => {
    if (!wallet?.isConnected || !wallet?.address) {
      warning('Wallet Required', 'Please connect your wallet to wrap/unwrap HRM tokens');
      return;
    }

    setIsLoading(true);
    try {
      const whrmContractId = import.meta.env.VITE_WRAPPED_HRM_HTS_TESTNET;

      if (!whrmContractId) {
        throw new Error('WrappedHRM contract ID not configured in environment variables');
      }

      const amountNumber = parseFloat(amount);
      const amountWei = (BigInt(Math.floor(amountNumber * 1e18))).toString();
      const functionCall = `unwrap(${amountWei})`;


      // Send transaction through wallet
      const txId = await sendContractTransaction(whrmContractId, functionCall);
      
      success('Unwrap Successful!', `Successfully unwrapped ${amount} wHRM to HRM. Transaction ID: ${txId}`);
      setAmount('');

      setTimeout(() => {
        refreshHRM(); // Refresh HRM balance using hook
        refreshWHRM(); // Refresh wHRM balance using hook
        const refreshWHRM = async () => {
          if (!wallet?.address) return;
          try {
            const { ethers } = await import('ethers');
            const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
            const hederaAccountId = wallet.address.replace('0.0.', '');
            const accountNumber = parseInt(hederaAccountId);
            const evmAddress = '0x' + accountNumber.toString(16).padStart(40, '0');
            const whrmContractAddress = import.meta.env.VITE_WRAPPED_HRM_TESTNET;
            const erc20Abi = ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'];
            const contract = new ethers.Contract(whrmContractAddress, erc20Abi, provider);
            const balance = await contract.balanceOf(evmAddress);
            const decimals = await contract.decimals();
            const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
            setWhrmBalance(formattedBalance);
          } catch (error) {
          }
        };
        refreshWHRM();
      }, 2000); // Wait 2 seconds for transaction to settle
      
    } catch (err) {
      error('Unwrap Failed', 'Unable to unwrap tokens. Please try again or check your balance.');
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    const maxAmount = activeTab === 'wrap' ? parseFloat(hrmBalance) : parseFloat(wHrmBalance);
    setAmount(maxAmount.toString());
  };

  const canPerformAction = () => {
    const numAmount = parseFloat(amount);
    const maxAmount = activeTab === 'wrap' ? parseFloat(hrmBalance) : parseFloat(wHrmBalance);
    return numAmount > 0 && numAmount <= maxAmount && !isLoading && wallet?.isConnected;
  };

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Wrap HRM Tokens</h1>
          <p className="text-gray-400 text-lg">
            Convert HRM tokens to wHRM for DeFi compatibility
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold">R</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">HRM Token</h3>
                <p className="text-gray-400">Native platform token</p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">{parseFloat(hrmBalance).toFixed(2)} HRM</div>
            <p className="text-gray-400 text-sm">
              Used for governance, staking, and property investments
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold">W</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">wHRM Token</h3>
                <p className="text-gray-400">Wrapped HRM token</p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">{parseFloat(wHrmBalance).toFixed(2)} wHRM</div>
            <p className="text-gray-400 text-sm">
              ERC-20 compatible for DeFi protocols and trading
            </p>
          </div>
        </div>

        {/* Main Wrapping Interface */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          {/* Tab Selector */}
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('wrap')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'wrap'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Wrap HRM → wHRM
            </button>
            <button
              onClick={() => setActiveTab('unwrap')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'unwrap'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Unwrap wHRM → HRM
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount to {activeTab}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white text-xl focus:outline-none focus:ring-2 focus:ring-red-500 pr-20"
              />
              <button
                onClick={setMaxAmount}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
              <span>
                Available: {activeTab === 'wrap' ? parseFloat(hrmBalance).toFixed(2) : parseFloat(wHrmBalance).toFixed(2)}{' '}
                {activeTab === 'wrap' ? 'HRM' : 'wHRM'}
              </span>
              <span>Exchange Rate: 1:1</span>
            </div>
          </div>

          {/* Conversion Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    activeTab === 'wrap' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    <span className="text-sm font-bold">
                      {activeTab === 'wrap' ? 'R' : 'W'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{amount} {activeTab === 'wrap' ? 'HRM' : 'wHRM'}</div>
                    <div className="text-gray-400 text-sm">You pay</div>
                  </div>
                </div>

                <div className="text-2xl text-gray-500">→</div>

                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    activeTab === 'wrap' ? 'bg-blue-600' : 'bg-red-600'
                  }`}>
                    <span className="text-sm font-bold">
                      {activeTab === 'wrap' ? 'W' : 'R'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{amount} {activeTab === 'wrap' ? 'wHRM' : 'HRM'}</div>
                    <div className="text-gray-400 text-sm">You receive</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={activeTab === 'wrap' ? handleWrap : handleUnwrap}
            disabled={!canPerformAction()}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
              canPerformAction()
                ? activeTab === 'wrap'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading
              ? 'Processing...'
              : `${activeTab === 'wrap' ? 'Wrap' : 'Unwrap'} ${activeTab === 'wrap' ? 'HRM' : 'wHRM'}`
            }
          </button>
        </div>

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Why Wrap HRM?</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">✓</span>
                <span>Make HRM compatible with ERC-20 standard</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">✓</span>
                <span>Use in DeFi protocols and DEXs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">✓</span>
                <span>Provide liquidity on external platforms</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">✓</span>
                <span>Trade on external exchanges</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Key Features</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">⚡</span>
                <span>Instant 1:1 conversion</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">🔒</span>
                <span>Fully collateralized and secure</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">💰</span>
                <span>No fees for wrapping/unwrapping</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">🔄</span>
                <span>Reversible at any time</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Recent Transactions</h3>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📜</div>
            <h4 className="text-lg font-semibold mb-2">No Transactions Yet</h4>
            <p className="text-gray-400">
              Your wrap/unwrap transactions will appear here
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Learn more about wrapping and unwrapping tokens, or get support from our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Read Documentation
            </button>
            <button className="border border-white text-white hover:bg-white hover:text-purple-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Join Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrapHRMPage;