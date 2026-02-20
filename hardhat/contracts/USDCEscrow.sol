// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ComputeRouter.sol";

/**
 * @title USDCEscrow
 * @notice Holds testnet USDC in escrow for compute jobs registered in ComputeRouter
 * @dev On-chain link to ComputeRouter: deposit validates job exists, release validates job is routed.
 *      Owner (deployer) = agent wallet. Release sends funds to owner.
 *      NOT real money - for testing and demo only.
 *      Uses OpenZeppelin standards for better security and gas efficiency.
 */
contract USDCEscrow is Ownable {
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

    IERC20 public usdcToken;
    ComputeRouter public computeRouter;

    /// @notice Default deposit amount: $5 USDC (5 * 10^6)
    uint256 public constant DEFAULT_DEPOSIT = 5 * 1e6;

    mapping(uint256 => Escrow) public escrows;

    event Deposited(uint256 indexed jobId, address indexed depositor, uint256 amount);
    event Released(uint256 indexed jobId, uint256 amount);
    event Refunded(uint256 indexed jobId, uint256 amount);

    constructor(address _usdcToken, address _computeRouter) Ownable(msg.sender) {
        require(_usdcToken != address(0), "USDCEscrow: token cannot be zero address");
        require(_computeRouter != address(0), "USDCEscrow: router cannot be zero address");
        usdcToken = IERC20(_usdcToken);
        computeRouter = ComputeRouter(_computeRouter);
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

        // Use OpenZeppelin's safeTransferFrom pattern
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

        bool success = usdcToken.transfer(owner(), escrow.amount);
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

    /**
     * @notice Emergency function to recover any ERC20 tokens sent to this contract by mistake
     * @dev Only owner can recover. Useful if someone sends wrong tokens.
     * @param token The ERC20 token to recover
     * @param amount Amount to recover
     */
    function recoverTokens(IERC20 token, uint256 amount) external onlyOwner {
        require(address(token) != address(usdcToken), "USDCEscrow: cannot recover USDC");
        bool success = token.transfer(owner(), amount);
        require(success, "USDCEscrow: token recovery failed");
    }
}
