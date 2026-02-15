// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


/*
CounterModule#Counter - 0x3f0c2Bee1b84038525E4abD172138090B68862C9
ComputeRouterModule#ComputeRouter - 0x369CbbB21c7b85e3BB0f29DE5dCC92B2583E09Dd
*/
 
contract ComputeRouter {
    struct Job {
        uint256 id;
        address user;
        bytes32 detailsHash;
        bytes32 routingHash;
        address provider;
        uint256 amount;
        bool isTracked;
        uint256 createdAt;
        uint256 routedAt;
    }

    mapping(uint256 => Job) private jobs;
    uint256 public jobCount;
    address public agent;

    event JobSubmitted(uint256 indexed jobId, address indexed user, bytes32 detailsHash, bool isTracked);
    event RoutingDecision(uint256 indexed jobId, address indexed provider, uint256 amount, bytes32 routingHash);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    modifier onlyAgent() {
        require(msg.sender == agent, "ComputeRouter: caller is not the agent");
        _;
    }

    constructor(address _agent) {
        require(_agent != address(0), "ComputeRouter: agent cannot be zero address");
        agent = _agent;
    }

    function submitJob(address _user, bytes32 _detailsHash, bool _isTracked) external onlyAgent returns (uint256) {
        jobCount++;
        uint256 jobId = jobCount;

        address storedUser = _isTracked ? _user : address(0);

        jobs[jobId] = Job({
            id: jobId,
            user: storedUser,
            detailsHash: _detailsHash,
            routingHash: bytes32(0),
            provider: address(0),
            amount: 0,
            isTracked: _isTracked,
            createdAt: block.timestamp,
            routedAt: 0
        });

        emit JobSubmitted(jobId, storedUser, _detailsHash, _isTracked);

        return jobId;
    }

    function recordRoutingDecision(
        uint256 _jobId,
        address _provider,
        uint256 _amount,
        bytes32 _routingHash
    ) external onlyAgent {
        require(_jobId > 0 && _jobId <= jobCount, "ComputeRouter: job does not exist");
        require(jobs[_jobId].routedAt == 0, "ComputeRouter: job already routed");
        require(_provider != address(0), "ComputeRouter: provider cannot be zero address");
        require(_routingHash != bytes32(0), "ComputeRouter: routing hash cannot be zero");

        Job storage job = jobs[_jobId];
        job.provider = _provider;
        job.amount = _amount;
        job.routingHash = _routingHash;
        job.routedAt = block.timestamp;

        emit RoutingDecision(_jobId, _provider, _amount, _routingHash);
    }

    function getJob(uint256 _jobId) external view returns (Job memory) {
        require(_jobId > 0 && _jobId <= jobCount, "ComputeRouter: job does not exist");
        return jobs[_jobId];
    }

    function updateAgent(address _newAgent) external onlyAgent {
        require(_newAgent != address(0), "ComputeRouter: new agent cannot be zero address");
        address oldAgent = agent;
        agent = _newAgent;
        emit AgentUpdated(oldAgent, _newAgent);
    }
}
