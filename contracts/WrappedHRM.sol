// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WrappedHRM
 * @dev Wrapped version of HRM token for DeFi integrations
 */
contract WrappedHRM is ERC20, Ownable, ReentrancyGuard {
    address public hrmTokenAddress;
    
    event Wrapped(address indexed user, uint256 amount);
    event Unwrapped(address indexed user, uint256 amount);
    
    constructor(address _hrmTokenAddress) ERC20("Wrapped HRM", "wHRM") {
        hrmTokenAddress = _hrmTokenAddress;
    }
    
    /**
     * @dev Wrap HRM tokens to wHRM
     */
    function wrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer HRM tokens from user to this contract
        IERC20(hrmTokenAddress).transferFrom(msg.sender, address(this), amount);
        
        // Mint equivalent wHRM tokens
        _mint(msg.sender, amount);
        
        emit Wrapped(msg.sender, amount);
    }
    
    /**
     * @dev Unwrap wHRM tokens back to HRM
     */
    function unwrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient wHRM balance");
        
        // Burn wHRM tokens
        _burn(msg.sender, amount);
        
        // Transfer HRM tokens back to user
        IERC20(hrmTokenAddress).transfer(msg.sender, amount);
        
        emit Unwrapped(msg.sender, amount);
    }
    
    /**
     * @dev Get the underlying HRM token balance
     */
    function getHRMBalance() external view returns (uint256) {
        return IERC20(hrmTokenAddress).balanceOf(address(this));
    }
}