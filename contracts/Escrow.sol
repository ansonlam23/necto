// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Escrow
 * @dev Handles USDC payment locking and release with timeout/refund support
 */
contract Escrow is ReentrancyGuard, Ownable {
    
    enum EscrowStatus {
        Locked,     // Funds locked, job in progress
        Released,   // Funds released to provider
        Refunded    // Funds refunded to buyer
    }
    
    struct EscrowData {
        bytes32 jobId;
        address buyer;
        address provider;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 timeoutAt;
    }
    
    mapping(bytes32 => EscrowData) public escrows;
    IERC20 public usdcToken;
    
    uint256 public constant REFUND_TIMEOUT = 7 days;
    
    address public jobRegistry;
    
    event FundsLocked(
        bytes32 indexed jobId,
        address indexed buyer,
        address indexed provider,
        uint256 amount,
        uint256 timeoutAt
    );
    
    event FundsReleased(
        bytes32 indexed jobId,
        address indexed provider,
        uint256 amount,
        uint256 releasedAt
    );
    
    event FundsRefunded(
        bytes32 indexed jobId,
        address indexed buyer,
        uint256 amount,
        uint256 refundedAt
    );
    
    modifier onlyJobRegistry() {
        require(msg.sender == jobRegistry, "Only JobRegistry can call");
        _;
    }
    
    modifier escrowExists(bytes32 jobId) {
        require(escrows[jobId].jobId == jobId, "Escrow does not exist");
        _;
    }
    
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @dev Set JobRegistry address (called once after deployment)
     */
    function setJobRegistry(address _jobRegistry) external onlyOwner {
        require(_jobRegistry != address(0), "Invalid JobRegistry address");
        require(jobRegistry == address(0), "JobRegistry already set");
        jobRegistry = _jobRegistry;
    }
    
    /**
     * @dev Lock USDC funds for a job
     * @param jobId Unique job identifier
     * @param provider Address of the compute provider
     * @param amount USDC amount to lock
     */
    function lockFunds(
        bytes32 jobId,
        address provider,
        uint256 amount
    ) external nonReentrant {
        require(provider != address(0), "Invalid provider address");
        require(amount > 0, "Amount must be greater than 0");
        require(escrows[jobId].jobId != jobId, "Escrow already exists");
        
        // Transfer USDC from buyer to this contract
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        escrows[jobId] = EscrowData({
            jobId: jobId,
            buyer: msg.sender,
            provider: provider,
            amount: amount,
            status: EscrowStatus.Locked,
            createdAt: block.timestamp,
            timeoutAt: block.timestamp + REFUND_TIMEOUT
        });
        
        emit FundsLocked(jobId, msg.sender, provider, amount, block.timestamp + REFUND_TIMEOUT);
    }
    
    /**
     * @dev Release funds to provider after job completion
     */
    function releaseFunds(bytes32 jobId) external onlyJobRegistry nonReentrant escrowExists(jobId) {
        EscrowData storage escrow = escrows[jobId];
        require(escrow.status == EscrowStatus.Locked, "Funds not locked");
        
        escrow.status = EscrowStatus.Released;
        
        // Transfer USDC to provider
        bool success = usdcToken.transfer(escrow.provider, escrow.amount);
        require(success, "USDC transfer to provider failed");
        
        emit FundsReleased(jobId, escrow.provider, escrow.amount, block.timestamp);
    }
    
    /**
     * @dev Refund funds to buyer if job failed or timeout reached
     */
    function refund(bytes32 jobId) external nonReentrant escrowExists(jobId) {
        EscrowData storage escrow = escrows[jobId];
        require(escrow.status == EscrowStatus.Locked, "Funds not locked");
        require(
            msg.sender == escrow.buyer || msg.sender == owner(),
            "Only buyer or owner can refund"
        );
        
        // Allow refund if timeout reached OR if called by owner (job failed)
        if (msg.sender == escrow.buyer) {
            require(block.timestamp >= escrow.timeoutAt, "Refund timeout not reached");
        }
        
        escrow.status = EscrowStatus.Refunded;
        
        // Transfer USDC back to buyer
        bool success = usdcToken.transfer(escrow.buyer, escrow.amount);
        require(success, "USDC refund failed");
        
        emit FundsRefunded(jobId, escrow.buyer, escrow.amount, block.timestamp);
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(bytes32 jobId) external view returns (EscrowData memory) {
        return escrows[jobId];
    }
    
    /**
     * @dev Check if refund is available (timeout reached)
     */
    function isRefundAvailable(bytes32 jobId) external view escrowExists(jobId) returns (bool) {
        return block.timestamp >= escrows[jobId].timeoutAt;
    }
    
    /**
     * @dev Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(usdcToken), "Cannot withdraw locked USDC");
        IERC20(token).transfer(owner(), amount);
    }
}
