import React, { useState, useEffect, useMemo } from 'react';
import { Proposal } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAlert } from '@/hooks/useAlert';
import BlockchainService from '@/services/blockchainService';

interface ProposalWithDetails extends Proposal {
  state: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
  timeRemaining: number;
  votingPowerRequired: number;
  participationRate: number;
}

const GovernancePage: React.FC = () => {
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userVotingPower, setUserVotingPower] = useState<number>(0);

  const { provider, account, isConnected } = useWallet();
  const { showAlert } = useAlert();

  useEffect(() => {
    loadProposals();
    if (account) {
      loadUserVotingPower();
    }
  }, [provider, account, isConnected]);

  const loadProposals = async () => {
    try {
      setLoading(true);

      if (!provider) {
        showAlert('Please connect your wallet to view governance proposals', 'warning');
        setProposals([]);
        return;
      }

      const blockchainService = new BlockchainService(provider);
      const rawProposals = await blockchainService.getAllProposals();

      const enhancedProposals: ProposalWithDetails[] = rawProposals.map(proposal => {
        const now = Date.now();
        const timeRemaining = Math.max(0, proposal.endTime - now);
        const totalVotes = proposal.forVotes + proposal.againstVotes;
        const participationRate = proposal.quorum > 0 ? (totalVotes / proposal.quorum) * 100 : 0;

        let state: ProposalWithDetails['state'] = 'pending';
        if (proposal.cancelled) {
          state = 'cancelled';
        } else if (proposal.executed) {
          state = 'executed';
        } else if (now < proposal.startTime) {
          state = 'pending';
        } else if (now >= proposal.startTime && now <= proposal.endTime) {
          state = 'active';
        } else if (totalVotes >= proposal.quorum && proposal.forVotes > proposal.againstVotes) {
          state = 'succeeded';
        } else {
          state = 'defeated';
        }

        return {
          ...proposal,
          state,
          timeRemaining,
          votingPowerRequired: proposal.quorum,
          participationRate
        };
      });

      setProposals(enhancedProposals);

      if (enhancedProposals.length === 0) {
        showAlert('No governance proposals found.', 'info');
      }
    } catch (error) {
      showAlert('Failed to load governance proposals. Please check your connection.', 'error');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotingPower = async () => {
    if (!provider || !account) return;

    try {
      const blockchainService = new BlockchainService(provider);
      const votingPower = await blockchainService.getVotingPower(account);
      setUserVotingPower(votingPower);
    } catch (error) {
      setUserVotingPower(0);
    }
  };

  const filteredAndSortedProposals = useMemo(() => {
    let filtered = proposals.filter(proposal => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'active') return proposal.state === 'active';
      if (selectedFilter === 'pending') return proposal.state === 'pending';
      if (selectedFilter === 'completed') return ['succeeded', 'defeated', 'executed'].includes(proposal.state);
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.startTime - a.startTime;
        case 'oldest':
          return a.startTime - b.startTime;
        case 'ending-soon':
          return a.timeRemaining - b.timeRemaining;
        case 'most-votes':
          return (b.forVotes + b.againstVotes) - (a.forVotes + a.againstVotes);
        default:
          return 0;
      }
    });

    return filtered;
  }, [proposals, selectedFilter, sortBy]);

  const getStateColor = (state: ProposalWithDetails['state']) => {
    switch (state) {
      case 'active': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'succeeded': return 'bg-blue-600 text-white';
      case 'defeated': return 'bg-red-600 text-white';
      case 'executed': return 'bg-purple-600 text-white';
      case 'cancelled': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getProposalTypeName = (type: number) => {
    const types = ['Text Proposal', 'Parameter Change', 'Treasury Allocation', 'Property Verification', 'Emergency Action'];
    return types[type] || 'Unknown';
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Ended';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  };

  const activeProposals = proposals.filter(p => p.state === 'active').length;
  const totalProposals = proposals.length;
  const avgParticipation = proposals.length > 0
    ? proposals.reduce((sum, p) => sum + p.participationRate, 0) / proposals.length
    : 0;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">DAO Governance</h1>
          <p className="text-gray-400 text-lg">
            Participate in platform governance and shape the future of RendaHomes
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {totalProposals}
            </div>
            <div className="text-gray-400">Total Proposals</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {activeProposals}
            </div>
            <div className="text-gray-400">Active Votes</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {avgParticipation.toFixed(1)}%
            </div>
            <div className="text-gray-400">Avg Participation</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              {userVotingPower.toLocaleString()}
            </div>
            <div className="text-gray-400">Your Voting Power</div>
          </div>
        </div>

        {/* User Voting Power Card */}
        {isConnected && (
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold mb-2">Your Governance Status</h3>
                <p className="text-gray-300">
                  Voting Power: <span className="font-bold text-white">{userVotingPower.toLocaleString()} HRM</span>
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  {userVotingPower >= 10000
                    ? "✅ You can create proposals"
                    : `❌ Need ${(10000 - userVotingPower).toLocaleString()} more HRM to create proposals`
                  }
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={userVotingPower < 10000}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  userVotingPower >= 10000
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Create Proposal
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'active', 'pending', 'completed'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    selectedFilter === filter
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="ending-soon">Ending Soon</option>
              <option value="most-votes">Most Votes</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            {loading ? 'Loading proposals...' : `Showing ${filteredAndSortedProposals.length} of ${proposals.length} proposals`}
          </p>
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-2xl font-semibold mb-2">Loading Proposals</h3>
            <p className="text-gray-400">Fetching governance data from smart contracts...</p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400">Connect your wallet to participate in governance</p>
          </div>
        ) : filteredAndSortedProposals.length > 0 ? (
          <div className="space-y-6">
            {filteredAndSortedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                userVotingPower={userVotingPower}
                onVote={loadProposals}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗳️</div>
            <h3 className="text-2xl font-semibold mb-2">No Proposals Found</h3>
            <p className="text-gray-400">
              {proposals.length === 0
                ? 'No governance proposals have been created yet.'
                : 'Try adjusting your filters to see more proposals'
              }
            </p>
          </div>
        )}

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <CreateProposalModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={loadProposals}
            userVotingPower={userVotingPower}
          />
        )}

        {/* Information Banner */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">🏛️ How Governance Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-blue-100">
            <div>
              <div className="text-3xl mb-2">📝</div>
              <h4 className="font-semibold mb-2">Create Proposals</h4>
              <p className="text-sm">
                Hold 10,000+ HRM tokens to submit governance proposals for platform improvements
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🗳️</div>
              <h4 className="font-semibold mb-2">Vote on Proposals</h4>
              <p className="text-sm">
                Use your HRM tokens as voting power to support or oppose proposals
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold mb-2">Execute Changes</h4>
              <p className="text-sm">
                Successful proposals are automatically executed to improve the platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Proposal Card Component
interface ProposalCardProps {
  proposal: ProposalWithDetails;
  userVotingPower: number;
  onVote: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, userVotingPower, onVote }) => {
  const [voting, setVoting] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState<'for' | 'against' | null>(null);
  const { provider, account } = useWallet();
  const { showAlert } = useAlert();

  const handleVote = async (support: boolean, reason: string) => {
    if (!provider || !account) {
      showAlert('Please connect your wallet to vote', 'error');
      return;
    }

    if (userVotingPower === 0) {
      showAlert('You need HRM tokens to vote', 'error');
      return;
    }

    setVoting(true);
    try {
      const blockchainService = new BlockchainService(provider, await provider.getSigner());
      const txHash = await blockchainService.castVote(proposal.id, support, reason);

      showAlert('Vote submitted successfully!', 'success');
      setShowVoteModal(null);
      onVote(); // Refresh proposals
    } catch (error: any) {
      showAlert(`Failed to vote: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setVoting(false);
    }
  };

  const getStateColor = (state: ProposalWithDetails['state']) => {
    switch (state) {
      case 'active': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'succeeded': return 'bg-blue-600 text-white';
      case 'defeated': return 'bg-red-600 text-white';
      case 'executed': return 'bg-purple-600 text-white';
      case 'cancelled': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getProposalTypeName = (type: number) => {
    const types = ['Text Proposal', 'Parameter Change', 'Treasury Allocation', 'Property Verification', 'Emergency Action'];
    return types[type] || 'Unknown';
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Ended';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  };

  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(proposal.state)}`}>
              {proposal.state.toUpperCase()}
            </span>
            <span className="text-gray-400 text-sm">
              {getProposalTypeName(proposal.proposalType)}
            </span>
            <span className="text-gray-400 text-sm">
              #{proposal.id}
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2">{proposal.title}</h3>
          <p className="text-gray-300 mb-4 line-clamp-3">{proposal.description}</p>
        </div>
      </div>

      {/* Voting Results */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Voting Results</span>
          <span className="text-sm text-gray-400">
            {totalVotes.toLocaleString()} votes • {proposal.participationRate.toFixed(1)}% participation
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-16 text-sm text-green-400">For:</div>
            <div className="flex-1 bg-gray-700 rounded-full h-3 mx-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${forPercentage}%` }}
              ></div>
            </div>
            <div className="w-20 text-sm text-right">
              {proposal.forVotes.toLocaleString()} ({forPercentage.toFixed(1)}%)
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-16 text-sm text-red-400">Against:</div>
            <div className="flex-1 bg-gray-700 rounded-full h-3 mx-3">
              <div
                className="bg-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${againstPercentage}%` }}
              ></div>
            </div>
            <div className="w-20 text-sm text-right">
              {proposal.againstVotes.toLocaleString()} ({againstPercentage.toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Quorum Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Quorum Progress</span>
            <span>{totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()} required</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(proposal.participationRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Proposal Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-400">Proposer:</span>
          <div className="font-medium">{proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-6)}</div>
        </div>
        <div>
          <span className="text-gray-400">Start Date:</span>
          <div className="font-medium">{new Date(proposal.startTime).toLocaleDateString()}</div>
        </div>
        <div>
          <span className="text-gray-400">End Date:</span>
          <div className="font-medium">{new Date(proposal.endTime).toLocaleDateString()}</div>
        </div>
        <div>
          <span className="text-gray-400">Time Remaining:</span>
          <div className="font-medium">{formatTimeRemaining(proposal.timeRemaining)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {proposal.state === 'active' && (
          <>
            <button
              onClick={() => setShowVoteModal('for')}
              disabled={voting || userVotingPower === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Vote For
            </button>
            <button
              onClick={() => setShowVoteModal('against')}
              disabled={voting || userVotingPower === 0}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Vote Against
            </button>
          </>
        )}
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors">
          View Details
        </button>
      </div>

      {/* Vote Modal */}
      {showVoteModal && (
        <VoteModal
          support={showVoteModal === 'for'}
          onClose={() => setShowVoteModal(null)}
          onSubmit={handleVote}
          voting={voting}
          proposal={proposal}
          userVotingPower={userVotingPower}
        />
      )}
    </div>
  );
};

// Vote Modal Component
interface VoteModalProps {
  support: boolean;
  onClose: () => void;
  onSubmit: (support: boolean, reason: string) => void;
  voting: boolean;
  proposal: ProposalWithDetails;
  userVotingPower: number;
}

const VoteModal: React.FC<VoteModalProps> = ({ support, onClose, onSubmit, voting, proposal, userVotingPower }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(support, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">
          Vote {support ? 'For' : 'Against'} Proposal #{proposal.id}
        </h3>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">{proposal.title}</p>
          <div className="text-sm text-gray-400">
            Your voting power: {userVotingPower.toLocaleString()} HRM
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reason for voting (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Explain your vote..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={voting || !reason.trim()}
            className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
              support
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600'
            } text-white`}
          >
            {voting ? 'Submitting...' : `Vote ${support ? 'For' : 'Against'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Proposal Modal Component
interface CreateProposalModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userVotingPower: number;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({ onClose, onSuccess, userVotingPower }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposalType: 0,
    executionData: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { provider, account } = useWallet();
  const { showAlert } = useAlert();

  const handleSubmit = async () => {
    if (!provider || !account) {
      showAlert('Please connect your wallet', 'error');
      return;
    }

    if (!formData.title || !formData.description) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    if (userVotingPower < 10000) {
      showAlert('You need at least 10,000 HRM tokens to create a proposal', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const blockchainService = new BlockchainService(provider, await provider.getSigner());
      const txHash = await blockchainService.createProposal(
        formData.title,
        formData.description,
        formData.proposalType,
        formData.executionData || '0x'
      );

      showAlert('Proposal created successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showAlert(`Failed to create proposal: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-semibold mb-6">Create New Proposal</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proposal Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Brief title for your proposal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proposal Type
            </label>
            <select
              value={formData.proposalType}
              onChange={(e) => setFormData(prev => ({ ...prev, proposalType: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={0}>Text Proposal</option>
              <option value={1}>Parameter Change</option>
              <option value={2}>Treasury Allocation</option>
              <option value={3}>Property Verification</option>
              <option value={4}>Emergency Action</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Detailed description of your proposal and its impact..."
            />
          </div>

          {formData.proposalType > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Execution Data (Optional)
              </label>
              <input
                type="text"
                value={formData.executionData}
                onChange={(e) => setFormData(prev => ({ ...prev, executionData: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0x... (for parameter changes and execution calls)"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.title || !formData.description || userVotingPower < 10000}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GovernancePage;