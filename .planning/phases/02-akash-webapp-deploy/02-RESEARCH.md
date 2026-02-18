# Phase 02 Research Findings

**Research Date:** 2026-02-17  
**Research Questions:**
1. SDL Template Sources - online vs hardcoded
2. ADI Chain Deployment for testnet USDC + escrow

---

## 1. SDL Template Sources - Findings and Recommendations

### Official Akash SDL Sources

**1.1 awesome-akash Repository (Primary Source)**
- **URL:** https://github.com/akash-network/awesome-akash
- **Status:** Official community-maintained repository
- **Content:** 290+ deployment examples across 30+ categories
- **Structure:** Each folder contains `deploy.yaml` (SDL), `README.md`, optional `config.json`
- **Categories:** AI/ML (CPU & GPU), Databases, DeFi, Games, Blockchain nodes, Web frameworks, etc.
- **Access:** `https://raw.githubusercontent.com/akash-network/awesome-akash/master/{folder}/deploy.yaml`

**1.2 deploy-templates Repository**
- **URL:** https://github.com/akash-network/deploy-templates
- **Status:** Official Akash Network organization
- **Content:** Base deployment templates

**1.3 Akash Console Template Gallery**
- **URL:** https://console.akash.network/templates
- **Status:** Web UI template browser
- **Note:** Templates here mirror awesome-akash repo with 5-minute cache

**1.4 SDL Documentation**
- **URL:** https://akash.network/docs/getting-started/stack-definition-language
- **Features:** Complete SDL spec, GPU examples, persistent storage docs

### SDL Include Feature (Remote Templates)

SDL supports dynamic inclusion via the `include:` directive:

```yaml
version: "2.0"

include:
  - "foo.yml"
  - "https://raw.githubusercontent.com/akash-network/awesome-akash/master/nginx/deploy.yaml"

services:
  web:
    image: myapp:latest
```

**Key Finding:** SDL can reference remote templates at deployment time, allowing dynamic composition.

### Recommendation: Hybrid Approach

**For Necto Phase 02, implement a THREE-TIER template system:**

#### Tier 1: Hardcoded Core Templates (Offline Reliable)
Keep 6-10 essential templates hardcoded for:
- PyTorch GPU training
- Jupyter Notebook
- Stable Diffusion
- Ollama LLM
- NGINX web server
- PostgreSQL database
- Generic container deployment

**Rationale:** Ensures functionality during network outages or GitHub rate limits.

#### Tier 2: Remote Template Fetch (Dynamic)
Fetch from awesome-akash repository on-demand:
```typescript
const TEMPLATE_BASE_URL = 'https://raw.githubusercontent.com/akash-network/awesome-akash/master';

async function fetchTemplate(templateName: string): Promise<string> {
  const response = await fetch(`${TEMPLATE_BASE_URL}/${templateName}/deploy.yaml`);
  return response.text();
}
```

**Categories to fetch:**
- AI/ML workloads (PyTorch, TensorFlow, Jupyter, Stable Diffusion)
- Databases (PostgreSQL, MySQL, MongoDB, Redis)
- Web servers (NGINX, Caddy)
- Blockchain nodes

#### Tier 3: Template Gallery Browser
UI component to browse/search all 290+ templates from awesome-akash with:
- Category filtering
- Search by tags
- Preview before selection
- One-click deploy

### Tradeoffs: Online vs Hardcoded Templates

| Factor | Hardcoded | Remote Fetch | Hybrid |
|--------|-----------|--------------|--------|
| **Reliability** | High (always works) | Medium (depends on GitHub) | High (fallback to hardcoded) |
| **Freshness** | Stale (requires code update) | Always current | Best of both |
| **Startup Time** | Instant | Network dependent | Instant with background refresh |
| **Maintenance** | High (update code for new templates) | Low (auto-updates) | Medium |
| **Customization** | Easy to modify | Requires local copy | Flexible |
| **Offline Use** | Yes | No | Yes (hardcoded fallback) |

### Implementation Plan for Templates

1. **Keep existing 6 templates hardcoded** (as in 02-01-PLAN.md)
2. **Add remote fetch capability** to `sdl-generator.ts`:
   - `fetchRemoteTemplate(templateId: string)` function
   - Caching layer (localStorage or Redis)
   - Fallback to hardcoded if fetch fails
3. **Create template browser component** (02-03-PLAN.md)
   - Fetch template list from GitHub API
   - Display with search/filter
   - Preview SDL before deployment

---

## 2. ADI Chain Deployment - Technical Approach

### ADI Testnet Configuration

