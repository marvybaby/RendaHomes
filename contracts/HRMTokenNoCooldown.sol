// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HRM Token - No Cooldown Version (For Testing)
 * @dev ERC20 token for the RendaHomes platform with unlimited minting
 */
contract HRMTokenNoCooldown is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100000000 * 10**18; // 100 million initial

    // Public minting settings - NO RESTRICTIONS AT ALL
    uint256 public constant PUBLIC_MINT_AMOUNT = 5000 * 10**18; // 5,000 HRM per mint
    bool public publicMintingEnabled = true;

    event PublicMint(address indexed to, uint256 amount);

    constructor() ERC20("RendaHomes Real Estate Token", "HRM") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Public mint function - ANYONE can call this with NO restrictions
     * No cooldowns, no limits, unlimited minting for testing
     */
    function publicMint() external payable {
        require(publicMintingEnabled, "HRM: Public minting disabled");
        require(totalSupply() + PUBLIC_MINT_AMOUNT <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(msg.sender, PUBLIC_MINT_AMOUNT);
        emit PublicMint(msg.sender, PUBLIC_MINT_AMOUNT);

        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }

    /**
     * @dev Mint to specific address - NO restrictions
     */
    function publicMintTo(address to) external payable {
        require(to != address(0), "HRM: Cannot mint to zero address");
        require(publicMintingEnabled, "HRM: Public minting disabled");
        require(totalSupply() + PUBLIC_MINT_AMOUNT <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(to, PUBLIC_MINT_AMOUNT);
        emit PublicMint(to, PUBLIC_MINT_AMOUNT);

        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }

    /**
     * @dev Mint custom amount - NO restrictions
     */
    function mintAmount(uint256 amount) external payable {
        require(publicMintingEnabled, "HRM: Public minting disabled");
        require(amount > 0, "HRM: Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(msg.sender, amount);
        emit PublicMint(msg.sender, amount);

        // Refund any accidentally sent ETH/HBAR
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }

    /**
     * @dev Owner can mint any amount to any address
     */
    function ownerMint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "HRM: Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "HRM: Max supply exceeded");

        _mint(to, amount);
        emit PublicMint(to, amount);
    }

    /**
     * @dev Toggle public minting (owner only)
     */
    function setPublicMinting(bool enabled) external onlyOwner {
        publicMintingEnabled = enabled;
    }

    /**
     * @dev Get token info
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256 maxSupply_,
        uint256 publicMintAmount_,
        bool publicMintingEnabled_
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            PUBLIC_MINT_AMOUNT,
            publicMintingEnabled
        );
    }
}