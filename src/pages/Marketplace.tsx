import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Property } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import BlockchainService from '@/services/blockchainService';
import { useAlertContext } from '@/components/AlertProvider';

interface SellOrder {
  id: string;
  seller: string;
  tokensForSale: number;
  pricePerToken: number;
  totalPrice: number;
  isActive: boolean;
  createdAt: string;
}

interface BuyOrder {
  id: string;
  buyer: string;
  tokensToBuy: number;
  pricePerToken: number;
  totalPrice: number;
  isActive: boolean;
  createdAt: string;
}

export default function MarketplacePage() {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // Sell form states
  const [sellTokens, setSellTokens] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellDuration, setSellDuration] = useState('7');
  const [selling, setSelling] = useState(false);

  // Buy form states
  const [buyTokens, setBuyTokens] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buying, setBuying] = useState(false);

  const { wallet, provider } = useWallet();
  const { success, error } = useAlertContext();

  useEffect(() => {
    loadData();
  }, [propertyId, wallet]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!provider) {
        setProperties([]);
        return;
      }

      // Initialize blockchain service
      const blockchainService = new BlockchainService(provider);
      const allProperties = await blockchainService.getAllProperties();
      setProperties(allProperties);

      if (propertyId) {
        const property = allProperties.find(p => p.id.toString() === propertyId);
        if (property) {
          setSelectedProperty(property);
          // Load market orders for this property
          await loadMarketOrders(propertyId);
        }
      } else if (allProperties.length > 0) {
        setSelectedProperty(allProperties[0]);
        await loadMarketOrders(allProperties[0].id.toString());
      }

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadMarketOrders = async (propId: string) => {
    if (!wallet.isConnected) {
      setSellOrders([]);
      setBuyOrders([]);
      return;
    }

    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      // Initialize blockchain service
      const blockchainService = new BlockchainService(provider);

      // Load actual sell orders from blockchain
      const activeSellOrders = await blockchainService.getActiveSellOrders(parseInt(propId));

      const formattedSellOrders: SellOrder[] = activeSellOrders.map(order => ({
        id: order.id.toString(),
        seller: order.seller,
        tokensForSale: order.tokensForSale,
        pricePerToken: order.pricePerToken,
        totalPrice: order.totalPrice,
        isActive: order.isActive,
        createdAt: new Date(order.createdAt).toISOString().split('T')[0]
      }));

      setSellOrders(formattedSellOrders);

      setBuyOrders([]);

    } catch (error) {
      setSellOrders([]);
      setBuyOrders([]);
    }
  };

  const handleCreateSellOrder = async () => {
    if (!wallet || !selectedProperty || !provider) {
      error('Wallet Required', 'Please connect your wallet');
      return;
    }

    if (!sellTokens || !sellPrice) {
      error('Invalid Input', 'Please enter valid tokens and price');
      return;
    }

    setSelling(true);
    try {
      const blockchainService = new BlockchainService(provider, await provider.getSigner());
      const txHash = await blockchainService.createSellOrder(
        selectedProperty.id,
        parseInt(sellTokens),
        sellPrice,
        parseInt(sellDuration)
      );

      success('Sell Order Created!', `Transaction submitted: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
      setSellTokens('');
      setSellPrice('');

      // Reload orders
      await loadMarketOrders(selectedProperty.id.toString());
    } catch (err: any) {
      error('Order Failed', err.message || 'Could not create sell order');
    } finally {
      setSelling(false);
    }
  };

  const handleBuyFromOrder = async (order: SellOrder, tokensToBuy: number) => {
    if (!wallet || !provider) {
      error('Wallet Required', 'Please connect your wallet');
      return;
    }

    setBuying(true);
    try {
      const blockchainService = new BlockchainService(provider, await provider.getSigner());
      const txHash = await blockchainService.buyFromOrder(parseInt(order.id), tokensToBuy);

      success('Purchase Successful!', `Transaction submitted: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);

      // Reload orders
      await loadMarketOrders(selectedProperty!.id.toString());
    } catch (err: any) {
      error('Purchase Failed', err.message || 'Could not complete purchase');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-semibold mb-2">Loading Marketplace</h2>
          <p className="text-gray-400">Fetching trading data from smart contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Token Marketplace</h1>
          <p className="text-gray-400 text-lg">Trade property tokens with other investors</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Property Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Select Property</h2>
            <div className="space-y-3">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => {
                    setSelectedProperty(property);
                    loadMarketOrders(property.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-sm">{property.title}</div>
                  <div className="text-xs text-gray-400">{property.location}</div>
                  <div className="text-xs text-green-400">${property.tokenPrice}/token</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trading Interface */}
          <div className="lg:col-span-3">
            {selectedProperty && (
              <>
                {/* Property Header */}
                <div className="bg-gray-900 rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img
                        src={selectedProperty.imageUrl}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">{selectedProperty.title}</h2>
                      <p className="text-gray-400">{selectedProperty.location}</p>
                      <p className="text-green-400">Floor Price: ${selectedProperty.tokenPrice}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setActiveTab('buy')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      activeTab === 'buy'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Buy Tokens
                  </button>
                  <button
                    onClick={() => setActiveTab('sell')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      activeTab === 'sell'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Sell Tokens
                  </button>
                </div>

                {/* Buy Tab */}
                {activeTab === 'buy' && (
                  <div className="space-y-6">
                    
                    {/* Active Sell Orders */}
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Available Sell Orders</h3>
                      
                      {sellOrders.length > 0 ? (
                        <div className="space-y-3">
                          {sellOrders.map((order) => (
                            <div key={order.id} className="border border-gray-700 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-semibold">{order.tokensForSale} tokens available</div>
                                  <div className="text-gray-400 text-sm">
                                    ${order.pricePerToken}/token • Total: ${order.totalPrice.toLocaleString()}
                                  </div>
                                  <div className="text-gray-500 text-xs">Seller: {order.seller}</div>
                                </div>
                                <button
                                  onClick={() => handleBuyFromOrder(order, order.tokensForSale)}
                                  disabled={buying || !wallet}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                                >
                                  {buying ? 'Buying...' : 'Buy All'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <div className="text-4xl mb-2">📝</div>
                          <p>No sell orders available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sell Tab */}
                {activeTab === 'sell' && (
                  <div className="space-y-6">
                    
                    {/* Create Sell Order */}
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Create Sell Order</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tokens to Sell
                          </label>
                          <input
                            type="number"
                            value={sellTokens}
                            onChange={(e) => setSellTokens(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Price per Token ($)
                          </label>
                          <input
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="1850"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Duration (days)
                          </label>
                          <select
                            value={sellDuration}
                            onChange={(e) => setSellDuration(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="1">1 day</option>
                            <option value="7">7 days</option>
                            <option value="30">30 days</option>
                          </select>
                        </div>
                      </div>

                      {sellTokens && sellPrice && (
                        <div className="bg-gray-800 rounded-lg p-4 mb-4">
                          <div className="text-sm text-gray-400">Order Summary:</div>
                          <div className="text-lg font-semibold">
                            Sell {sellTokens} tokens for ${(parseFloat(sellTokens) * parseFloat(sellPrice)).toLocaleString()}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleCreateSellOrder}
                        disabled={selling || !wallet || !sellTokens || !sellPrice}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                      >
                        {selling ? 'Creating Order...' : 'Create Sell Order'}
                      </button>

                      {!wallet && (
                        <p className="text-center text-sm text-gray-400 mt-4">
                          Connect your wallet to create sell orders
                        </p>
                      )}
                    </div>

                    {/* Active Buy Orders */}
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Active Buy Orders</h3>
                      
                      {buyOrders.length > 0 ? (
                        <div className="space-y-3">
                          {buyOrders.map((order) => (
                            <div key={order.id} className="border border-gray-700 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-semibold">{order.tokensToBuy} tokens wanted</div>
                                  <div className="text-gray-400 text-sm">
                                    ${order.pricePerToken}/token • Total: ${order.totalPrice.toLocaleString()}
                                  </div>
                                  <div className="text-gray-500 text-xs">Buyer: {order.buyer}</div>
                                </div>
                                <button
                                  disabled={!wallet}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                                >
                                  Sell to Order
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <div className="text-4xl mb-2">🛒</div>
                          <p>No buy orders available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}