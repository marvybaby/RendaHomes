import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Property } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAlertContext } from '@/components/AlertProvider';
import BlockchainService from '@/services/blockchainService';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { wallet, provider } = useWallet();
  const { success, error, warning } = useAlertContext();
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-600' : 'bg-gray-600';
  };

  const availabilityPercentage = property.totalTokens > 0
    ? ((property.totalTokens - property.availableTokens) / property.totalTokens) * 100
    : 0;

  const handleInvestClick = () => {
    if (!wallet.isConnected) {
      warning('Wallet Required', 'Please connect your wallet to invest in properties');
      return;
    }
    setShowInvestModal(true);
  };

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      error('Invalid Amount', 'Please enter a valid investment amount greater than 0');
      return;
    }

    const tokenAmount = Math.floor(parseFloat(investAmount) / property.tokenPrice);
    if (tokenAmount > property.availableTokens) {
      error('Insufficient Tokens', `Only ${property.availableTokens} tokens are available for this property`);
      return;
    }

    if (!wallet.isConnected) {
      error('Wallet Required', 'Please connect your wallet to invest');
      return;
    }

    setIsInvesting(true);
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      const blockchainService = new BlockchainService(provider, await provider.getSigner());
      const txHash = await blockchainService.purchaseTokens(property.id, tokenAmount);

      success('Investment Successful!', `Transaction submitted: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
      setShowInvestModal(false);
      setInvestAmount('');

      // Refresh the page data after successful investment
      window.location.reload();
    } catch (err: any) {
      error('Investment Failed', err.message || 'Your investment could not be processed. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-800">
      <div className="relative h-48 w-full">
        <img
          src={property.images?.[0] || `https://images.unsplash.com/photo-${1545324418 + property.id}-cc1a3fa10c00?w=800`}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(property.isActive)}`}>
          {property.isActive ? 'ACTIVE' : 'INACTIVE'}
        </div>
        {property.isVerified && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white bg-blue-600">
            VERIFIED
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-white line-clamp-2">{property.title}</h3>
          <div className="text-right">
            <p className="text-lg font-bold text-white">${property.totalValue.toLocaleString()}</p>
            <p className="text-sm text-gray-400">${property.tokenPrice}/token</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-3">{property.description}</p>

        <div className="flex justify-between items-center mb-4 text-sm text-gray-300">
          <span>📍 {property.location}</span>
          <span className={`font-semibold ${getRiskColor(property.riskLevel)}`}>
            Risk: {property.riskLevel?.toUpperCase() || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center mb-4 text-sm text-gray-300">
          <span>🏠 {property.propertyType}</span>
          <span>💰 {property.rentalYield}% yield</span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Tokens Available</span>
            <span>{property.availableTokens}/{property.totalTokens}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${availabilityPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {availabilityPercentage.toFixed(1)}% tokenized
          </div>
        </div>

        <div className="space-y-2">
          <Link
            to={`/property/${property.id}`}
            className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-all duration-200 text-center"
          >
            View Details
          </Link>

          <div className="flex space-x-2">
            <button
              onClick={property.isActive && property.availableTokens > 0 ? handleInvestClick : undefined}
              className={`flex-1 py-2 px-4 rounded font-semibold transition-all duration-200 ${
                property.isActive && property.availableTokens > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
              disabled={!property.isActive || property.availableTokens === 0}
            >
              {property.availableTokens > 0 ? 'Buy Tokens' : 'Sold Out'}
            </button>

            <Link
              to={`/marketplace?property=${property.id}`}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-all duration-200 text-center"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </div>

      {showInvestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowInvestModal(false)}>
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-4">Invest in {property.title}</h3>

            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Available Tokens: {property.availableTokens}</div>
              <div className="text-sm text-gray-400 mb-4">Token Price: ${property.tokenPrice}</div>

              <label className="block text-sm font-medium text-gray-300 mb-2">
                Investment Amount (USD)
              </label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              {investAmount && parseFloat(investAmount) > 0 && (
                <div className="text-sm text-gray-400 mt-2">
                  You will receive approximately {Math.floor(parseFloat(investAmount) / property.tokenPrice)} tokens
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowInvestModal(false)}
                className="flex-1 py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={isInvesting || !investAmount || parseFloat(investAmount) <= 0}
                className={`flex-1 py-2 px-4 rounded font-semibold transition-colors ${
                  isInvesting || !investAmount || parseFloat(investAmount) <= 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isInvesting ? 'Processing...' : 'Invest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;