import { network } from 'hardhat';
import { defineChain } from 'viem';

const CONTRACT_ADDRESS = '0x213E3C8C9C3E5F94455Fc1606D97555e5aaf7FA7';
const FAUCET_AMOUNT = 10_000n * 1_000_000n; // 10,000 tUSDC (6 decimals)

const adiChain = defineChain({
  id: 99999,
  name: 'ADI Chain',
  network: 'adiTestnet',
  nativeCurrency: { name: 'ADI', symbol: 'ADI', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ab.testnet.adifoundation.ai'] } },
});

// const recipient = process.argv[2];
const recipient = process.env.RECIPIENT_ADDRESS;
if (!recipient) {
  console.error('Usage: RECIPIENT_ADDRESS=<address> npx hardhat run scripts/mint-usdc.ts --network adiTestnet');
  process.exit(1);
}

const { viem } = await network.connect('adiTestnet');

const publicClient = await viem.getPublicClient({ chain: adiChain });
const [senderClient] = await viem.getWalletClients({ chain: adiChain });
if (!senderClient) throw new Error('No wallet client. Set TESTNET_PRIVATE_KEY in hardhat config.');

const usdcContract = await viem.getContractAt('TestnetUSDC', CONTRACT_ADDRESS, {
  client: { public: publicClient, wallet: senderClient },
});

const tx = await senderClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: usdcContract.abi,
  functionName: 'mint',
  args: [recipient as `0x${string}`, FAUCET_AMOUNT],
});

await publicClient.waitForTransactionReceipt({ hash: tx });
console.log(`Minted 10,000 tUSDC to ${recipient}`);
console.log(`Tx: ${tx}`);
