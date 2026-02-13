// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ProviderRegistry.sol";
import "./JobRegistry.sol";
import "./Escrow.sol";

/**
 * @title ComputeRouter
 * @dev Main orchestration contract for the compute marketplace
 * Integrates ProviderRegistry, JobRegistry, and Escrow with RBAC support
 */
contract ComputeRouter is AccessControl, ReentrancyGuard {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VIEWER_ROLE = keccak256("VIEWER_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    
    ProviderRegistry public providerRegistry;
    JobRegistry public jobRegistry;
    Escrow public escrow;
    IERC20 public usdcToken;
    
    // Convenience mapping for quick lookups
    mapping(address => bool) public isRegisteredProvider;
    
    event ComputeJobCreated(
        bytes32 indexed jobId,
        address indexed buyer,
        address indexed provider,
        uint256 amount,
        bool tracked
    );
    
    event ComputeJobCompleted(
        bytes32 indexed jobId,
        uint256 completedAt
    );
    
    event ProviderRegisteredViaRouter(
        address indexed provider,
        string metadataURI,
        uint256 hourlyRate
    );
    
    event ProviderStatusUpdated(
        address indexed provider,
        bool isActive
    );
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }
    
    modifier onlyProvider() {
        require(isRegisteredProvider[msg.sender], "Not a registered provider");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _usdcToken Address of the USDC token contract
     * @param _admin Address to receive admin role
     */
    constructor(address _usdcToken, address _admin) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        require(_admin != address(0), "Invalid admin address");
        
        usdcToken = IERC20(_usdcToken);
        
        // Deploy child contracts
        providerRegistry = new ProviderRegistry();
        jobRegistry = new JobRegistry();
        escrow = new Escrow(_usdcToken);
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        
        // Set up JobRegistry in Escrow
        escrow.setJobRegistry(address(jobRegistry));
        
        // Transfer ownership of child contracts to this router
        providerRegistry.transferOwnership(address(this));
        jobRegistry.transferOwnership(address(this));
        escrow.transferOwnership(address(this));
    }
    
    /**
     * @dev Register as a compute provider
     * @param metadataURI IPFS/0G Storage URI with provider specifications
     * @param hourlyRate Rate in USDC units per hour (6 decimals)
     */
    function registerProvider(string calldata metadataURI, uint256 hourlyRate) external {
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(hourlyRate > 0, "Rate must be greater than 0");
        require(!isRegisteredProvider[msg.sender], "Already registered as provider");
        
        // Call ProviderRegistry through this contract (as owner)
        providerRegistry.registerProvider(metadataURI, hourlyRate);
        
        isRegisteredProvider[msg.sender] = true;
        
        // Grant user role to provider
        _grantRole(USER_ROLE, msg.sender);
        
        emit ProviderRegisteredViaRouter(msg.sender, metadataURI, hourlyRate);
    }
    
    /**
     * @dev Update provider metadata and rate
     */
    function updateProvider(string calldata metadataURI, uint256 hourlyRate) external onlyProvider {
        providerRegistry.updateProvider(metadataURI, hourlyRate);
    }
    
    /**
     * @dev Toggle provider active status
     */
    function updateProviderStatus(bool isActive) external onlyProvider {
        providerRegistry.updateProviderStatus(isActive);
        emit ProviderStatusUpdated(msg.sender, isActive);
    }
    
    /**
     * @dev Create a new compute job with USDC payment
     * @param provider Address of the compute provider
     * @param amount USDC amount to lock in escrow
     * @param tracked Whether this is a tracked job with reasoning logs
     * @param reasoningHash 0G Storage hash for initial reasoning/context
     * @return jobId Unique identifier for the job
     */
    function createJob(
        address provider,
        uint256 amount,
        bool tracked,
        string calldata reasoningHash
    ) external nonReentrant returns (bytes32 jobId) {
        require(provider != address(0), "Invalid provider address");
        require(amount > 0, "Amount must be greater than 0");
        require(providerRegistry.isActiveProvider(provider), "Provider not active");
        
        // Check USDC allowance
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient USDC allowance");
        
        // Transfer USDC from buyer to this contract first
        bool transferSuccess = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(transferSuccess, "USDC transfer failed");
        
        // Approve escrow to spend USDC
        usdcToken.approve(address(escrow), amount);
        
        // Create job in JobRegistry
        jobId = jobRegistry.createJob(provider, amount, tracked, reasoningHash);
        
        // Lock funds in Escrow (as this contract)
        escrow.lockFunds(jobId, provider, amount);
        
        // Grant user role to buyer if not already granted
        if (!hasRole(USER_ROLE, msg.sender)) {
            _grantRole(USER_ROLE, msg.sender);
        }
        
        emit ComputeJobCreated(jobId, msg.sender, provider, amount, tracked);
        
        return jobId;
    }
    
    /**
     * @dev Provider accepts a job
     */
    function acceptJob(bytes32 jobId) external {
        JobRegistry.Job memory job = jobRegistry.getJob(jobId);
        require(job.provider == msg.sender, "Only assigned provider can accept");
        
        jobRegistry.acceptJob(jobId);
    }
    
    /**
     * @dev Complete a job and release payment
     */
    function completeJob(bytes32 jobId) external nonReentrant {
        JobRegistry.Job memory job = jobRegistry.getJob(jobId);
        require(job.provider == msg.sender, "Only provider can complete");
        require(job.status == JobRegistry.JobStatus.Active, "Job not active");
        
        // Mark job as completed in JobRegistry
        jobRegistry.completeJob(jobId);
        
        // Release funds from escrow
        escrow.releaseFunds(jobId);
        
        // Mark job as settled in JobRegistry
        jobRegistry.settleJob(jobId);
        
        emit ComputeJobCompleted(jobId, block.timestamp);
    }
    
    /**
     * @dev Fail a job (buyer or provider can call)
     */
    function failJob(bytes32 jobId, string calldata reason) external {
        JobRegistry.Job memory job = jobRegistry.getJob(jobId);
        require(
            job.buyer == msg.sender || job.provider == msg.sender,
            "Only buyer or provider"
        );
        
        jobRegistry.failJob(jobId, reason);
    }
    
    /**
     * @dev Request refund after timeout
     */
    function requestRefund(bytes32 jobId) external nonReentrant {
        JobRegistry.Job memory job = jobRegistry.getJob(jobId);
        require(job.buyer == msg.sender, "Only buyer can request refund");
        
        escrow.refund(jobId);
    }
    
    /**
     * @dev Admin can force refund for failed jobs
     */
    function adminRefund(bytes32 jobId) external onlyAdmin nonReentrant {
        escrow.refund(jobId);
    }
    
    // ==================== View Functions ====================
    
    /**
     * @dev Get provider details
     */
    function getProvider(address owner) external view returns (ProviderRegistry.Provider memory) {
        return providerRegistry.getProvider(owner);
    }
    
    /**
     * @dev Get job details
     */
    function getJob(bytes32 jobId) external view returns (JobRegistry.Job memory) {
        return jobRegistry.getJob(jobId);
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(bytes32 jobId) external view returns (Escrow.EscrowData memory) {
        return escrow.getEscrow(jobId);
    }
    
    /**
     * @dev Get all jobs for a buyer
     */
    function getBuyerJobs(address buyer) external view returns (bytes32[] memory) {
        return jobRegistry.getBuyerJobs(buyer);
    }
    
    /**
     * @dev Get all jobs for a provider
     */
    function getProviderJobs(address provider) external view returns (bytes32[] memory) {
        return jobRegistry.getProviderJobs(provider);
    }
    
    /**
     * @dev Check if provider is active
     */
    function isActiveProvider(address provider) external view returns (bool) {
        return providerRegistry.isActiveProvider(provider);
    }
    
    // ==================== Role Management ====================
    
    /**
     * @dev Grant role to account (admin only)
     */
    function grantRole(bytes32 role, address account) public override onlyAdmin {
        _grantRole(role, account);
    }
    
    /**
     * @dev Revoke role from account (admin only)
     */
    function revokeRole(bytes32 role, address account) public override onlyAdmin {
        _revokeRole(role, account);
    }
    
    /**
     * @dev Check if account has role
     */
    function hasRole(bytes32 role, address account) public view override returns (bool) {
        return super.hasRole(role, account);
    }
    
    /**
     * @dev Add viewer role (can view sensitive data in tracked mode)
     */
    function addViewer(address account) external onlyAdmin {
        _grantRole(VIEWER_ROLE, account);
    }
    
    /**
     * @dev Remove viewer role
     */
    function removeViewer(address account) external onlyAdmin {
        _revokeRole(VIEWER_ROLE, account);
    }
}
