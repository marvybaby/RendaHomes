import React from 'react';
import HashPackFaucet from '@/components/HashPackFaucet';

const Faucet: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">HRM Token Faucet</h1>
          <p className="text-gray-400 text-lg">
            Get HRM tokens directly from the blockchain - connect wallet, mint tokens, pay fees
          </p>
        </div>

        {/* HashPack Faucet */}
        <HashPackFaucet />

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">Fully On-Chain</h3>
            <p className="text-gray-400">
              Direct smart contract interaction. No external servers or APIs required.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Instant & Transparent</h3>
            <p className="text-gray-400">
              Tokens are minted immediately and all transactions are verifiable on Hedera.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-3xl mb-4">🔓</div>
            <h3 className="text-xl font-semibold mb-2">Permissionless</h3>
            <p className="text-gray-400">
              No registration or approval needed. Just connect your wallet and mint.
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">What to do with HRM Tokens?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🏠</div>
              <h4 className="font-semibold mb-2">Invest in Properties</h4>
              <p className="text-sm text-gray-300">Use HRM to purchase property tokens and earn rental income</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🗳️</div>
              <h4 className="font-semibold mb-2">DAO Governance</h4>
              <p className="text-sm text-gray-300">Participate in platform governance and vote on proposals</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💱</div>
              <h4 className="font-semibold mb-2">Trade Tokens</h4>
              <p className="text-sm text-gray-300">Buy and sell property tokens on the marketplace</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎁</div>
              <h4 className="font-semibold mb-2">Rewards & Staking</h4>
              <p className="text-sm text-gray-300">Earn rewards through platform participation</p>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-bold mb-4">Technical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Token Details</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Symbol: HRM</li>
                <li>• Name: RendaHomes Real Estate Token</li>
                <li>• Type: ERC20 Smart Contract</li>
                <li>• Decimals: 18</li>
                <li>• Supply: Unlimited (Mintable)</li>
                <li>• No cooldowns or restrictions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Network Details</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Network: Hedera Hashgraph</li>
                <li>• Environment: Testnet</li>
                <li>• Gas Fees: HBAR</li>
                <li>• Transaction Speed: ~5 seconds</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Faucet;