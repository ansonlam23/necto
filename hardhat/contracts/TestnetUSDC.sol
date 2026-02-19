// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title TestnetUSDC
 * @notice Fake USDC token for testnet use only - NOT real money
 * @dev ERC20 with public mint (faucet) for testing purposes
 *      Uses 6 decimals to match real USDC
 */
contract TestnetUSDC {
    string public constant name = "Testnet USDC";
    string public constant symbol = "tUSDC";
    uint8 public constant decimals = 6;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Maximum amount per faucet drip (10,000 tUSDC)
    uint256 public constant FAUCET_AMOUNT = 10_000 * 1e6;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @notice Mint tokens to any address (faucet)
     * @dev Anyone can call this on testnet. Capped at FAUCET_AMOUNT per call.
     * @param to Recipient address
     * @param amount Amount to mint (max FAUCET_AMOUNT)
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "TestnetUSDC: mint to zero address");
        require(amount <= FAUCET_AMOUNT, "TestnetUSDC: exceeds faucet limit");

        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "TestnetUSDC: approve to zero address");

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[sender][msg.sender];
        require(currentAllowance >= amount, "TestnetUSDC: transfer amount exceeds allowance");

        allowance[sender][msg.sender] = currentAllowance - amount;
        return _transfer(sender, recipient, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal returns (bool) {
        require(sender != address(0), "TestnetUSDC: transfer from zero address");
        require(recipient != address(0), "TestnetUSDC: transfer to zero address");
        require(balanceOf[sender] >= amount, "TestnetUSDC: transfer amount exceeds balance");

        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }
}
