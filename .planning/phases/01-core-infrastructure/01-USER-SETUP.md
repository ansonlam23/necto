# 0G Storage Setup Guide

This guide walks through configuring 0G Storage for uploading agent reasoning traces.

## Overview

0G Storage provides decentralized, immutable storage for agent decision traces. Each upload generates a **content hash** (Merkle root) that can be stored on-chain for verification.

## Prerequisites

- Node.js 18+ installed
- npm packages installed (`npm install`)
- Access to 0G Galileo Testnet

---

## Step 1: Generate Wallet

If you don't have a wallet for 0G:

```bash
# Using Hardhat
npx hardhat node

# In another terminal, open console
npx hardhat console --network 0g-testnet

# Generate a new wallet
const wallet = ethers.Wallet.createRandom()
console.log("Address:", wallet.address)
console.log("Private Key:", wallet.privateKey)
```

Or use any Ethereum wallet generator (MetaMask, etc.).

**Save the private key** - you'll need it for the next step.

---

## Step 2: Fund Wallet from Faucet

0G Galileo Testnet uses AOG (0G test tokens) for gas fees.

### Option A: Web Faucet
1. Visit https://faucet.0g.ai
2. Enter your wallet address
3. Complete any verification
4. Wait for confirmation (usually instant)

### Option B: Discord Faucet
1. Join 0G Discord: https://discord.gg/0glabs
2. Navigate to #faucet channel
3. Type: `!faucet YOUR_ADDRESS`
4. Wait for bot response

---

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# 0G Storage Configuration
OG_PRIVATE_KEY=your_private_key_here_with_or_without_0x_prefix

# These have defaults but you can customize:
# OG_RPC_URL=https://evmrpc-testnet.0g.ai
# OG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
# OG_FLOW_CONTRACT=0x22E03a6A89B950F1c82ec5e74F8eCa321a105296
```

**Security Note:** Never commit your private key to git! `.env` is in `.gitignore`.

---

## Step 4: Verify Setup

### Check Balance

```bash
npx hardhat console --network 0g-testnet
```

```javascript
// Replace with your address
const address = "0xYOUR_ADDRESS"
const balance = await ethers.provider.getBalance(address)
console.log("Balance:", ethers.formatEther(balance), "AOG")
// Should show > 0 if faucet worked
```

### Test Storage Service

```bash
npx ts-node --esm -e "
import { storageService } from './src/lib/storage';

async function test() {
  try {
    await storageService.initialize();
    console.log('✓ Storage service initialized');
    console.log('✓ Connected to 0G Testnet');
    console.log('✓ Configuration valid');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }
}

test();
"
```

Expected output:
```
[StorageService] Connected to chain 16602
✓ Storage service initialized
✓ Connected to 0G Testnet
✓ Configuration valid
```

---

## Step 5: Test Upload (Optional)

Create a test script `test-upload.ts`:

```typescript
import { uploadReasoningTrace } from './src/lib/storage';
import { ReasoningTrace } from './src/types/agent';

const testTrace: ReasoningTrace = {
  timestamp: new Date().toISOString(),
  jobId: 'test-job-001',
  providerCount: 3,
  query: {
    gpuType: 'A100',
    gpuCount: 1,
    memoryGB: 80,
    region: 'us-east',
    maxPricePerHour: 2.0
  },
  weights: {
    price: 0.6,
    latency: 0.2,
    reputation: 0.1,
    geography: 0.1
  },
  candidates: [],
  rejected: [],
  finalRanking: [],
  metadata: {
    agentVersion: '1.0.0',
    calculationTimeMs: 150,
    filteredCount: 0
  }
};

async function testUpload() {
  try {
    console.log('Uploading test trace...');
    const hash = await uploadReasoningTrace(testTrace);
    console.log('✓ Upload successful!');
    console.log('Content Hash:', hash);
    console.log('View on explorer: https://explorer-testnet.0g.ai/tx/' + hash);
  } catch (error) {
    console.error('✗ Upload failed:', error);
  }
}

testUpload();
```

Run:
```bash
npx ts-node test-upload.ts
```

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `OG_PRIVATE_KEY` | **Required** | Private key for signing storage transactions |
| `OG_RPC_URL` | https://evmrpc-testnet.0g.ai | 0G Testnet RPC endpoint |
| `OG_INDEXER_URL` | https://indexer-storage-testnet-turbo.0g.ai | Storage indexer URL |
| `OG_FLOW_CONTRACT` | 0x22E03a6A89B950F1c82ec5e74F8eCa321a105296 | FixedPriceFlow contract |

### Network Details

- **Network:** 0G Galileo Testnet
- **Chain ID:** 16602
- **Currency:** AOG (test tokens)
- **Block Explorer:** https://explorer-testnet.0g.ai
- **EVM Version:** Cancun

---

## Troubleshooting

### "OG_PRIVATE_KEY is required but not set"
- Ensure `.env` file exists and contains `OG_PRIVATE_KEY`
- Check that `.env` is loaded (restart your dev server)

### "Not enough balance"
- Request more tokens from faucet
- Check balance with verification step above

### "Timeout during upload"
- Large files (>10MB) may timeout
- 0G SDK has known issues with large file uploads
- Consider compressing or chunking large traces

### "Failed to calculate Merkle tree"
- Usually indicates empty file or invalid data
- Check that ReasoningTrace is properly serialized

### "Cannot find module '@0glabs/0g-ts-sdk'"
- Run `npm install` to install dependencies
- Check that installation succeeded without errors

---

## Status

**Setup Status:** Incomplete (requires user to fund wallet and configure env vars)

Once you've completed the steps above, update this file or remove it to indicate setup is complete.

---

*Generated for Phase 01 Plan 05: 0G Storage Integration*  
*Last updated: 2026-02-13*
