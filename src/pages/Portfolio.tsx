import React, { useState, useEffect } from 'react';
import { Property } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAlert } from '@/hooks/useAlert';
import { useHRMBalance } from '@/hooks/useHRMBalance';
import { useWrappedHRMBalance } from '@/hooks/useWrappedHRMBalance';
import BlockchainService from '@/services/blockchainService';

interface PortfolioProperty extends Property {
  tokensOwned: number;
  investmentAmount: number;
  purchaseDate: number;
}

const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { wallet, isConnected } = useWallet();
  const { success, error, info } = useAlert();
  const { balance: hrmBalance, formattedBalance: hrmFormattedBalance, isLoading: hrmLoading } = useHRMBalance();
  const { balance: wHrmBalance, formattedBalance: wHrmFormattedBalance, isLoading: wHrmLoading } = useWrappedHRMBalance();

  useEffect(() => {
    loadPortfolio();
  }, [wallet.address, isConnected()]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);

      if (!isConnected() || !wallet.address) {
        setPortfolio([]);
        return;
      }

      // Create a basic provider for blockchain service
      const { ethers } = await import('ethers');
      const { getCurrentNetworkConfig } = await import('@/config/contracts');
      const networkConfig = getCurrentNetworkConfig();

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const blockchainService = new BlockchainService(provider);
      const portfolioProperties = await blockchainService.getInvestorPortfolio(wallet.address);

      setPortfolio(portfolioProperties as PortfolioProperty[]);

      if (portfolioProperties.length === 0) {
        info('Portfolio Empty', 'No investments found. Start investing in properties to build your portfolio!');
      }
    } catch (error) {
      error('Portfolio Load Failed', 'Failed to load portfolio from blockchain. Please check your connection.');
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  };

  const totalInvestment = portfolio.reduce((sum, item) => sum + item.investmentAmount, 0);
  const currentValue = portfolio.reduce((sum, item) => sum + (item.tokensOwned * item.tokenPrice), 0);
  const totalROI = totalInvestment > 0 ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0;
  const totalTokens = portfolio.reduce((sum, item) => sum + item.tokensOwned, 0);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getROIColor = (roi: number) => {
    return roi >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">My Portfolio</h1>
          <p className="text-gray-400 text-lg">
            Track your real estate investments and performance
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Portfolio Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">
                {hrmLoading ? '...' : hrmFormattedBalance}
              </div>
              <div className="text-gray-400">HRM Balance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {wHrmLoading ? '...' : wHrmFormattedBalance}
              </div>
              <div className="text-gray-400">wHRM Balance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {portfolio.length}
              </div>
              <div className="text-gray-400">Properties Owned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {totalTokens}
              </div>
              <div className="text-gray-400">Property Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                ${totalInvestment.toLocaleString()}
              </div>
              <div className="text-gray-400">Total Invested</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getROIColor(totalROI)}`}>
                {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
              </div>
              <div className="text-gray-400">Total ROI</div>
            </div>
          </div>
        </div>

        {/* Current Value Card */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-lg p-6 mb-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Current Portfolio Value</h3>
          <div className="text-4xl font-bold mb-2">${currentValue.toLocaleString()}</div>
          <div className={`text-lg ${getROIColor(totalROI)}`}>
            {totalROI >= 0 ? '▲' : '▼'} ${Math.abs(currentValue - totalInvestment).toLocaleString()}
            ({totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%)
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'high-performer', 'recent'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
                  selectedFilter === filter
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Items */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-semibold mb-2">Loading Portfolio</h3>
              <p className="text-gray-400">Fetching your investments from smart contracts...</p>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400">Connect your wallet to view your portfolio</p>
            </div>
          ) : portfolio.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-2">No Investments Yet</h3>
              <p className="text-gray-400">Start investing in properties to build your portfolio</p>
            </div>
          ) : (
            portfolio.map((item) => {
              const currentItemValue = item.tokensOwned * item.tokenPrice;
              const itemROI = item.investmentAmount > 0 ? ((currentItemValue - item.investmentAmount) / item.investmentAmount) * 100 : 0;

              return (
                <div key={item.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Property Image */}
                    <div className="flex-shrink-0">
                      <div className="relative w-full lg:w-64 h-48 rounded-lg overflow-hidden">
                        <img
                          src={item.images[0] || `https://images.unsplash.com/photo-${1545324418 + item.id}-cc1a3fa10c00?w=800`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                          <p className="text-gray-400 mb-2">📍 {item.location}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-300">
                            <span>🏠 {item.propertyType}</span>
                            <span>💰 ${item.tokenPrice.toLocaleString()} per token</span>
                            <span className={`font-semibold ${getRiskColor(item.riskLevel.toLowerCase())}`}>
                              Risk: {item.riskLevel.toUpperCase()}
                            </span>
                            {item.isVerified && <span className="text-green-400">✓ Verified</span>}
                          </div>
                        </div>
                      </div>

                      {/* Investment Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-400">Tokens Owned</div>
                          <div className="font-semibold">{item.tokensOwned.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Investment</div>
                          <div className="font-semibold">${item.investmentAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Current Value</div>
                          <div className="font-semibold">${currentItemValue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">ROI</div>
                          <div className={`font-semibold ${getROIColor(itemROI)}`}>
                            {itemROI >= 0 ? '+' : ''}{itemROI.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>Performance vs Investment</span>
                          <span className={getROIColor(itemROI)}>
                            {itemROI >= 0 ? '+' : ''}${(currentItemValue - item.investmentAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              itemROI >= 0 ? 'bg-green-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(Math.abs(itemROI) * 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Purchase Date */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
                        </span>
                        <div className="flex space-x-3">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-200">
                            View Details
                          </button>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200">
                            Buy More
                          </button>
                          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors duration-200">
                            Sell Tokens
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Reinvest Earnings</h3>
            <p className="text-gray-400 mb-4">
              Use your returns to purchase more property tokens
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors duration-200">
              Reinvest Now
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Portfolio Analytics</h3>
            <p className="text-gray-400 mb-4">
              Get detailed insights into your investment performance
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors duration-200">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;