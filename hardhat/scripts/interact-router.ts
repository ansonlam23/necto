import { network } from 'hardhat';
import { type Abi, defineChain } from 'viem';

/**
 * @title Interact Router Script
 * @notice Demonstrates interacting with a deployed ComputeRouter contract on ADI Testnet
 * @dev This script connects to ADI Testnet and performs:
 *   1. Reads current jobCount
 *   2. Submits a test job (tracked mode)
 *   3. Records a routing decision
 *   4. Reads back the job data
 *   5. Queries events
 *   6. Outputs transaction summary with block explorer links
 * 
 * Before running:
 *   1. Set TESTNET_PRIVATE_KEY in hardhat.config.ts or as environment variable
 *   2. Update CONTRACT_ADDRESS below with the deployed contract address
 *   3. Ensure the wallet has ADI testnet tokens from the faucet
 * 
 * Run with:
 *   npx hardhat run scripts/interact-router.ts --network adiTestnet
 */

// Block explorer configuration
const BLOCK_EXPLORER_URL = 'https://explorer.ab.testnet.adifoundation.ai';

function getExplorerTxUrl(txHash: string): string {
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`;
}

function getExplorerAddressUrl(address: string): string {
  return `${BLOCK_EXPLORER_URL}/address/${address}`;
}

function getExplorerBlockUrl(blockNumber: bigint): string {
  return `${BLOCK_EXPLORER_URL}/block/${blockNumber.toString()}`;
}

/*
CounterModule#Counter - 0x3f0c2Bee1b84038525E4abD172138090B68862C9
ComputeRouterModule#ComputeRouter - 0x369CbbB21c7b85e3BB0f29DE5dCC92B2583E09Dd
*/

// UPDATE THIS AFTER DEPLOYMENT
const CONTRACT_ADDRESS = '0x369CbbB21c7b85e3BB0f29DE5dCC92B2583E09Dd' as `0x${string}`;

// ADI Testnet chain configuration
const adiChain = defineChain({
  id: 99999,
  name: 'ADI Chain',
  network: 'adiTestnet',
  nativeCurrency: { name: 'ADI', symbol: 'ADI', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ab.testnet.adifoundation.ai'] } },
});

interface TransactionRecord {
  name: string;
  hash: string;
  blockNumber: bigint;
  description: string;
}

async function main() {
  // Validate contract address is set
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.error('ERROR: Please update CONTRACT_ADDRESS in the script with the deployed contract address');
    process.exit(1);
  }

  // Array to track all transactions
  const transactions: TransactionRecord[] = [];

  // Connect to ADI Testnet
  const { viem } = await network.connect('adiTestnet');

  // Get clients
  const publicClient = await viem.getPublicClient({ chain: adiChain });
  const [senderClient] = await viem.getWalletClients({ chain: adiChain });
  
  if (!senderClient) {
    throw new Error('No wallet client. Set TESTNET_PRIVATE_KEY in hardhat config.');
  }

  console.log('Connected to ADI Testnet');
  console.log('Wallet address:', senderClient.account.address);
  console.log('Wallet explorer:', getExplorerAddressUrl(senderClient.account.address));

  // Get contract instance
  const computeRouter = await viem.getContractAt('ComputeRouter', CONTRACT_ADDRESS, {
    client: { public: publicClient, wallet: senderClient },
  });

  console.log('Contract address:', CONTRACT_ADDRESS);
  console.log('Contract explorer:', getExplorerAddressUrl(CONTRACT_ADDRESS));

  // 1. Read current jobCount
  const jobCount = await computeRouter.read.jobCount();
  console.log('Current job count:', jobCount);

  // 2. Submit a test job
  const detailsHash = '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;
  const userAddress = senderClient.account.address;
  const isTracked = true;

  console.log('\nSubmitting test job...');
  console.log('  User:', userAddress);
  console.log('  Details hash:', detailsHash);
  console.log('  Tracked:', isTracked);

  const submitTx = await computeRouter.write.submitJob([userAddress, detailsHash, isTracked]);
  const submitReceipt = await publicClient.waitForTransactionReceipt({ hash: submitTx });
  console.log('Submit transaction hash:', submitTx);
  console.log('Submit transaction confirmed in block:', submitReceipt.blockNumber);

  // Record transaction
  transactions.push({
    name: 'Submit Job',
    hash: submitTx,
    blockNumber: submitReceipt.blockNumber,
    description: `Job submission by ${userAddress.slice(0, 10)}...${userAddress.slice(-8)}`
  });

  // Get the new job ID
  const newJobCount = await computeRouter.read.jobCount();
  const jobId = newJobCount;
  console.log('New job ID:', jobId);

  // 3. Record a routing decision
  const providerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`;
  const amount = BigInt(1000);
  const routingHash = '0x0000000000000000000000000000000000000000000000000000000000000002' as `0x${string}`;

  console.log('\nRecording routing decision...');
  console.log('  Job ID:', jobId);
  console.log('  Provider:', providerAddress);
  console.log('  Amount:', amount);
  console.log('  Routing hash:', routingHash);

  const routeTx = await computeRouter.write.recordRoutingDecision([jobId, providerAddress, amount, routingHash]);
  const routeReceipt = await publicClient.waitForTransactionReceipt({ hash: routeTx });
  console.log('Route transaction hash:', routeTx);
  console.log('Route transaction confirmed in block:', routeReceipt.blockNumber);

  // Record transaction
  transactions.push({
    name: 'Record Routing',
    hash: routeTx,
    blockNumber: routeReceipt.blockNumber,
    description: `Routing decision for Job #${jobId.toString()}`
  });

  // 4. Read back the job data
  const job = await computeRouter.read.getJob([jobId]);
  console.log('\nJob data:');
  console.log('  ID:', job.id);
  console.log('  User:', job.user);
  console.log('  Details hash:', job.detailsHash);
  console.log('  Routing hash:', job.routingHash);
  console.log('  Provider:', job.provider);
  console.log('  Amount:', job.amount);
  console.log('  Tracked:', job.isTracked);
  console.log('  Created at:', job.createdAt);
  console.log('  Routed at:', job.routedAt);

  // 5. Query events
  console.log('\nQuerying events...');

  // Get JobSubmitted events
  const jobSubmittedEvents = await publicClient.getContractEvents({
    address: CONTRACT_ADDRESS,
    abi: computeRouter.abi as Abi,
    eventName: 'JobSubmitted',
    fromBlock: submitReceipt.blockNumber,
    toBlock: submitReceipt.blockNumber,
  });
  console.log('JobSubmitted events in block:', jobSubmittedEvents.length);
  
  for (const event of jobSubmittedEvents) {
    const args = event.args as { jobId: bigint; user: `0x${string}`; detailsHash: `0x${string}`; isTracked: boolean };
    console.log('  Job ID:', args.jobId);
    console.log('  User:', args.user);
    console.log('  Details hash:', args.detailsHash);
    console.log('  Is tracked:', args.isTracked);
  }

  // Get RoutingDecision events
  const routingDecisionEvents = await publicClient.getContractEvents({
    address: CONTRACT_ADDRESS,
    abi: computeRouter.abi as Abi,
    eventName: 'RoutingDecision',
    fromBlock: routeReceipt.blockNumber,
    toBlock: routeReceipt.blockNumber,
  });
  console.log('RoutingDecision events in block:', routingDecisionEvents.length);
  for (const event of routingDecisionEvents) {
    const args = event.args as { jobId: bigint; provider: `0x${string}`; amount: bigint; routingHash: `0x${string}` };
    console.log('  Job ID:', args.jobId);
    console.log('  Provider:', args.provider);
    console.log('  Amount:', args.amount);
    console.log('  Routing hash:', args.routingHash);
  }

  // 6. Output transaction summary with explorer links
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' TRANSACTION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nContract: ${CONTRACT_ADDRESS}`);
  console.log(`Explorer: ${getExplorerAddressUrl(CONTRACT_ADDRESS)}`);
  console.log(`\nWallet: ${senderClient.account.address}`);
  console.log(`Explorer: ${getExplorerAddressUrl(senderClient.account.address)}`);
  console.log('\nTransactions:');
  
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(`\n${i + 1}. ${tx.name}`);
    console.log(`   Description: ${tx.description}`);
    console.log(`   Hash: ${tx.hash}`);
    console.log(`   Block: ${tx.blockNumber.toString()}`);
    console.log(`   Explorer: ${getExplorerTxUrl(tx.hash)}`);
    console.log(`   Block Explorer: ${getExplorerBlockUrl(tx.blockNumber)}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Interaction complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