**Network Parameters:**
```
Network Name: ADI Network AB Testnet
RPC URL: https://rpc.ab.testnet.adifoundation.ai/
Chain ID: 99999
Currency Symbol: ADI
Block Explorer: https://explorer.ab.testnet.adifoundation.ai/
Faucet: https://faucet.ab.testnet.adifoundation.ai/
```

**Technology Stack:**
- EVM-compatible chain
- Based on zkSync Atlas (formerly zkSync OS)
- Uses ADI token for gas (not ETH)

### Current Plan Issues

The existing plans (02-01 through 02-04) assume deployment on Ethereum testnet (Sepolia):

```typescript
// FROM 02-01-PLAN.md (INCORRECT)
env_vars:
  - name: TESTNET_USDC_ADDRESS
    source: "Deploy testnet USDC or use existing faucet"
  - name: ESCROW_CONTRACT_ADDRESS
    source: "Deploy escrow contract after USDC"
  - name: TESTNET_RPC_URL
    source: "Alchemy/Infura testnet endpoint"  // <-- WRONG: Should be ADI RPC
```

### Correct ADI Chain Deployment Process

#### Step 1: Deploy Testnet USDC on ADI Testnet

Create ERC20 contract using standard OpenZeppelin ERC20:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestnetUSDC is ERC20, Ownable {
    constructor() ERC20("Testnet USDC", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1_000_000 * 10**6); // 1M USDC with 6 decimals
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
```

**Deployment via Hardhat/Ignition:**
```typescript
// ignition/modules/TestnetUSDC.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestnetUSDC", (m) => {
  const usdc = m.contract("TestnetUSDC", []);
  return { usdc };
});
```

**Deployment command:**
```bash
npx hardhat ignition deploy ignition/modules/TestnetUSDC.ts --network adi-testnet
```

#### Step 2: Deploy Escrow Contract on ADI Testnet

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AkashEscrow is Ownable {
    IERC20 public usdc;
    
    struct Escrow {
        address depositor;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
        string deploymentId; // Akash deployment dseq
    }
    
    enum EscrowStatus { Active, Released, Refunded }
    
    mapping(bytes32 => Escrow) public escrows;
    mapping(string => bytes32) public deploymentToEscrow;
    
    event Deposited(bytes32 indexed jobId, address indexed depositor, uint256 amount);
    event Released(bytes32 indexed jobId, string deploymentId);
    event Refunded(bytes32 indexed jobId, uint256 amount);
    
    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }
    
    function deposit(bytes32 jobId, uint256 amount) external {
        require(escrows[jobId].amount == 0, "Escrow exists");
        
        usdc.transferFrom(msg.sender, address(this), amount);
        
        escrows[jobId] = Escrow({
            depositor: msg.sender,
            amount: amount,
            status: EscrowStatus.Active,
            createdAt: block.timestamp,
            deploymentId: ""
        });
        
        emit Deposited(jobId, msg.sender, amount);
    }
    
    function release(bytes32 jobId, string calldata deploymentId) external onlyOwner {
        Escrow storage escrow = escrows[jobId];
        require(escrow.status == EscrowStatus.Active, "Not active");
        
        escrow.status = EscrowStatus.Released;
        escrow.deploymentId = deploymentId;
        deploymentToEscrow[deploymentId] = jobId;
        
        usdc.transfer(owner(), escrow.amount);
        
        emit Released(jobId, deploymentId);
    }
    
    function refund(bytes32 jobId) external {
        Escrow storage escrow = escrows[jobId];
        require(escrow.depositor == msg.sender || msg.sender == owner(), "Unauthorized");
        require(escrow.status == EscrowStatus.Active, "Not active");
        
        escrow.status = EscrowStatus.Refunded;
        usdc.transfer(escrow.depositor, escrow.amount);
        
        emit Refunded(jobId, escrow.amount);
    }
    
    function getEscrow(bytes32 jobId) external view returns (Escrow memory) {
        return escrows[jobId];
    }
}
```

**Deployment via Hardhat/Ignition:**
```typescript
// ignition/modules/AkashEscrow.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AkashEscrow", (m) => {
  // Get USDC address from previous deployment
  const usdcAddress = m.getParameter("usdcAddress");
  
  const escrow = m.contract("AkashEscrow", [usdcAddress]);
  return { escrow };
});
```

**Deployment command:**
```bash
npx hardhat ignition deploy ignition/modules/AkashEscrow.ts --network adi-testnet --parameters "{\"usdcAddress\":\"0x...\"}"
```

