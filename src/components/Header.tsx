import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAlertContext } from '@/components/AlertProvider';
import { useHRMBalance } from '@/hooks/useHRMBalance';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const {
    wallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  } = useWallet();
  const { error: alertError } = useAlertContext();
  const { formattedBalance, isLoading: balanceLoading } = useHRMBalance();

  const navigation = [
    { name: 'All Property Page', href: '/properties' },
    { name: 'My Portfolio', href: '/portfolio' },
    { name: 'List Your Property', href: '/onboard-property' },
    { name: 'Token Marketplace', href: '/marketplace' },
    { name: 'DAO Governance', href: '/governance' },
    { name: 'HRM Faucet', href: '/faucet' },
    { name: 'Documentation', href: '/docs' },
    { name: 'All Disaster Logs', href: '/disaster-logs' },
    { name: 'Wrap HRM', href: '/wrap-hrm' },
  ];

  const handleWalletConnect = () => {
    if (wallet.isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-white text-2xl font-bold">
              RENDAHOMES
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-white hover:text-red-500 transition-colors duration-200 ${
                  pathname === item.href ? 'text-red-500' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Wallet Connect Button */}
          <div className="hidden md:flex items-center space-x-4">
            {wallet.isConnected && (
              <div className="text-white bg-gray-800 px-3 py-1 rounded-lg">
                <span className="text-sm text-gray-300">HRM:</span>
                <span className="ml-1 font-bold text-green-400">
                  {balanceLoading ? '...' : formattedBalance}
                </span>
              </div>
            )}
            <button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                wallet.isConnected
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : isConnecting
                  ? 'bg-yellow-600 text-white cursor-wait'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isConnecting
                ? 'Connecting...'
                : wallet.isConnected
                ? `${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}`
                : 'Connect HashPack'
              }
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900 rounded-lg mt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-white hover:text-red-500 transition-colors duration-200 ${
                    pathname === item.href ? 'text-red-500 bg-gray-800' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {wallet.isConnected && (
                <div className="px-3 py-2 text-white bg-gray-800 rounded">
                  <span className="text-sm text-gray-300">HRM Balance:</span>
                  <span className="ml-1 font-bold text-green-400">
                    {balanceLoading ? '...' : formattedBalance}
                  </span>
                </div>
              )}
              <button
                onClick={handleWalletConnect}
                className={`w-full text-left px-3 py-2 rounded font-medium transition-all duration-200 ${
                  wallet.isConnected
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {wallet.isConnected
                  ? `${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}`
                  : 'Connect HashPack'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;