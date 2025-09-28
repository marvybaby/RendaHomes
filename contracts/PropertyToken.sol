// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PropertyToken - Individual Property NFT with Fractional Ownership
 * @dev Each property is an NFT that can be fractionalized into tokens
 */
contract PropertyToken is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    struct Property {
        uint256 id;
        string metadataURI;
        uint256 totalValue;
        uint256 totalTokens;
        uint256 availableTokens;
        uint256 tokenPrice;
        address propertyOwner;
        bool isActive;
        bool isVerified;
        uint256 createdAt;
        PropertyType propertyType;
        RiskLevel riskLevel;
    }
    
    struct Investment {
        address investor;
        uint256 tokensOwned;
        uint256 investmentAmount;
        uint256 purchaseDate;
    }
    
    enum PropertyType { Residential, Commercial, Industrial, Mixed }
    enum RiskLevel { Low, Medium, High }
    
    Counters.Counter private _tokenIdCounter;
    IERC20 public hrmToken;
    
    mapping(uint256 => Property) public properties;
    mapping(uint256 => mapping(address => Investment)) public investments;
    mapping(uint256 => address[]) public propertyInvestors;
    mapping(address => uint256[]) public investorProperties;
    
    uint256 public constant MIN_INVESTMENT = 100 * 10**18; // 100 HRM minimum
    uint256 public platformFeePercent = 250; // 2.5%
    address public feeRecipient;
    
    event PropertyListed(
        uint256 indexed propertyId,
        address indexed owner,
        uint256 totalValue,
        uint256 tokenPrice
    );
    
    event TokensPurchased(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 tokens,
        uint256 amount
    );
    
    event PropertyVerified(uint256 indexed propertyId);
    event RentalIncomeDistributed(uint256 indexed propertyId, uint256 totalAmount);
    
    modifier propertyExists(uint256 propertyId) {
        require(propertyId < _tokenIdCounter.current(), "Property does not exist");
        _;
    }
    
    modifier propertyActive(uint256 propertyId) {
        require(properties[propertyId].isActive, "Property not active");
        _;
    }
    
    constructor(address _hrmToken, address _feeRecipient) ERC721("RendaHomes Property", "RHP") {
        hrmToken = IERC20(_hrmToken);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev List a new property for tokenization
     */
    function listProperty(
        string memory metadataURI,
        uint256 totalValue,
        uint256 totalTokens,
        PropertyType propertyType,
        RiskLevel riskLevel
    ) public returns (uint256) {
        require(totalValue > 0, "Invalid property value");
        require(totalTokens > 0, "Invalid token amount");
        
        uint256 propertyId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        uint256 tokenPrice = totalValue / totalTokens;
        
        properties[propertyId] = Property({
            id: propertyId,
            metadataURI: metadataURI,
            totalValue: totalValue,
            totalTokens: totalTokens,
            availableTokens: totalTokens,
            tokenPrice: tokenPrice,
            propertyOwner: msg.sender,
            isActive: false, // Requires verification
            isVerified: false,
            createdAt: block.timestamp,
            propertyType: propertyType,
            riskLevel: riskLevel
        });
        
        _safeMint(msg.sender, propertyId);
        _setTokenURI(propertyId, metadataURI);
        
        emit PropertyListed(propertyId, msg.sender, totalValue, tokenPrice);
        return propertyId;
    }
    
    /**
     * @dev Verify and activate a property (only owner)
     */
    function verifyProperty(uint256 propertyId) public onlyOwner propertyExists(propertyId) {
        properties[propertyId].isVerified = true;
        properties[propertyId].isActive = true;
        emit PropertyVerified(propertyId);
    }
    
    /**
     * @dev Purchase property tokens
     */
    function purchaseTokens(uint256 propertyId, uint256 tokens) 
        public 
        nonReentrant 
        propertyExists(propertyId) 
        propertyActive(propertyId) 
    {
        Property storage property = properties[propertyId];
        require(tokens > 0, "Invalid token amount");
        require(tokens <= property.availableTokens, "Not enough tokens available");
        
        uint256 cost = tokens * property.tokenPrice;
        require(cost >= MIN_INVESTMENT, "Below minimum investment");
        require(hrmToken.balanceOf(msg.sender) >= cost, "Insufficient HRM balance");
        
        // Calculate platform fee
        uint256 fee = (cost * platformFeePercent) / 10000;
        uint256 netAmount = cost - fee;
        
        // Transfer HRM tokens
        require(hrmToken.transferFrom(msg.sender, address(this), cost), "Transfer failed");
        require(hrmToken.transfer(feeRecipient, fee), "Fee transfer failed");
        require(hrmToken.transfer(property.propertyOwner, netAmount), "Payment failed");
        
        // Update investment records
        if (investments[propertyId][msg.sender].investor == address(0)) {
            propertyInvestors[propertyId].push(msg.sender);
            investorProperties[msg.sender].push(propertyId);
        }
        
        investments[propertyId][msg.sender].investor = msg.sender;
        investments[propertyId][msg.sender].tokensOwned += tokens;
        investments[propertyId][msg.sender].investmentAmount += netAmount;
        investments[propertyId][msg.sender].purchaseDate = block.timestamp;
        
        property.availableTokens -= tokens;
        
        emit TokensPurchased(propertyId, msg.sender, tokens, cost);
    }
    
    /**
     * @dev Distribute rental income to token holders
     */
    function distributeRentalIncome(uint256 propertyId, uint256 totalIncome) 
        public 
        onlyOwner 
        propertyExists(propertyId) 
    {
        Property storage property = properties[propertyId];
        require(totalIncome > 0, "Invalid income amount");
        require(hrmToken.balanceOf(address(this)) >= totalIncome, "Insufficient contract balance");
        
        address[] memory investors = propertyInvestors[propertyId];
        uint256 totalDistributed = property.totalTokens - property.availableTokens;
        
        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 tokensOwned = investments[propertyId][investor].tokensOwned;
            
            if (tokensOwned > 0) {
                uint256 share = (totalIncome * tokensOwned) / totalDistributed;
                require(hrmToken.transfer(investor, share), "Distribution failed");
            }
        }
        
        emit RentalIncomeDistributed(propertyId, totalIncome);
    }
    
    /**
     * @dev Get property details
     */
    function getProperty(uint256 propertyId) 
        public 
        view 
        propertyExists(propertyId) 
        returns (Property memory) 
    {
        return properties[propertyId];
    }
    
    /**
     * @dev Get investor's holdings for a property
     */
    function getInvestment(uint256 propertyId, address investor) 
        public 
        view 
        returns (Investment memory) 
    {
        return investments[propertyId][investor];
    }
    
    /**
     * @dev Get all properties an investor has invested in
     */
    function getInvestorProperties(address investor) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return investorProperties[investor];
    }
    
    /**
     * @dev Get all investors for a property
     */
    function getPropertyInvestors(uint256 propertyId) 
        public 
        view 
        returns (address[] memory) 
    {
        return propertyInvestors[propertyId];
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function setPlatformFee(uint256 newFeePercent) public onlyOwner {
        require(newFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = newFeePercent;
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function setFeeRecipient(address newRecipient) public onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // =================== MARKETPLACE FUNCTIONALITY ===================
    
    struct SellOrder {
        uint256 id;
        uint256 propertyId;
        address seller;
        uint256 tokensForSale;
        uint256 pricePerToken;
        uint256 totalPrice;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    mapping(uint256 => SellOrder) public sellOrders;
    mapping(uint256 => uint256[]) public propertySellOrders;
    mapping(address => uint256[]) public userSellOrders;
    uint256 public sellOrderCounter;
    
    event SellOrderCreated(
        uint256 indexed orderId,
        uint256 indexed propertyId,
        address indexed seller,
        uint256 tokensForSale,
        uint256 pricePerToken
    );
    
    event SellOrderCancelled(uint256 indexed orderId, address indexed seller);
    
    event TokensSold(
        uint256 indexed orderId,
        uint256 indexed propertyId,
        address indexed seller,
        address buyer,
        uint256 tokens,
        uint256 totalPrice
    );
    
    /**
     * @dev Create a sell order for property tokens
     */
    function createSellOrder(
        uint256 propertyId,
        uint256 tokensForSale,
        uint256 pricePerToken,
        uint256 durationDays
    ) public propertyExists(propertyId) nonReentrant returns (uint256) {
        require(tokensForSale > 0, "Invalid token amount");
        require(pricePerToken > 0, "Invalid price");
        require(durationDays > 0 && durationDays <= 90, "Invalid duration");
        
        Investment storage investment = investments[propertyId][msg.sender];
        require(investment.tokensOwned >= tokensForSale, "Insufficient tokens");
        
        uint256 orderId = sellOrderCounter++;
        uint256 totalPrice = tokensForSale * pricePerToken;
        uint256 expiresAt = block.timestamp + (durationDays * 1 days);
        
        sellOrders[orderId] = SellOrder({
            id: orderId,
            propertyId: propertyId,
            seller: msg.sender,
            tokensForSale: tokensForSale,
            pricePerToken: pricePerToken,
            totalPrice: totalPrice,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        propertySellOrders[propertyId].push(orderId);
        userSellOrders[msg.sender].push(orderId);
        
        emit SellOrderCreated(orderId, propertyId, msg.sender, tokensForSale, pricePerToken);
        return orderId;
    }
    
    /**
     * @dev Buy tokens from a sell order
     */
    function buyFromOrder(uint256 orderId, uint256 tokensToBuy) 
        public 
        nonReentrant 
    {
        SellOrder storage order = sellOrders[orderId];
        require(order.isActive, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        require(tokensToBuy > 0 && tokensToBuy <= order.tokensForSale, "Invalid token amount");
        require(msg.sender != order.seller, "Cannot buy own order");
        
        Investment storage sellerInvestment = investments[order.propertyId][order.seller];
        require(sellerInvestment.tokensOwned >= tokensToBuy, "Seller insufficient tokens");
        
        uint256 totalCost = tokensToBuy * order.pricePerToken;
        require(hrmToken.balanceOf(msg.sender) >= totalCost, "Insufficient HRM balance");
        
        // Process payment
        _processBuyOrderPayment(totalCost, order.seller);
        
        // Update investments
        _updateBuyOrderInvestments(order.propertyId, order.seller, msg.sender, tokensToBuy, totalCost);
        
        // Update sell order
        order.tokensForSale -= tokensToBuy;
        if (order.tokensForSale == 0) {
            order.isActive = false;
        }
        
        emit TokensSold(orderId, order.propertyId, order.seller, msg.sender, tokensToBuy, totalCost);
    }
    
    /**
     * @dev Internal function to process buy order payment
     */
    function _processBuyOrderPayment(uint256 totalCost, address seller) internal {
        uint256 fee = (totalCost * platformFeePercent) / 10000;
        uint256 netAmount = totalCost - fee;
        
        require(hrmToken.transferFrom(msg.sender, address(this), totalCost), "Transfer failed");
        require(hrmToken.transfer(feeRecipient, fee), "Fee transfer failed");
        require(hrmToken.transfer(seller, netAmount), "Payment failed");
    }
    
    /**
     * @dev Internal function to update investments for buy orders
     */
    function _updateBuyOrderInvestments(
        uint256 propertyId, 
        address seller, 
        address buyer, 
        uint256 tokensToBuy,
        uint256 totalCost
    ) internal {
        uint256 fee = (totalCost * platformFeePercent) / 10000;
        uint256 netAmount = totalCost - fee;
        
        // Update seller's investment
        investments[propertyId][seller].tokensOwned -= tokensToBuy;
        
        // Update buyer's investment
        if (investments[propertyId][buyer].investor == address(0)) {
            propertyInvestors[propertyId].push(buyer);
            investorProperties[buyer].push(propertyId);
        }
        
        investments[propertyId][buyer].investor = buyer;
        investments[propertyId][buyer].tokensOwned += tokensToBuy;
        investments[propertyId][buyer].investmentAmount += netAmount;
        investments[propertyId][buyer].purchaseDate = block.timestamp;
    }
    
    /**
     * @dev Cancel a sell order
     */
    function cancelSellOrder(uint256 orderId) public {
        SellOrder storage order = sellOrders[orderId];
        require(order.seller == msg.sender || msg.sender == owner(), "Not authorized");
        require(order.isActive, "Order not active");
        
        order.isActive = false;
        emit SellOrderCancelled(orderId, order.seller);
    }
    
    /**
     * @dev Get sell orders for a property
     */
    function getPropertySellOrders(uint256 propertyId) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return propertySellOrders[propertyId];
    }
    
    /**
     * @dev Get user's sell orders
     */
    function getUserSellOrders(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return userSellOrders[user];
    }
    
    /**
     * @dev Get sell order details
     */
    function getSellOrder(uint256 orderId) 
        public 
        view 
        returns (SellOrder memory) 
    {
        return sellOrders[orderId];
    }
    
    /**
     * @dev Get all active sell orders for a property
     */
    function getActiveSellOrders(uint256 propertyId) 
        public 
        view 
        returns (SellOrder[] memory) 
    {
        uint256[] memory orderIds = propertySellOrders[propertyId];
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (sellOrders[orderIds[i]].isActive && block.timestamp <= sellOrders[orderIds[i]].expiresAt) {
                activeCount++;
            }
        }
        
        // Create array of active orders
        SellOrder[] memory activeOrders = new SellOrder[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            SellOrder memory order = sellOrders[orderIds[i]];
            if (order.isActive && block.timestamp <= order.expiresAt) {
                activeOrders[index] = order;
                index++;
            }
        }
        
        return activeOrders;
    }

    // =================== ENHANCED QUERY FUNCTIONS ===================
    
    /**
     * @dev Get all properties (with pagination)
     */
    function getAllProperties(uint256 offset, uint256 limit) 
        public 
        view 
        returns (Property[] memory properties_) 
    {
        uint256 totalProperties = _tokenIdCounter.current();
        require(offset < totalProperties, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > totalProperties) {
            end = totalProperties;
        }
        
        properties_ = new Property[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            properties_[i - offset] = properties[i];
        }
    }
    
    /**
     * @dev Get investor's complete portfolio
     */
    function getInvestorPortfolio(address investor) 
        public 
        view 
        returns (
            uint256[] memory propertyIds,
            uint256[] memory tokensOwned,
            uint256[] memory investmentAmounts,
            uint256 totalInvested
        ) 
    {
        uint256[] memory investorProps = investorProperties[investor];
        propertyIds = new uint256[](investorProps.length);
        tokensOwned = new uint256[](investorProps.length);
        investmentAmounts = new uint256[](investorProps.length);
        
        for (uint256 i = 0; i < investorProps.length; i++) {
            uint256 propId = investorProps[i];
            Investment memory investment = investments[propId][investor];
            
            propertyIds[i] = propId;
            tokensOwned[i] = investment.tokensOwned;
            investmentAmounts[i] = investment.investmentAmount;
            totalInvested += investment.investmentAmount;
        }
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() 
        public 
        view 
        returns (
            uint256 totalProperties,
            uint256 activeProperties,
            uint256 totalValueLocked,
            uint256 totalTokensSold,
            uint256 totalInvestors
        ) 
    {
        totalProperties = _tokenIdCounter.current();
        
        for (uint256 i = 0; i < totalProperties; i++) {
            Property memory prop = properties[i];
            if (prop.isActive && prop.isVerified) {
                activeProperties++;
                totalValueLocked += prop.totalValue;
                totalTokensSold += (prop.totalTokens - prop.availableTokens);
            }
        }
        
        // Note: totalInvestors is approximate - would need separate tracking for exact count
        totalInvestors = totalTokensSold / 10; // Rough estimate
    }
}