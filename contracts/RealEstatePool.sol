// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RealEstatePool
 * @dev Pool contract for managing liquidity and yield farming for property tokens
 */
contract RealEstatePool is Ownable, ReentrancyGuard {
    IERC20 public hrmToken;
    IERC20 public propertyToken;
    
    struct PoolInfo {
        uint256 totalHRMDeposited;
        uint256 totalPropertyTokens;
        uint256 rewardRate;
        uint256 lastUpdateTime;
    }
    
    struct UserInfo {
        uint256 hrmDeposited;
        uint256 propertyTokensOwned;
        uint256 rewardsEarned;
        uint256 lastClaimTime;
    }
    
    PoolInfo public poolInfo;
    mapping(address => UserInfo) public userInfo;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 rewards);
    
    constructor(address _hrmToken, address _propertyToken) {
        hrmToken = IERC20(_hrmToken);
        propertyToken = IERC20(_propertyToken);
        poolInfo.rewardRate = 5; // 5% annual reward rate
        poolInfo.lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Deposit HRM tokens to the pool
     */
    function depositHRM(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserInfo storage user = userInfo[msg.sender];
        
        // Transfer HRM tokens from user
        hrmToken.transferFrom(msg.sender, address(this), amount);
        
        // Update user info
        user.hrmDeposited += amount;
        poolInfo.totalHRMDeposited += amount;
        
        emit Deposited(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw HRM tokens from the pool
     */
    function withdrawHRM(uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.hrmDeposited >= amount, "Insufficient deposited amount");
        
        // Update user info
        user.hrmDeposited -= amount;
        poolInfo.totalHRMDeposited -= amount;
        
        // Transfer HRM tokens back to user
        hrmToken.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Calculate rewards for a user
     */
    function calculateRewards(address userAddress) public view returns (uint256) {
        UserInfo memory user = userInfo[userAddress];
        if (user.hrmDeposited == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - user.lastClaimTime;
        uint256 yearlyReward = (user.hrmDeposited * poolInfo.rewardRate) / 100;
        uint256 reward = (yearlyReward * timeElapsed) / 365 days;
        
        return reward + user.rewardsEarned;
    }
    
    /**
     * @dev Claim rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        UserInfo storage user = userInfo[msg.sender];
        user.rewardsEarned = 0;
        user.lastClaimTime = block.timestamp;
        
        // Mint reward tokens (assuming HRM has mint function)
        // For now, transfer from contract balance
        require(hrmToken.balanceOf(address(this)) >= rewards, "Insufficient reward pool");
        hrmToken.transfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 totalHRMDeposited,
        uint256 totalPropertyTokens,
        uint256 rewardRate
    ) {
        return (
            poolInfo.totalHRMDeposited,
            poolInfo.totalPropertyTokens,
            poolInfo.rewardRate
        );
    }
    
    /**
     * @dev Update reward rate (owner only)
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        poolInfo.rewardRate = newRate;
    }
}