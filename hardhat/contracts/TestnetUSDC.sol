// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestnetUSDC
 * @notice Fake USDC token for testnet use only - NOT real money
 * @dev Standard ERC20 with public mint (faucet) for testing purposes
 *      Uses 6 decimals to match real USDC
 *      Extends OpenZeppelin's audited ERC20 implementation
 */
contract TestnetUSDC is ERC20, Ownable {
    /// @notice Maximum amount per faucet drip (10,000 tUSDC)
    uint256 public constant FAUCET_AMOUNT = 10_000 * 1e6;

    /**
     * @notice Initialize the Testnet USDC token
     * @dev Sets name, symbol, and 6 decimals (matching real USDC)
     */
    constructor() ERC20("Testnet USDC", "tUSDC") Ownable(msg.sender) {
        // ERC20 uses 18 decimals by default, override to 6
    }

    /**
     * @notice Override decimals to match real USDC (6)
     * @return uint8 Number of decimals (6)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mint tokens to any address (faucet)
     * @dev Anyone can call this on testnet. Capped at FAUCET_AMOUNT per call.
     * @param to Recipient address
     * @param amount Amount to mint (max FAUCET_AMOUNT)
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "TestnetUSDC: mint to zero address");
        require(amount <= FAUCET_AMOUNT, "TestnetUSDC: exceeds faucet limit");

        _mint(to, amount);
    }

    /**
     * @notice Batch mint tokens for testing (owner only)
     * @dev Useful for setting up test scenarios with multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "TestnetUSDC: array length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "TestnetUSDC: mint to zero address");
            _mint(recipients[i], amounts[i]);
        }
    }
}
