// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JobRegistry
 * @dev Manages compute job lifecycle and status tracking
 */
contract JobRegistry is Ownable {
    
    enum JobStatus {
        Pending,    // Job created, waiting for provider
        Active,     // Provider accepted, work in progress
        Completed,  // Work done, payment pending
        Failed,     // Job failed/cancelled
        Settled     // Payment released, job closed
    }
    
    struct Job {
        bytes32 id;
        address buyer;
        address provider;
        uint256 amount;         // USDC amount locked in escrow
        JobStatus status;
        bool tracked;           // Tracked mode with reasoning logs
        uint256 createdAt;
        uint256 completedAt;
        string reasoningHash;   // 0G Storage hash for reasoning/tracing
    }
    
    mapping(bytes32 => Job) public jobs;
    bytes32[] public jobList;
    
    mapping(address => bytes32[]) public buyerJobs;
    mapping(address => bytes32[]) public providerJobs;
    
    uint256 public constant MAX_JOB_DURATION = 30 days;
    
    event JobCreated(
        bytes32 indexed jobId,
        address indexed buyer,
        address indexed provider,
        uint256 amount,
        bool tracked,
        uint256 createdAt
    );
    
    event JobAccepted(bytes32 indexed jobId, address indexed provider, uint256 acceptedAt);
    event JobCompleted(bytes32 indexed jobId, uint256 completedAt);
    event JobFailed(bytes32 indexed jobId, string reason);
    event JobSettled(bytes32 indexed jobId, uint256 settledAt);
    
    modifier jobExists(bytes32 jobId) {
        require(jobs[jobId].id == jobId, "Job does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Generate unique job ID
     */
    function _generateJobId(
        address buyer, 
        address provider, 
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(buyer, provider, timestamp));
    }
    
    /**
     * @dev Create a new compute job
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
    ) external returns (bytes32 jobId) {
        require(provider != address(0), "Invalid provider address");
        require(amount > 0, "Amount must be greater than 0");
        
        jobId = _generateJobId(msg.sender, provider, block.timestamp);
        require(jobs[jobId].id != jobId, "Job already exists");
        
        jobs[jobId] = Job({
            id: jobId,
            buyer: msg.sender,
            provider: provider,
            amount: amount,
            status: JobStatus.Pending,
            tracked: tracked,
            createdAt: block.timestamp,
            completedAt: 0,
            reasoningHash: reasoningHash
        });
        
        jobList.push(jobId);
        buyerJobs[msg.sender].push(jobId);
        providerJobs[provider].push(jobId);
        
        emit JobCreated(jobId, msg.sender, provider, amount, tracked, block.timestamp);
        
        return jobId;
    }
    
    /**
     * @dev Provider accepts the job
     */
    function acceptJob(bytes32 jobId) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        require(job.provider == msg.sender, "Only assigned provider can accept");
        require(job.status == JobStatus.Pending, "Job not in pending state");
        
        job.status = JobStatus.Active;
        
        emit JobAccepted(jobId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Mark job as completed (called by provider)
     */
    function completeJob(bytes32 jobId) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        require(job.provider == msg.sender, "Only provider can complete");
        require(job.status == JobStatus.Active, "Job not active");
        require(block.timestamp - job.createdAt <= MAX_JOB_DURATION, "Job expired");
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        
        emit JobCompleted(jobId, block.timestamp);
    }
    
    /**
     * @dev Mark job as failed
     */
    function failJob(bytes32 jobId, string calldata reason) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        require(
            job.buyer == msg.sender || job.provider == msg.sender,
            "Only buyer or provider can fail job"
        );
        require(job.status == JobStatus.Pending || job.status == JobStatus.Active, "Invalid status");
        
        job.status = JobStatus.Failed;
        
        emit JobFailed(jobId, reason);
    }
    
    /**
     * @dev Mark job as settled (called by escrow after payment)
     */
    function settleJob(bytes32 jobId) external onlyOwner jobExists(jobId) {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Completed, "Job not completed");
        
        job.status = JobStatus.Settled;
        
        emit JobSettled(jobId, block.timestamp);
    }
    
    /**
     * @dev Get job details
     */
    function getJob(bytes32 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }
    
    /**
     * @dev Get buyer's jobs
     */
    function getBuyerJobs(address buyer) external view returns (bytes32[] memory) {
        return buyerJobs[buyer];
    }
    
    /**
     * @dev Get provider's jobs
     */
    function getProviderJobs(address provider) external view returns (bytes32[] memory) {
        return providerJobs[provider];
    }
    
    /**
     * @dev Check if job is in final state
     */
    function isJobFinalized(bytes32 jobId) external view returns (bool) {
        JobStatus status = jobs[jobId].status;
        return status == JobStatus.Settled || status == JobStatus.Failed;
    }
}
