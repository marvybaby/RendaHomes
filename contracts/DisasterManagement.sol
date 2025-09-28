// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DisasterManagement
 * @dev Contract for managing disaster reports and insurance claims for properties
 */
contract DisasterManagement is Ownable {
    IERC20 public hrmToken;
    address public propertyTokenContract;
    
    enum DisasterType {
        FLOOD,
        FIRE,
        EARTHQUAKE,
        HURRICANE,
        OTHER
    }
    
    enum ClaimStatus {
        PENDING,
        APPROVED,
        REJECTED,
        PAID
    }
    
    struct DisasterReport {
        uint256 id;
        uint256 propertyId;
        DisasterType disasterType;
        string description;
        uint256 reportedAt;
        address reporter;
        bool verified;
    }
    
    struct InsuranceClaim {
        uint256 id;
        uint256 propertyId;
        uint256 disasterReportId;
        uint256 claimAmount;
        ClaimStatus status;
        string evidence;
        uint256 claimedAt;
        address claimant;
        uint256 approvedAmount;
    }
    
    uint256 public disasterReportCount;
    uint256 public insuranceClaimCount;
    uint256 public insuranceFund;
    
    mapping(uint256 => DisasterReport) public disasterReports;
    mapping(uint256 => InsuranceClaim) public insuranceClaims;
    mapping(uint256 => uint256[]) public propertyDisasters; // propertyId => disaster report IDs
    mapping(address => bool) public authorizedReporters;
    
    event DisasterReported(uint256 indexed reportId, uint256 indexed propertyId, DisasterType disasterType);
    event DisasterVerified(uint256 indexed reportId, bool verified);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed propertyId, uint256 claimAmount);
    event ClaimProcessed(uint256 indexed claimId, ClaimStatus status, uint256 approvedAmount);
    event InsuranceFundDeposit(address indexed depositor, uint256 amount);
    
    constructor(address _hrmToken, address _propertyTokenContract) {
        hrmToken = IERC20(_hrmToken);
        propertyTokenContract = _propertyTokenContract;
        authorizedReporters[owner()] = true;
    }
    
    /**
     * @dev Add funds to the insurance pool
     */
    function depositInsuranceFund(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        hrmToken.transferFrom(msg.sender, address(this), amount);
        insuranceFund += amount;
        
        emit InsuranceFundDeposit(msg.sender, amount);
    }
    
    /**
     * @dev Report a disaster for a property
     */
    function reportDisaster(
        uint256 propertyId,
        DisasterType disasterType,
        string memory description
    ) external returns (uint256) {
        require(authorizedReporters[msg.sender] || msg.sender == owner(), "Not authorized to report disasters");
        
        disasterReportCount++;
        
        disasterReports[disasterReportCount] = DisasterReport({
            id: disasterReportCount,
            propertyId: propertyId,
            disasterType: disasterType,
            description: description,
            reportedAt: block.timestamp,
            reporter: msg.sender,
            verified: false
        });
        
        propertyDisasters[propertyId].push(disasterReportCount);
        
        emit DisasterReported(disasterReportCount, propertyId, disasterType);
        
        return disasterReportCount;
    }
    
    /**
     * @dev Verify a disaster report
     */
    function verifyDisaster(uint256 reportId, bool verified) external onlyOwner {
        require(reportId > 0 && reportId <= disasterReportCount, "Invalid report ID");
        
        disasterReports[reportId].verified = verified;
        
        emit DisasterVerified(reportId, verified);
    }
    
    /**
     * @dev Submit an insurance claim
     */
    function submitClaim(
        uint256 propertyId,
        uint256 disasterReportId,
        uint256 claimAmount,
        string memory evidence
    ) external returns (uint256) {
        require(disasterReportId > 0 && disasterReportId <= disasterReportCount, "Invalid disaster report ID");
        require(disasterReports[disasterReportId].verified, "Disaster report not verified");
        require(disasterReports[disasterReportId].propertyId == propertyId, "Property ID mismatch");
        require(claimAmount > 0, "Claim amount must be greater than 0");
        
        insuranceClaimCount++;
        
        insuranceClaims[insuranceClaimCount] = InsuranceClaim({
            id: insuranceClaimCount,
            propertyId: propertyId,
            disasterReportId: disasterReportId,
            claimAmount: claimAmount,
            status: ClaimStatus.PENDING,
            evidence: evidence,
            claimedAt: block.timestamp,
            claimant: msg.sender,
            approvedAmount: 0
        });
        
        emit ClaimSubmitted(insuranceClaimCount, propertyId, claimAmount);
        
        return insuranceClaimCount;
    }
    
    /**
     * @dev Process an insurance claim
     */
    function processClaim(uint256 claimId, ClaimStatus status, uint256 approvedAmount) external onlyOwner {
        require(claimId > 0 && claimId <= insuranceClaimCount, "Invalid claim ID");
        
        InsuranceClaim storage claim = insuranceClaims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim already processed");
        
        claim.status = status;
        claim.approvedAmount = approvedAmount;
        
        if (status == ClaimStatus.APPROVED && approvedAmount > 0) {
            require(insuranceFund >= approvedAmount, "Insufficient insurance fund");
            
            hrmToken.transfer(claim.claimant, approvedAmount);
            insuranceFund -= approvedAmount;
            claim.status = ClaimStatus.PAID;
        }
        
        emit ClaimProcessed(claimId, status, approvedAmount);
    }
    
    /**
     * @dev Get disaster reports for a property
     */
    function getPropertyDisasters(uint256 propertyId) external view returns (uint256[] memory) {
        return propertyDisasters[propertyId];
    }
    
    /**
     * @dev Get disaster report details
     */
    function getDisasterReport(uint256 reportId) external view returns (
        uint256 id,
        uint256 propertyId,
        DisasterType disasterType,
        string memory description,
        uint256 reportedAt,
        address reporter,
        bool verified
    ) {
        require(reportId > 0 && reportId <= disasterReportCount, "Invalid report ID");
        
        DisasterReport memory report = disasterReports[reportId];
        return (
            report.id,
            report.propertyId,
            report.disasterType,
            report.description,
            report.reportedAt,
            report.reporter,
            report.verified
        );
    }
    
    /**
     * @dev Get insurance claim details
     */
    function getInsuranceClaim(uint256 claimId) external view returns (
        uint256 id,
        uint256 propertyId,
        uint256 disasterReportId,
        uint256 claimAmount,
        ClaimStatus status,
        string memory evidence,
        uint256 claimedAt,
        address claimant,
        uint256 approvedAmount
    ) {
        require(claimId > 0 && claimId <= insuranceClaimCount, "Invalid claim ID");
        
        InsuranceClaim memory claim = insuranceClaims[claimId];
        return (
            claim.id,
            claim.propertyId,
            claim.disasterReportId,
            claim.claimAmount,
            claim.status,
            claim.evidence,
            claim.claimedAt,
            claim.claimant,
            claim.approvedAmount
        );
    }
    
    /**
     * @dev Authorize a reporter
     */
    function authorizeReporter(address reporter) external onlyOwner {
        authorizedReporters[reporter] = true;
    }
    
    /**
     * @dev Revoke reporter authorization
     */
    function revokeReporter(address reporter) external onlyOwner {
        authorizedReporters[reporter] = false;
    }
}