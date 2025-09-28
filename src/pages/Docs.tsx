import React, { useState } from 'react';

const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'how-it-works', title: 'How It Works', icon: '⚡' },
    { id: 'tokenization', title: 'Tokenization Process', icon: '🪙' },
    { id: 'investing', title: 'Investing Guide', icon: '💰' },
    { id: 'risks', title: 'Risks & Security', icon: '🔒' },
    { id: 'faq', title: 'FAQ', icon: '❓' },
  ];

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-gray-400 text-lg">
            Everything you need to know about RendaHomes tokenized real estate platform
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-gray-900 rounded-lg p-4 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Contents</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center space-x-3 transition-colors duration-200 ${
                      activeSection === section.id
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-gray-900 rounded-lg p-8">
              
              {/* Getting Started */}
              {activeSection === 'getting-started' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">🚀 Getting Started</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Welcome to RendaHomes</h3>
                      <p className="text-gray-300 mb-4">
                        RendaHomes is a revolutionary platform that enables fractional real estate investment 
                        through blockchain tokenization. Own pieces of premium properties with as little as one token.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Quick Start Guide</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-300">
                        <li>Connect your crypto wallet to the platform</li>
                        <li>Browse available tokenized properties</li>
                        <li>Purchase property tokens with HRM or ETH</li>
                        <li>Track your investments in your portfolio</li>
                        <li>Earn rental income and appreciation</li>
                      </ol>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">💡 Pro Tip</h4>
                      <p className="text-sm text-gray-300">
                        Start with smaller investments to familiarize yourself with the platform 
                        before making larger commitments.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* How It Works */}
              {activeSection === 'how-it-works' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">⚡ How It Works</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">The Process</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-2xl mb-2">1️⃣</div>
                          <h4 className="font-semibold mb-2">Property Selection</h4>
                          <p className="text-gray-300 text-sm">
                            We carefully select high-quality properties in prime locations 
                            with strong rental and appreciation potential.
                          </p>
                        </div>
                        
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-2xl mb-2">2️⃣</div>
                          <h4 className="font-semibold mb-2">Legal Structure</h4>
                          <p className="text-gray-300 text-sm">
                            Each property is held in a legal entity, with tokens representing 
                            fractional ownership stakes in that entity.
                          </p>
                        </div>
                        
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-2xl mb-2">3️⃣</div>
                          <h4 className="font-semibold mb-2">Tokenization</h4>
                          <p className="text-gray-300 text-sm">
                            Properties are divided into tokens on the blockchain, 
                            making fractional ownership transparent and tradeable.
                          </p>
                        </div>
                        
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-2xl mb-2">4️⃣</div>
                          <h4 className="font-semibold mb-2">Investment Returns</h4>
                          <p className="text-gray-300 text-sm">
                            Earn returns through rental income distribution and 
                            property appreciation reflected in token value.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tokenization Process */}
              {activeSection === 'tokenization' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">🪙 Tokenization Process</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">What is Tokenization?</h3>
                      <p className="text-gray-300 mb-4">
                        Tokenization converts real estate assets into digital tokens on the blockchain. 
                        Each token represents a fractional ownership stake in the underlying property.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Token Structure</h3>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <ul className="space-y-2 text-gray-300">
                          <li>• Each property is divided into 1,000 tokens</li>
                          <li>• Token price = Property Value ÷ 1,000</li>
                          <li>• Minimum purchase: 1 token</li>
                          <li>• Tokens are ERC-20 compliant</li>
                          <li>• Full transparency on blockchain</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Benefits of Tokenization</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4">
                          <div className="text-3xl mb-2">🔄</div>
                          <h4 className="font-semibold mb-2">Liquidity</h4>
                          <p className="text-gray-300 text-sm">Buy and sell anytime</p>
                        </div>
                        <div className="text-center p-4">
                          <div className="text-3xl mb-2">📊</div>
                          <h4 className="font-semibold mb-2">Transparency</h4>
                          <p className="text-gray-300 text-sm">All transactions on-chain</p>
                        </div>
                        <div className="text-center p-4">
                          <div className="text-3xl mb-2">💸</div>
                          <h4 className="font-semibold mb-2">Low Barrier</h4>
                          <p className="text-gray-300 text-sm">Affordable entry point</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Investing Guide */}
              {activeSection === 'investing' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">💰 Investing Guide</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Investment Strategies</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">🌱 Conservative Approach</h4>
                          <p className="text-gray-300 text-sm mb-2">
                            Focus on stable, income-generating properties in established markets.
                          </p>
                          <ul className="text-gray-400 text-sm space-y-1">
                            <li>• Target low-risk properties</li>
                            <li>• Diversify across multiple properties</li>
                            <li>• Reinvest rental income</li>
                          </ul>
                        </div>
                        
                        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">⚖️ Balanced Portfolio</h4>
                          <p className="text-gray-300 text-sm mb-2">
                            Mix of stable income properties and growth opportunities.
                          </p>
                          <ul className="text-gray-400 text-sm space-y-1">
                            <li>• 70% low-medium risk properties</li>
                            <li>• 30% higher growth potential</li>
                            <li>• Regular rebalancing</li>
                          </ul>
                        </div>
                        
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">🚀 Growth Focused</h4>
                          <p className="text-gray-300 text-sm mb-2">
                            Target properties with high appreciation potential.
                          </p>
                          <ul className="text-gray-400 text-sm space-y-1">
                            <li>• Focus on emerging markets</li>
                            <li>• Accept higher risk for potential returns</li>
                            <li>• Monitor market trends closely</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Key Metrics to Consider</h3>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Financial Metrics</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              <li>• Cap Rate (Net Operating Income / Property Value)</li>
                              <li>• Price-to-Rent Ratio</li>
                              <li>• Historical Appreciation</li>
                              <li>• Rental Yield</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Market Factors</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              <li>• Location and Neighborhood</li>
                              <li>• Local Job Market</li>
                              <li>• Population Growth</li>
                              <li>• Infrastructure Development</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risks & Security */}
              {activeSection === 'risks' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">🔒 Risks & Security</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Investment Risks</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">⚠️ Market Risk</h4>
                          <p className="text-gray-300 text-sm">
                            Real estate values can fluctuate due to economic conditions, 
                            interest rates, and local market factors.
                          </p>
                        </div>
                        
                        <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">🏠 Property-Specific Risk</h4>
                          <p className="text-gray-300 text-sm">
                            Individual properties may face maintenance issues, vacancy, 
                            natural disasters, or neighborhood changes.
                          </p>
                        </div>
                        
                        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">💧 Liquidity Risk</h4>
                          <p className="text-gray-300 text-sm">
                            While tokens are more liquid than traditional real estate, 
                            there may be periods with limited trading activity.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Security Measures</h3>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Smart Contract Security</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              <li>• Audited by leading security firms</li>
                              <li>• Multi-signature wallet controls</li>
                              <li>• Transparent on-chain operations</li>
                              <li>• Regular security reviews</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Platform Security</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              <li>• End-to-end encryption</li>
                              <li>• Secure wallet integrations</li>
                              <li>• Regular penetration testing</li>
                              <li>• 24/7 monitoring systems</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ */}
              {activeSection === 'faq' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">❓ Frequently Asked Questions</h2>
                  
                  <div className="space-y-4">
                    {[
                      {
                        q: "What is the minimum investment amount?",
                        a: "You can start investing with just one token. Token prices vary by property but typically range from $500 to $5,000 per token."
                      },
                      {
                        q: "How do I receive rental income?",
                        a: "Rental income is distributed quarterly to token holders proportional to their ownership percentage. Distributions are made in HRM tokens."
                      },
                      {
                        q: "Can I sell my tokens anytime?",
                        a: "Yes, tokens can be traded on our platform's secondary market. Liquidity depends on market demand for specific properties."
                      },
                      {
                        q: "What happens if a property is damaged?",
                        a: "All properties are insured. Insurance claims are processed and any impact is reflected in the property's valuation and token price."
                      },
                      {
                        q: "How are property values determined?",
                        a: "Property values are updated quarterly based on professional appraisals, comparable sales, and market analysis."
                      },
                      {
                        q: "What blockchain network do you use?",
                        a: "We operate on Ethereum mainnet for maximum security and compatibility with existing DeFi infrastructure."
                      },
                      {
                        q: "Are there any fees?",
                        a: "We charge a 1% annual management fee and a 0.5% transaction fee on token purchases. No fees for holding or receiving distributions."
                      },
                      {
                        q: "Do I have voting rights?",
                        a: "Token holders can vote on major decisions affecting their properties, such as major renovations or sale decisions."
                      }
                    ].map((faq, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{faq.q}</h4>
                        <p className="text-gray-300 text-sm">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-red-900 to-red-800 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
          <p className="text-red-100 mb-6">
            Our support team is here to help you understand tokenized real estate investing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Contact Support
            </button>
            <button className="border border-white text-white hover:bg-white hover:text-red-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;