#### Step 3: Hardhat Configuration for ADI Testnet

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    "adi-testnet": {
      url: "https://rpc.ab.testnet.adifoundation.ai/",
      chainId: 99999,
      accounts: [process.env.PRIVATE_KEY!],
      gasPrice: 100000000, // 0.1 gwei
    },
  },
  etherscan: {
    apiKey: {
      "adi-testnet": "no-api-key-needed",
    },
    customChains: [
      {
        network: "adi-testnet",
        chainId: 99999,
        urls: {
          apiURL: "https://explorer.ab.testnet.adifoundation.ai/api",
          browserURL: "https://explorer.ab.testnet.adifoundation.ai/",
        },
      },
    ],
  },
};

export default config;
```

#### Step 4: Update Environment Variables

```bash
# ADI Testnet Configuration
ADI_TESTNET_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
ADI_TESTNET_CHAIN_ID=99999

# Contract Addresses (after deployment)
TESTNET_USDC_ADDRESS=0x...    # Deployed on ADI Testnet
ESCROW_CONTRACT_ADDRESS=0x... # Deployed on ADI Testnet

# Wallet (same wallet for both contracts)
ESCROW_OWNER_PRIVATE_KEY=0x...

# Necto wallet for receiving payments (escrow owner)
NECTO_WALLET_ADDRESS=0x...
```

### Integration Between ADI Chain Contracts and Console API

The escrow contract (on ADI Testnet) and Akash Console API (Akash Network) operate independently:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Wallet   │────▶│  ADI Testnet     │     │ Akash Network   │
│                 │     │  (Chain 99999)   │     │ (Chain akash-2) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Approve USDC   │     │  Escrow Contract │     │ Console API     │
│  (ERC20)        │────▶│  • Deposit       │     │ (REST API)      │
│                 │     │  • Release       │     │ • Create        │
└─────────────────┘     │  • Refund        │     │   Deployment    │
                        └──────────────────┘     │ • Get Bids      │
                                │                │ • Close         │
                                │                └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Necto Backend   │◀────│  Deployment     │
                        │  (Monitors both) │     │  Status         │
                        └──────────────────┘     └─────────────────┘
```

**Key Integration Points:**

1. **Escrow Deposit:** User deposits USDC on ADI Testnet → emits `Deposited` event
2. **Backend Monitoring:** Necto backend watches for deposit events via ADI RPC
3. **Deployment Creation:** Backend calls Akash Console API (independent chain)
4. **Escrow Release:** On successful deployment, backend calls `release()` on ADI escrow
5. **No Direct Chain Interaction:** ADI Testnet and Akash Network do not communicate directly

### Updated Contract Files

The TypeScript contract interfaces need to update chain configuration:

```typescript
// offchain/src/lib/contracts/testnet-usdc-token.ts
// UPDATE: Use ADI Testnet configuration

export const USDC_ADDRESS = process.env.TESTNET_USDC_ADDRESS || '0x0000000000000000000000000000000000000000';

// ADI Testnet Configuration
export const ADI_TESTNET_CONFIG = {
  chainId: 99999,
  name: 'ADI Network AB Testnet',
  rpcUrl: 'https://rpc.ab.testnet.adifoundation.ai/',
  blockExplorer: 'https://explorer.ab.testnet.adifoundation.ai/',
  nativeCurrency: {
    name: 'ADI',
    symbol: 'ADI',
    decimals: 18,
  },
} as const;

// Get faucet URL
export function getUSDCFaucetUrl(): string {
  return 'https://faucet.ab.testnet.adifoundation.ai/';
}
```

---

## 3. Plan Updates Needed

### Updates to 02-01-PLAN.md

**File:** `offchain/src/lib/contracts/testnet-usdc-token.ts`
**Current Issue:** References Sepolia/Ethereum testnet
**Required Change:**
- Update environment variable documentation to specify ADI Testnet
- Add ADI Testnet configuration constants
- Update faucet URL to ADI faucet

**File:** `offchain/src/lib/contracts/testnet-usdc-escrow.ts`
**Current Issue:** Assumes Ethereum testnet
**Required Change:**
- Add deployment notes about ADI Testnet chain ID 99999
- Document that escrow owner wallet must have ADI tokens for gas

**User Setup Section - CHANGE FROM:**
```yaml
user_setup:
  - service: Testnet USDC Contract
    why: "Fake/test USDC for payments (NOT real money) - Sepolia or similar testnet"
    env_vars:
      - name: TESTNET_USDC_ADDRESS
        source: "Deploy testnet USDC or use existing faucet"
      - name: ESCROW_CONTRACT_ADDRESS
        source: "Deploy escrow contract after USDC"
      - name: TESTNET_RPC_URL
        source: "Alchemy/Infura testnet endpoint"
```

