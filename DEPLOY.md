# ADI Testnet Deployment Guide

This document contains instructions for deploying ComputeRouter.sol to the 0G Galileo Testnet (ADI Testnet).

## Prerequisites

Before deploying, you need:

1. **A funded wallet on 0G Testnet**
2. **Testnet A0G tokens** (for gas fees)
3. **Environment variables configured**

## Step 1: Create or Use an Existing Wallet

If you don't have a wallet:

```bash
# Generate a new private key (save this securely!)
npx hardhat node
# Or use MetaMask to create a new account
```

**Important:** Never commit private keys to git!

## Step 2: Get Testnet A0G Tokens

Visit the 0G Faucet to get testnet tokens:

**Option A: Web Faucet**
- Go to: https://faucet.0g.ai
- Enter your wallet address
- Request A0G tokens

**Option B: Discord Faucet**
- Join 0G Discord: https://discord.gg/0gai
- Go to #faucet channel
- Type: `!faucet <your-wallet-address>`

**Option C: Alternative Faucets**
- Check 0G documentation for additional faucet options

## Step 3: Configure Environment Variables

Create or update `.env` file:

```bash
# Required: Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here_without_0x

# Optional: Use existing USDC on testnet (if available)
# If not set, will deploy MockUSDC automatically
USDC_ADDRESS=0x...  # Leave empty to deploy MockUSDC

# Optional: Force MockUSDC deployment even on testnet
USE_MOCK_USDC=false
```

## Step 4: Verify Configuration

```bash
# Check your wallet balance
npx hardhat console --network 0g-testnet
> (await ethers.provider.getBalance("YOUR_ADDRESS")).toString()
```

You should see a non-zero balance (in wei).

## Step 5: Deploy Contracts

Once your wallet is funded:

```bash
# Deploy to 0G Testnet
npx hardhat run scripts/deploy.ts --network 0g-testnet
```

This will:
1. Deploy MockUSDC (if USDC_ADDRESS not set)
2. Deploy ComputeRouter with child contracts
3. Set up ownership and permissions
4. Save deployment info to `deployments/0g-testnet.json`
5. Update frontend contract addresses

## Step 6: Verify Deployment

```bash
# Run verification tests
npx hardhat run scripts/verify.ts --network 0g-testnet
```

This will test:
- Provider registration
- USDC approvals
- Job creation
- Escrow functionality

## Step 7: Update Frontend Configuration

After deployment, the script automatically updates:
- `src/types/contract-addresses.ts` with deployed addresses
- `deployments/0g-testnet.json` with full deployment info

You'll need to copy the environment variables from `.env` to your deployment environment.

## Contract Addresses on 0G Testnet

After deployment, your contracts will be at:

| Contract | Address | Explorer |
|----------|---------|----------|
| ComputeRouter | (from deployments/0g-testnet.json) | https://chainscan-galileo.0g.ai |
| ProviderRegistry | (from deployments/0g-testnet.json) | https://chainscan-galileo.0g.ai |
| JobRegistry | (from deployments/0g-testnet.json) | https://chainscan-galileo.0g.ai |
| Escrow | (from deployments/0g-testnet.json) | https://chainscan-galileo.0g.ai |
| MockUSDC | (from deployments/0g-testnet.json) | https://chainscan-galileo.0g.ai |

## Troubleshooting

**Issue: "insufficient funds"**
- Solution: Get more A0G tokens from faucet

**Issue: "network not found"**
- Solution: Check that OG_RPC_URL is set or use default in hardhat.config.js

**Issue: "nonce too low"**
- Solution: Wait a few seconds and retry

**Issue: Contract verification fails**
- Solution: Check that contracts are deployed and addresses are correct in deployments/0g-testnet.json

## Network Details

- **Network Name:** 0G Testnet (Galileo)
- **Chain ID:** 16602
- **RPC URL:** https://evmrpc-testnet.0g.ai
- **Explorer:** https://chainscan-galileo.0g.ai
- **Currency:** A0G

## Security Notes

- Never commit `.env` files with private keys
- Use a dedicated testnet wallet (not your main wallet)
- MockUSDC has no real value - it's for testing only
- All transactions are on testnet, not mainnet

## Next Steps

After successful deployment:
1. Copy deployed addresses to your frontend environment
2. Test the provider registration flow
3. Test job creation and escrow functionality
4. Update CONTRACTS.md with the deployed addresses
