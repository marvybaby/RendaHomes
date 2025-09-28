// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title HRM Token - RendaHomes Real Estate Monetization Token
 * @dev ERC20 token for the RendaHomes real estate tokenization platform
 */
contract HRMToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100000000 * 10**18; // 100 million initial
    uint256 public constant MINT_COOLDOWN = 1 hours; // 1 hour cooldown between mints

    mapping(address => bool) public whitelist;
    mapping(address => bool) public propertyContracts;
    mapping(address => uint256) public lastMintTime;

    // Public minting settings - NO RESTRICTIONS
    uint256 public constant PUBLIC_MINT_AMOUNT = 5000 * 10**18; // 5,000 HRM per mint
    bool public publicMintingEnabled = true; // Always enabled
    
    event WhitelistUpdated(address indexed account, bool status);
    event PropertyContractAdded(address indexed contractAddr);
    event PropertyContractRemoved(address indexed contractAddr);
    event PublicMint(address indexed to, uint256 amount);
    
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "HRM: Address not whitelisted");
        _;
    }
    
    modifier onlyPropertyContract() {
        require(propertyContracts[msg.sender], "HRM: Only property contracts");
        _;
    }
    
    modifier canPublicMint() {
        require(publicMintingEnabled, "HRM: Public minting disabled");
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "HRM: Must wait before next mint"
        );
        _;
    }
    
    constructor() ERC20("RendaHomes Real Estate Token", "HRM") {
        _mint(msg.sender, INITIAL_SUPPLY);
        whitelist[msg.sender] = true;
    }
    
    /**
     * @dev Mint new tokens - UNRESTRICTED ACCESS
     */
    function mint(address to, uint256 amount) public {
        require(totalSupply() + amount <= MAX_SUPPLY, "HRM: Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Public mint function - NO RESTRICTIONS, NO COOLDOWN
     */
    function publicMint() external payable {
        require(totalSupply() + PUBLIC_MINT_AMOUNT <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(msg.sender, PUBLIC_MINT_AMOUNT);
        lastMintTime[msg.sender] = block.timestamp;

        emit PublicMint(msg.sender, PUBLIC_MINT_AMOUNT);

        // Users only pay gas, no token cost
        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }
    
    /**
     * @dev Mint tokens to a specific address - NO RESTRICTIONS
     */
    function publicMintTo(address to) external payable {
        require(to != address(0), "HRM: Cannot mint to zero address");
        require(totalSupply() + PUBLIC_MINT_AMOUNT <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(to, PUBLIC_MINT_AMOUNT);
        lastMintTime[to] = block.timestamp;

        emit PublicMint(to, PUBLIC_MINT_AMOUNT);

        // Users only pay gas, no token cost
        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }
    
    /**
     * @dev Mint custom amount - ANYONE can mint any amount
     */
    function mintAmount(uint256 amount) external payable {
        require(amount > 0, "HRM: Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(msg.sender, amount);
        lastMintTime[msg.sender] = block.timestamp;
        emit PublicMint(msg.sender, amount);

        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }

    /**
     * @dev Mint custom amount to specific address
     */
    function mintAmountTo(address to, uint256 amount) external payable {
        require(to != address(0), "HRM: Cannot mint to zero address");
        require(amount > 0, "HRM: Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(to, amount);
        lastMintTime[to] = block.timestamp;
        emit PublicMint(to, amount);

        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }
    
    /**
     * @dev Add address to whitelist
     */
    function addToWhitelist(address account) public onlyOwner {
        whitelist[account] = true;
        emit WhitelistUpdated(account, true);
    }
    
    /**
     * @dev Remove address from whitelist
     */
    function removeFromWhitelist(address account) public onlyOwner {
        whitelist[account] = false;
        emit WhitelistUpdated(account, false);
    }
    
    /**
     * @dev Add property contract address
     */
    function addPropertyContract(address contractAddr) public onlyOwner {
        propertyContracts[contractAddr] = true;
        emit PropertyContractAdded(contractAddr);
    }
    
    /**
     * @dev Remove property contract address
     */
    function removePropertyContract(address contractAddr) public onlyOwner {
        propertyContracts[contractAddr] = false;
        emit PropertyContractRemoved(contractAddr);
    }
    
    /**
     * @dev Toggle public minting on/off
     */
    function togglePublicMinting() public onlyOwner {
        publicMintingEnabled = !publicMintingEnabled;
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer - UNRESTRICTED TRANSFERS
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused override {
        // Allow all transfers when not paused
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Get time until next mint for a user
     */
    function getTimeUntilNextMint(address user) external view returns (uint256) {
        if (lastMintTime[user] == 0) {
            return 0; // Never minted, can mint immediately
        }

        uint256 nextMintTime = lastMintTime[user] + MINT_COOLDOWN;
        if (block.timestamp >= nextMintTime) {
            return 0; // Can mint now
        }

        return nextMintTime - block.timestamp;
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}