**TO:**
```yaml
user_setup:
  - service: ADI Testnet Contracts
    why: "Testnet USDC and escrow on ADI chain (same chain as ComputeRouter)"
    env_vars:
      - name: TESTNET_USDC_ADDRESS
        source: "Deploy TestnetUSDC.sol on ADI Testnet (chain 99999)"
      - name: ESCROW_CONTRACT_ADDRESS
        source: "Deploy AkashEscrow.sol on ADI Testnet after USDC"
      - name: ADI_TESTNET_RPC_URL
        value: "https://rpc.ab.testnet.adifoundation.ai/"
      - name: ESCROW_OWNER_PRIVATE_KEY
        source: "Private key of wallet that deployed contracts (needs ADI for gas)"
    steps:
      1: "Get ADI testnet tokens from https://faucet.ab.testnet.adifoundation.ai/"
      2: "Deploy TestnetUSDC.sol using Hardhat/Ignition"
      3: "Deploy AkashEscrow.sol with USDC address as constructor arg"
      4: "Copy contract addresses to environment variables"
```

### Updates to 02-02-PLAN.md

No specific contract-related changes needed, but add note:
- Escrow monitoring must use ADI Testnet RPC (not Ethereum)

### Updates to 02-03-PLAN.md

**Template System Update:**
- Add task for remote template fetch capability
- Add template browser component that pulls from awesome-akash

**New Task Example:**
```xml
<task type="auto">
  <name>Task X: Add remote SDL template fetch</name>
  <files>offchain/src/lib/akash/template-fetcher.ts</files>
  <action>
    Create function to fetch templates from awesome-akash repository:
    - fetchRemoteTemplate(templateName: string): Promise<string>
    - Cache fetched templates in localStorage
    - Fallback to hardcoded templates on network error
  </action>
</task>
```

### Updates to 02-04-PLAN.md

**Escrow API Route:**
- Update to use ADI Testnet provider configuration
- Add note about chain ID 99999 in API documentation

**Environment Variables - ADD:**
```
ADI_TESTNET_CHAIN_ID=99999
ADI_TESTNET_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
```

### New File: Contract Deployment Documentation

**Create:** `.planning/phases/02-akash-webapp-deploy/CONTRACT-DEPLOYMENT.md`

Contents:
- Step-by-step Hardhat/Ignition deployment guide
- ADI Testnet configuration
- Contract verification on ADI explorer
- Address management (dev/staging/prod)

---

## Summary of Required Changes

| Plan File | Section | Change Type | Description |
|-----------|---------|-------------|-------------|
| 02-01-PLAN.md | user_setup | **MAJOR** | Change from generic "testnet" to specific "ADI Testnet" with deployment steps |
| 02-01-PLAN.md | env_vars | **MAJOR** | Replace `TESTNET_RPC_URL` with `ADI_TESTNET_RPC_URL` and add chain ID |
| 02-01-PLAN.md | must_haves | **MINOR** | Add note: "Contracts deployed on ADI Testnet (chain 99999)" |
| 02-01-PLAN.md | sdl-generator | **NEW** | Add remote template fetch capability (optional enhancement) |
| 02-04-PLAN.md | escrow API | **MINOR** | Update to use ADI Testnet RPC configuration |
| NEW FILE | CONTRACT-DEPLOYMENT.md | **NEW** | Complete deployment guide for contracts on ADI Testnet |

### Deployment Checklist for ADI Testnet

- [ ] Get ADI tokens from faucet (https://faucet.ab.testnet.adifoundation.ai/)
- [ ] Configure Hardhat with ADI Testnet network
- [ ] Deploy TestnetUSDC.sol
- [ ] Deploy AkashEscrow.sol (pass USDC address)
- [ ] Verify contracts on ADI explorer
- [ ] Copy contract addresses to environment
- [ ] Test deposit/release/refund flow
- [ ] Document addresses for team

---

## Research Conclusion

**Question 1 (SDL Templates):** Implement a hybrid approach with hardcoded core templates + remote fetch from awesome-akash repository. This provides reliability while offering access to 290+ community templates.

**Question 2 (ADI Chain):** Deploy both TestnetUSDC and AkashEscrow contracts on ADI Testnet (chain 99999), same chain as ComputeRouter. Update all plans to reflect ADI-specific RPC URLs, chain ID, and deployment process. The escrow contract on ADI and Console API on Akash operate independently - no direct chain communication required.

**Critical Update Required:** The existing plans assume Ethereum testnet (Sepolia) - this must be changed to ADI Testnet across all four plan files.
