// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./TestnetUSDC.sol";
import "./ComputeRouter.sol";

/**
 * @title USDCEscrow
 * @notice Holds testnet USDC in escrow for compute jobs registered in ComputeRouter
 * @dev On-chain link to ComputeRouter: deposit validates job exists, release validates job is routed.
 *      Owner (deployer) = agent wallet. Release sends funds to owner.
 *      NOT real money - for testing and demo only.
 */
contract USDCEscrow {
    enum EscrowStatus {
        Active,
        Released,
        Refunded
    }

    struct Escrow {
        address depositor;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
    }

    TestnetUSDC public usdcToken;
    ComputeRouter public computeRouter;
    address public owner;

    /// @notice Default deposit amount: $5 USDC (5 * 10^6)
    uint256 public constant DEFAULT_DEPOSIT = 5 * 1e6;

    mapping(uint256 => Escrow) public escrows;

    event Deposited(uint256 indexed jobId, address indexed depositor, uint256 amount);
    event Released(uint256 indexed jobId, uint256 amount);
    event Refunded(uint256 indexed jobId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "USDCEscrow: caller is not the owner");
        _;
    }

    constructor(address _usdcToken, address _computeRouter) {
        require(_usdcToken != address(0), "USDCEscrow: token cannot be zero address");
        require(_computeRouter != address(0), "USDCEscrow: router cannot be zero address");
        usdcToken = TestnetUSDC(_usdcToken);
        computeRouter = ComputeRouter(_computeRouter);
        owner = msg.sender;
    }

    /**
     * @notice Deposit USDC into escrow for a job
     * @dev Caller must have approved this contract to spend `amount` of USDC.
     *      Validates the job exists in ComputeRouter (createdAt > 0).
     * @param jobId Job ID from ComputeRouter
     * @param amount Amount of USDC to escrow (use DEFAULT_DEPOSIT for standard $5)
     */
    function deposit(uint256 jobId, uint256 amount) external {
        require(amount > 0, "USDCEscrow: amount must be > 0");
        require(escrows[jobId].depositor == address(0), "USDCEscrow: escrow already exists for jobId");

        // Validate job exists in ComputeRouter
        ComputeRouter.Job memory job = computeRouter.getJob(jobId);
        require(job.createdAt > 0, "USDCEscrow: job does not exist in router");

        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDCEscrow: USDC transfer failed");

        escrows[jobId] = Escrow({
            depositor: msg.sender,
            amount: amount,
            status: EscrowStatus.Active,
            createdAt: block.timestamp
        });

        emit Deposited(jobId, msg.sender, amount);
    }

    /**
     * @notice Release escrowed funds to owner (agent wallet)
     * @dev Only owner can release. Validates job has been routed in ComputeRouter (routedAt > 0).
     *      Transfers USDC to owner (deployer = agent wallet).
     * @param jobId Job ID to release
     */
    function release(uint256 jobId) external onlyOwner {
        Escrow storage escrow = escrows[jobId];
        require(escrow.depositor != address(0), "USDCEscrow: escrow does not exist");
        require(escrow.status == EscrowStatus.Active, "USDCEscrow: escrow not active");

        // Validate job has been routed in ComputeRouter
        ComputeRouter.Job memory job = computeRouter.getJob(jobId);
        require(job.routedAt > 0, "USDCEscrow: job not yet routed");

        escrow.status = EscrowStatus.Released;

        bool success = usdcToken.transfer(owner, escrow.amount);
        require(success, "USDCEscrow: release transfer failed");

        emit Released(jobId, escrow.amount);
    }

    /**
     * @notice Refund escrowed funds back to depositor
     * @dev Only owner can refund. Returns USDC to original depositor.
     * @param jobId Job ID to refund
     */
    function refund(uint256 jobId) external onlyOwner {
        Escrow storage escrow = escrows[jobId];
        require(escrow.depositor != address(0), "USDCEscrow: escrow does not exist");
        require(escrow.status == EscrowStatus.Active, "USDCEscrow: escrow not active");

        escrow.status = EscrowStatus.Refunded;

        bool success = usdcToken.transfer(escrow.depositor, escrow.amount);
        require(success, "USDCEscrow: refund transfer failed");

        emit Refunded(jobId, escrow.amount);
    }

    /**
     * @notice Get escrow details for a job
     * @param jobId Job ID
     * @return Escrow struct with depositor, amount, status, createdAt
     */
    function getEscrow(uint256 jobId) external view returns (Escrow memory) {
        return escrows[jobId];
    }
}
