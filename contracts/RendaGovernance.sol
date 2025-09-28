// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RendaGovernance
 * @dev Governance contract for RendaHomes DAO
 */
contract RendaGovernance is Ownable {
    IERC20 public hrmToken;
    
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool passed;
    }
    
    struct Vote {
        bool hasVoted;
        bool support;
        uint256 votingPower;
    }
    
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_VOTING_POWER = 100 * 10**18; // 100 HRM minimum
    uint256 public constant QUORUM_PERCENTAGE = 20; // 20% quorum required
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    
    constructor(address _hrmToken) {
        hrmToken = IERC20(_hrmToken);
    }
    
    /**
     * @dev Create a new governance proposal
     */
    function createProposal(string memory title, string memory description) external {
        require(hrmToken.balanceOf(msg.sender) >= MIN_VOTING_POWER, "Insufficient HRM balance to create proposal");
        
        proposalCount++;
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: title,
            description: description,
            proposer: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            executed: false,
            passed: false
        });
        
        emit ProposalCreated(proposalCount, msg.sender, title);
    }
    
    /**
     * @dev Cast a vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Voting period has ended");
        require(!votes[proposalId][msg.sender].hasVoted, "Already voted");
        
        uint256 votingPower = hrmToken.balanceOf(msg.sender);
        require(votingPower >= MIN_VOTING_POWER, "Insufficient HRM balance to vote");
        
        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            votingPower: votingPower
        });
        
        if (support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    /**
     * @dev Execute a proposal after voting period ends
     */
    function executeProposal(uint256 proposalId) external {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 totalSupply = hrmToken.totalSupply();
        uint256 quorum = (totalSupply * QUORUM_PERCENTAGE) / 100;
        
        bool passed = totalVotes >= quorum && proposal.votesFor > proposal.votesAgainst;
        
        proposal.executed = true;
        proposal.passed = passed;
        
        emit ProposalExecuted(proposalId, passed);
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        address proposer,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        bool passed
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.passed
        );
    }
    
    /**
     * @dev Check if user has voted on a proposal
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return votes[proposalId][voter].hasVoted;
    }
    
    /**
     * @dev Get vote details
     */
    function getVote(uint256 proposalId, address voter) external view returns (bool voted, bool support, uint256 votingPower) {
        Vote memory userVote = votes[proposalId][voter];
        return (userVote.hasVoted, userVote.support, userVote.votingPower);
    }
}