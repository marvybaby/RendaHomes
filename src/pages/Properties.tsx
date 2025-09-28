import React, { useState, useMemo, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAlertContext } from '@/components/AlertProvider';
import BlockchainService from '@/services/blockchainService';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price-low');
  const { wallet, isConnected } = useWallet();
  const { warning, error, info } = useAlertContext();

  useEffect(() => {
    loadProperties();
  }, [wallet, isConnected]);

  const loadProperties = async () => {
    try {
      setLoading(true);

      // Create a provider for reading data from blockchain
      const { ethers } = await import('ethers');
      const { getCurrentNetworkConfig } = await import('@/config/contracts');
      const networkConfig = getCurrentNetworkConfig();

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const blockchainService = new BlockchainService(provider);
      const contractProperties = await blockchainService.getAllProperties();

      setProperties(contractProperties);

      if (contractProperties.length === 0) {
        info('No Properties', 'No properties found in smart contract. Properties need to be listed first.');
      }
    } catch (err: any) {
      error('Loading Failed', 'Failed to load properties from blockchain. Please check your connection.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter((property) => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.description.toLowerCase().includes(searchTerm.toLowerCase());

      // For blockchain properties, use isActive instead of status
      const matchesStatus = selectedStatus === 'all' ||
                           (selectedStatus === 'available' && property.isActive && property.availableTokens > 0) ||
                           (selectedStatus === 'sold' && property.availableTokens === 0) ||
                           (selectedStatus === 'pending' && !property.isVerified);

      const matchesRisk = selectedRisk === 'all' || property.riskLevel.toLowerCase() === selectedRisk;

      let matchesPrice = true;
      if (priceRange !== 'all') {
        const price = property.totalValue; // Use totalValue for blockchain properties
        switch (priceRange) {
          case 'under-500k':
            matchesPrice = price < 500000;
            break;
          case '500k-1m':
            matchesPrice = price >= 500000 && price < 1000000;
            break;
          case '1m-2m':
            matchesPrice = price >= 1000000 && price < 2000000;
            break;
          case 'over-2m':
            matchesPrice = price >= 2000000;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesRisk && matchesPrice;
    });

    // Sort the filtered properties
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.totalValue - b.totalValue;
        case 'price-high':
          return b.totalValue - a.totalValue;
        case 'tokens-available':
          return b.availableTokens - a.availableTokens;
        case 'sqft-high':
          // For blockchain properties, sort by total value as proxy for size
          return b.totalValue - a.totalValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [properties, searchTerm, selectedStatus, selectedRisk, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">All Properties</h1>
          <p className="text-gray-400 text-lg">
            Discover tokenized real estate opportunities
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="col-span-1 lg:col-span-2">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Prices</option>
                <option value="under-500k">Under $500K</option>
                <option value="500k-1m">$500K - $1M</option>
                <option value="1m-2m">$1M - $2M</option>
                <option value="over-2m">Over $2M</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="tokens-available">Most Tokens Available</option>
                <option value="sqft-high">Largest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            {loading ? 'Loading properties...' : `Showing ${filteredAndSortedProperties.length} of ${properties.length} properties`}
          </p>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-2xl font-semibold mb-2">Loading Properties</h3>
            <p className="text-gray-400">Fetching data from smart contracts...</p>
          </div>
        ) : filteredAndSortedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-semibold mb-2">No Properties Found</h3>
            <p className="text-gray-400">
              {properties.length === 0 
                ? 'No properties have been listed yet. Connect your wallet to access real contract data.'
                : 'Try adjusting your filters to see more properties'
              }
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{properties.length}</div>
              <div className="text-gray-400">Total Properties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                ${properties.reduce((sum, p) => sum + p.totalValue, 0).toLocaleString()}
              </div>
              <div className="text-gray-400">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {properties.filter(p => p.isActive && p.availableTokens > 0).length}
              </div>
              <div className="text-gray-400">Available Properties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">
                {properties.reduce((sum, p) => sum + (p.totalTokens - p.availableTokens), 0).toLocaleString()}
              </div>
              <div className="text-gray-400">Tokens Sold</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;