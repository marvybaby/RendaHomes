import React, { useState, useMemo, useEffect } from 'react';
import { DisasterLog } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAlert } from '@/hooks/useAlert';
import BlockchainService from '@/services/blockchainService';

const DisasterLogsPage: React.FC = () => {
  const [disasterLogs, setDisasterLogs] = useState<DisasterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const { provider, isConnected } = useWallet();
  const { showAlert } = useAlert();

  useEffect(() => {
    loadDisasterLogs();
  }, [provider, isConnected]);

  const loadDisasterLogs = async () => {
    try {
      setLoading(true);

      if (!provider) {
        showAlert('Please connect your wallet to view disaster logs', 'warning');
        setDisasterLogs([]);
        return;
      }

      const blockchainService = new BlockchainService(provider);
      const logs = await blockchainService.getDisasterLogs();

      setDisasterLogs(logs);

      if (logs.length === 0) {
        showAlert('No disaster logs found in smart contract.', 'info');
      }
    } catch (error) {
      showAlert('Failed to load disaster logs from blockchain. Please check your connection.', 'error');
      setDisasterLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getDisasterTypeName = (type: number): string => {
    const types = ['Fire', 'Flood', 'Earthquake', 'Hurricane', 'Other'];
    return types[type]?.toLowerCase() || 'other';
  };

  const getSeverityName = (severity: number): string => {
    const severities = ['low', 'medium', 'high', 'critical'];
    return severities[severity] || 'low';
  };

  const getStatusName = (status: number): string => {
    const statuses = ['reported', 'investigating', 'verified', 'resolved', 'rejected'];
    return statuses[status] || 'reported';
  };

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = disasterLogs.filter((log) => {
      const logType = getDisasterTypeName(log.disasterType);
      const logSeverity = getSeverityName(log.severity);
      const logStatus = getStatusName(log.status);

      const matchesType = selectedType === 'all' || logType === selectedType;
      const matchesSeverity = selectedSeverity === 'all' || logSeverity === selectedSeverity;
      const matchesStatus = selectedStatus === 'all' ||
                           (selectedStatus === 'ongoing' && (logStatus === 'investigating' || logStatus === 'verified')) ||
                           (selectedStatus === 'pending' && logStatus === 'reported') ||
                           (selectedStatus === 'resolved' && logStatus === 'resolved');

      return matchesType && matchesSeverity && matchesStatus;
    });

    // Sort the filtered logs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.reportedAt - a.reportedAt;
        case 'date-asc':
          return a.reportedAt - b.reportedAt;
        case 'damage-high':
          return b.estimatedDamage - a.estimatedDamage;
        case 'damage-low':
          return a.estimatedDamage - b.estimatedDamage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [disasterLogs, selectedType, selectedSeverity, selectedStatus, sortBy]);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      hurricane: '🌪️',
      flood: '🌊',
      fire: '🔥',
      earthquake: '🌍',
      other: '⚠️'
    };
    return icons[type] || '⚠️';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-500 bg-green-900/20 border-green-500';
      case 'medium': return 'text-yellow-500 bg-yellow-900/20 border-yellow-500';
      case 'high': return 'text-orange-500 bg-orange-900/20 border-orange-500';
      case 'critical': return 'text-red-500 bg-red-900/20 border-red-500';
      default: return 'text-gray-500 bg-gray-900/20 border-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-600';
      case 'ongoing': return 'bg-orange-600';
      case 'pending': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getPropertyById = (id: string) => {
    // Return null since we don't have property lookup in this context
    return null;
  };

  const totalDamage = disasterLogs.reduce((sum, log) => sum + (log.actualDamage || log.estimatedDamage), 0);
  const activeIncidents = disasterLogs.filter(log => {
    const status = getStatusName(log.status);
    return status === 'investigating' || status === 'verified';
  }).length;
  const resolvedIncidents = disasterLogs.filter(log => getStatusName(log.status) === 'resolved').length;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">All Disaster Logs</h1>
          <p className="text-gray-400 text-lg">
            Track property incidents, damage reports, and recovery status
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">{loading ? (
          <>
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-500 mb-2">⏳</div>
              <div className="text-gray-400">Loading...</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-500 mb-2">⏳</div>
              <div className="text-gray-400">Loading...</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-500 mb-2">⏳</div>
              <div className="text-gray-400">Loading...</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-500 mb-2">⏳</div>
              <div className="text-gray-400">Loading...</div>
            </div>
          </>
        ) : (
          <>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {disasterLogs.length}
            </div>
            <div className="text-gray-400">Total Incidents</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {activeIncidents}
            </div>
            <div className="text-gray-400">Active Cases</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {resolvedIncidents}
            </div>
            <div className="text-gray-400">Resolved</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">
              ${totalDamage.toLocaleString()}
            </div>
            <div className="text-gray-400">Total Damage</div>
          </div>
          </>
        )}
        </div>

        {/* Filters Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Disaster Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Types</option>
                <option value="hurricane">Hurricane</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="earthquake">Earthquake</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="damage-high">Damage: Highest First</option>
                <option value="damage-low">Damage: Lowest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredAndSortedLogs.length} of {disasterLogs.length} incidents
          </p>
        </div>

        {/* Disaster Logs */}
        {filteredAndSortedLogs.length > 0 ? (
          <div className="space-y-6">
            {filteredAndSortedLogs.map((log) => {
              const logType = getDisasterTypeName(log.disasterType);
              const logSeverity = getSeverityName(log.severity);
              const logStatus = getStatusName(log.status);
              const displayStatus = logStatus === 'investigating' || logStatus === 'verified' ? 'ongoing' : logStatus;

              return (
                <div key={log.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Main Content */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-3xl">{getTypeIcon(logType)}</div>
                        <div>
                          <h3 className="text-xl font-semibold capitalize">
                            {logType} Incident
                          </h3>
                          <p className="text-gray-400">
                            Property #{log.propertyId} • {log.location}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-300">{log.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-4">
                        {/* Severity Badge */}
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getSeverityColor(logSeverity)}`}>
                          {logSeverity.toUpperCase()} SEVERITY
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded text-sm font-medium text-white ${getStatusColor(displayStatus)}`}>
                          {logStatus.toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Date Reported:</span>
                          <div className="font-medium">
                            {new Date(log.reportedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Estimated Damage:</span>
                          <div className="font-medium text-red-400">
                            ${log.estimatedDamage.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Reporter:</span>
                          <div className="font-medium">{log.reporter.slice(0, 8)}...{log.reporter.slice(-6)}</div>
                        </div>
                      </div>

                      {/* Additional blockchain-specific info */}
                      {log.actualDamage > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Actual Damage:</span>
                              <div className="font-medium text-red-400">
                                ${log.actualDamage.toLocaleString()}
                              </div>
                            </div>
                            {log.insurancePayout > 0 && (
                              <div>
                                <span className="text-gray-400">Insurance Payout:</span>
                                <div className="font-medium text-green-400">
                                  ${log.insurancePayout.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div className="flex-shrink-0 space-y-3">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-200">
                        View Details
                      </button>
                      {displayStatus === 'ongoing' && (
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200">
                          Update Status
                        </button>
                      )}
                      <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors duration-200">
                        View Property
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar for Ongoing Cases */}
                  {displayStatus === 'ongoing' && (
                    <div className="mt-6 pt-4 border-t border-gray-800">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Investigation Progress</span>
                        <span>{logStatus === 'investigating' ? 'Under Investigation' : 'Verified - Processing'}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full animate-pulse"
                          style={{ width: logStatus === 'investigating' ? '35%' : '75%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-semibold mb-2">No Incidents Found</h3>
            <p className="text-gray-400">
              No disaster logs match your current filter criteria
            </p>
          </div>
        )}

        {/* Risk Assessment Banner */}
        <div className="mt-12 bg-gradient-to-r from-red-900 to-orange-900 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">🛡️ Risk Management</h3>
          <p className="text-red-100 mb-6 max-w-3xl mx-auto">
            All properties are insured and monitored 24/7. Our risk assessment team evaluates 
            potential threats and implements preventive measures to protect your investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Risk Assessment Report
            </button>
            <button className="border border-white text-white hover:bg-white hover:text-red-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Insurance Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterLogsPage;