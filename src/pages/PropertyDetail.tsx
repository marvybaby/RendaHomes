import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAlertContext } from '@/components/AlertProvider';
import BlockchainService from '@/services/blockchainService';

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const { provider, account, isConnected } = useWallet();
  const { success, error } = useAlertContext();

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id, provider, isConnected]);

  const loadProperty = async () => {
    try {
      setLoading(true);

      // Create provider if not available
      const { ethers } = await import('ethers');
      const { getCurrentNetworkConfig } = await import('@/config/contracts');
      const networkConfig = getCurrentNetworkConfig();

      const jsonProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const blockchainService = new BlockchainService(jsonProvider);

      const propertyId = parseInt(id!);
      const foundProperty = await blockchainService.getProperty(propertyId);
      setProperty(foundProperty);
    } catch (error) {
      console.error('Error loading property:', error);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!account || !isConnected) {
      error('Wallet Required', 'Please connect your wallet to invest');
      return;
    }

    if (!property) return;

    if (!investAmount || parseFloat(investAmount) <= 0) {
      error('Invalid Amount', 'Please enter a valid investment amount');
      return;
    }

    const tokenAmount = Math.floor(parseFloat(investAmount) / property.tokenPrice);
    if (tokenAmount > property.availableTokens) {
      error('Insufficient Tokens', `Only ${property.availableTokens} tokens available`);
      return;
    }

    setInvesting(true);
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      const blockchainService = new BlockchainService(provider);
      await blockchainService.purchaseTokens(
        property.id,
        tokenAmount,
        account
      );

      success('Investment Successful!', `Purchased ${tokenAmount} tokens for $${investAmount}`);
      setInvestAmount('');

      await loadProperty();
    } catch (err) {
      error('Investment Failed', 'Transaction could not be completed. Please try again.');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-semibold mb-2">Loading Property</h2>
          <p className="text-gray-400">Fetching details from smart contract...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-gray-400">The requested property could not be found.</p>
          <button
            onClick={() => navigate('/properties')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const availabilityPercentage = property.totalTokens > 0
    ? ((property.totalTokens - property.availableTokens) / property.totalTokens) * 100
    : 0;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
          >
            ← Back to Properties
          </button>
          <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
          <p className="text-gray-400 text-lg">📍 {property.location}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src={property.images?.[0] || `https://images.unsplash.com/photo-${1545324418 + property.id}-cc1a3fa10c00?w=800`}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  property.isActive
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}>
                  {property.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {property.isVerified && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                    ✓ Verified
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Property Description</h2>
              <p className="text-gray-300 leading-relaxed mb-6">{property.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{property.propertyType}</div>
                  <div className="text-sm text-gray-400">Property Type</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{property.rentalYield}%</div>
                  <div className="text-sm text-gray-400">Rental Yield</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    property.riskLevel?.toLowerCase() === 'low' ? 'text-green-400' :
                    property.riskLevel?.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {property.riskLevel}
                  </div>
                  <div className="text-sm text-gray-400">Risk Level</div>
                </div>
              </div>
            </div>

            {/* Property Details Section */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Property Specs */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">📏 Property Specifications</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Property Type:</span>
                      <span className="font-medium text-white">{property.propertyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Value:</span>
                      <span className="font-medium text-green-400">${property.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Level:</span>
                      <span className={`font-medium ${
                        property.riskLevel?.toLowerCase() === 'low' ? 'text-green-400' :
                        property.riskLevel?.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {property.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="font-medium text-white">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">💰 Financial Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rental Yield:</span>
                      <span className="font-medium text-green-400">{property.rentalYield.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token Price:</span>
                      <span className="font-medium text-white">${property.tokenPrice.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Tokens:</span>
                      <span className="font-medium text-white">{property.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Tokens:</span>
                      <span className="font-medium text-blue-400">{property.availableTokens.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">✅ Verification Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Property Verified:</span>
                      <span className={`font-medium ${property.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                        {property.isVerified ? '✅ Verified' : '❌ Not Verified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Property Status:</span>
                      <span className={`font-medium ${property.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {property.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Property Owner:</span>
                      <span className="font-medium text-white text-xs">
                        {property.propertyOwner.slice(0, 6)}...{property.propertyOwner.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blockchain Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-3">🔗 Blockchain Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Property ID:</span>
                      <span className="font-medium text-white">#{property.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <span className="font-medium text-cyan-400">Hedera Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token Standard:</span>
                      <span className="font-medium text-white">HTS-20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {property.images && property.images.length > 1 && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Property Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {property.images.slice(0, 6).map((image, index) => (
                    <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Property Tags</h2>
              <div className="flex flex-wrap gap-2">
                {property.tags?.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                    {tag}
                  </span>
                )) || <span className="text-gray-400">No tags available</span>}
              </div>
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  ${property.totalValue.toLocaleString()}
                </div>
                <div className="text-gray-400">Total Property Value</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Price:</span>
                  <span className="font-semibold">${property.tokenPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Tokens:</span>
                  <span className="font-semibold">{property.totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available:</span>
                  <span className="font-semibold text-green-400">{property.availableTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokenized:</span>
                  <span className="font-semibold">{availabilityPercentage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-4 bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${availabilityPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Invest in this Property</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Investment Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {investAmount && parseFloat(investAmount) > 0 && (
                    <div className="text-sm text-gray-400 mt-2">
                      ≈ {Math.floor(parseFloat(investAmount) / property.tokenPrice)} tokens
                    </div>
                  )}
                </div>

                <button
                  onClick={handleInvest}
                  disabled={investing || !isConnected || !property.isActive || property.availableTokens === 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    property.isActive && isConnected && property.availableTokens > 0
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {investing
                    ? 'Processing...'
                    : !isConnected
                    ? 'Connect Wallet to Invest'
                    : !property.isActive
                    ? 'Property Inactive'
                    : property.availableTokens === 0
                    ? 'Sold Out'
                    : 'Invest Now'
                  }
                </button>

                {!isConnected && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Connect your HashPack wallet to start investing
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/marketplace?property=${property.id}`)}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-all duration-200"
                >
                  Trade Tokens
                </button>
                <button
                  onClick={() => navigate('/portfolio')}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-all duration-200"
                >
                  View Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}