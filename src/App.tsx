import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { WalletProvider } from '@/contexts/WalletContext';
import { AlertProvider } from '@/components/AlertProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Marketplace from './pages/Marketplace';
import OnboardProperty from './pages/OnboardProperty';
import Portfolio from './pages/Portfolio';
import DisasterLogs from './pages/DisasterLogs';
import WrapHRM from './pages/WrapHRM';
import Faucet from './pages/Faucet';
import Docs from './pages/Docs';
import Governance from './pages/Governance';

function App() {
  return (
    <ErrorBoundary>
      <div className="font-sans bg-black text-white min-h-screen">
        <AlertProvider>
          <WalletProvider>
            <Header />
            <main>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/property/:id" element={<PropertyDetail />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/onboard-property" element={<OnboardProperty />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/disaster-logs" element={<DisasterLogs />} />
                  <Route path="/governance" element={<Governance />} />
                  <Route path="/wrap-hrm" element={<WrapHRM />} />
                  <Route path="/faucet" element={<Faucet />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/dashboard" element={<Navigate to="/portfolio" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </WalletProvider>
        </AlertProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;