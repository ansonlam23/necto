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
 * 
 * Before running:
 *   1. Set TESTNET_PRIVATE_KEY in hardhat.config.ts or as environment variable
 *   2. Update CONTRACT_ADDRESS below with the deployed contract address
 *   3. Ensure the wallet has ADI testnet tokens from the faucet
 * 
 * Run with:
 *   npx hardhat run scripts/interact-router.ts --network adiTestnet
 */

// UPDATE THIS AFTER DEPLOYMENT
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// ADI Testnet chain configuration
const adiChain = defineChain({
  id: 99999,
  name: 'ADI Chain',
  network: 'adiTestnet',
  nativeCurrency: { name: 'ADI', symbol: 'ADI', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ab.testnet.adifoundation.ai'] } },
});

async function main() {
  // Validate contract address is set
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.error('ERROR: Please update CONTRACT_ADDRESS in the script with the deployed contract address');
    process.exit(1);
  }

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

  // Get contract instance
  const computeRouter = await viem.getContractAt('ComputeRouter', CONTRACT_ADDRESS, {
    client: { public: publicClient, wallet: senderClient },
  });

  console.log('Contract address:', CONTRACT_ADDRESS);

  // 1. Read current jobCount
  const jobCount = await computeRouter.read.jobCount();
  console.log('Current job count:', jobCount);

  // 2. Submit a test job
  const detailsHash = '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;
  const userAddress = senderClient.account.address;
  const isTracked = true;

  console.log('Submitting test job...');
  console.log('  User:', userAddress);
  console.log('  Details hash:', detailsHash);
  console.log('  Tracked:', isTracked);

  const submitTx = await computeRouter.write.submitJob([userAddress, detailsHash, isTracked]);
  const submitReceipt = await publicClient.waitForTransactionReceipt({ hash: submitTx });
  console.log('Submit transaction hash:', submitTx);
  console.log('Submit transaction confirmed in block:', submitReceipt.blockNumber);

  // Get the new job ID
  const newJobCount = await computeRouter.read.jobCount();
  const jobId = newJobCount;
  console.log('New job ID:', jobId);

  // 3. Record a routing decision
  const providerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`;
  const amount = 1000n;
  const routingHash = '0x0000000000000000000000000000000000000000000000000000000000000002' as `0x${string}`;

  console.log('Recording routing decision...');
  console.log('  Provider:', providerAddress);
  console.log('  Amount:', amount);
  console.log('  Routing hash:', routingHash);

  const routeTx = await computeRouter.write.recordRoutingDecision([jobId, providerAddress, amount, routingHash]);
  const routeReceipt = await publicClient.waitForTransactionReceipt({ hash: routeTx });
  console.log('Route transaction hash:', routeTx);
  console.log('Route transaction confirmed in block:', routeReceipt.blockNumber);

  // 4. Read back the job data
  const job = await computeRouter.read.getJob([jobId]);
  console.log('Job data:');
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
  console.log('Querying events...');

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
    console.log('  Job ID:', event.args.jobId);
    console.log('  User:', event.args.user);
    console.log('  Details hash:', event.args.detailsHash);
    console.log('  Is tracked:', event.args.isTracked);
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
    console.log('  Job ID:', event.args.jobId);
    console.log('  Provider:', event.args.provider);
    console.log('  Amount:', event.args.amount);
    console.log('  Routing hash:', event.args.routingHash);
  }

  console.log('Interaction complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
