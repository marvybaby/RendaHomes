import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import BlockchainService from '@/services/blockchainService';

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { provider, isConnected } = useWallet();

  useEffect(() => {
    loadProperties();
  }, [provider, isConnected]);

  const loadProperties = async () => {
    try {
      setLoading(true);

      if (!provider) {
        setAllProperties([]);
        setFeaturedProperties([]);
        setLoading(false);
        return;
      }

      const blockchainService = new BlockchainService(provider);
      const properties = await blockchainService.getAllProperties();

      setAllProperties(properties);
      setFeaturedProperties(properties.slice(0, 3));

    } catch (error) {
      setAllProperties([]);
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">RENDA</span>
            <span className="text-red-500">HOMES</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-300">
            Real Estate Tokenization Dapp
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Invest in premium real estate through blockchain tokenization. 
            Own fractions of high-value properties with complete transparency and liquidity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/properties"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Explore Properties
            </Link>
            <Link 
              to="/docs"
              className="border border-gray-600 hover:border-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose RendaHomes?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-4">Premium Properties</h3>
              <p className="text-gray-400">
                Hand-picked real estate investments in prime locations with strong appreciation potential.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-4">Blockchain Security</h3>
              <p className="text-gray-400">
                Transparent ownership records and secure transactions powered by blockchain technology.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-4">Fractional Ownership</h3>
              <p className="text-gray-400">
                Start investing with as little as one token and diversify across multiple properties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Properties</h2>
            <p className="text-gray-400 text-lg">
              Discover our most popular tokenized real estate opportunities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-400">Loading properties from smart contracts...</p>
              </div>
            ) : (
              featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            )}
          </div>
          <div className="text-center">
            <Link 
              to="/properties"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 inline-block"
            >
              View All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">
                {allProperties.length}
              </div>
              <div className="text-gray-400">Total Properties</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">
                ${(allProperties.reduce((sum, p) => sum + (p.totalValue || p.price || 0), 0) / 1000000).toFixed(1)}M
              </div>
              <div className="text-gray-400">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">
                {allProperties.reduce((sum, p) => sum + (p.totalTokens - p.availableTokens), 0)}
              </div>
              <div className="text-gray-400">Tokens Sold</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-2">
                {allProperties.filter(p => p.isActive && p.availableTokens > 0).length}
              </div>
              <div className="text-gray-400">Available Now</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-900 to-red-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Investing?</h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of investors already earning returns through tokenized real estate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/properties"
              className="bg-white text-red-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Browse Properties
            </Link>
            <Link 
              to="/portfolio"
              className="border border-white text-white hover:bg-white hover:text-red-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}