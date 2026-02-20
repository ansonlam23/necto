import { network } from 'hardhat';
import { defineChain } from 'viem';

const USDC_ADDRESS: `0x${string}` = '0xfDc76858e4Bd9CF760F1b52e57434977605931AC';
const USDC_DECIMALS = 6;

const FAUCET_AMOUNT = 10_000n * BigInt(10 ** USDC_DECIMALS);

const adiChain = defineChain({
  id: 99999,
  name: 'ADI Chain',
  network: 'adiTestnet',
  nativeCurrency: { name: 'ADI', symbol: 'ADI', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ab.testnet.adifoundation.ai'] } },
});

const recipient = process.env.RECIPIENT_ADDRESS;
if (!recipient) {
  console.error('Usage: RECIPIENT_ADDRESS=<address> npx hardhat run scripts/mint-usdc.ts --network adiTestnet');
  process.exit(1);
}

const { viem } = await network.connect('adiTestnet');

const publicClient = await viem.getPublicClient({ chain: adiChain });
const [senderClient] = await viem.getWalletClients({ chain: adiChain });
if (!senderClient) throw new Error('No wallet client. Set TESTNET_PRIVATE_KEY in hardhat config.');

const [account] = await senderClient.getAddresses();
if (!account) throw new Error('No account found in wallet client.');

const usdcContract = await viem.getContractAt('TestnetUSDC', USDC_ADDRESS, {
  client: { public: publicClient, wallet: senderClient },
});

const { request } = await publicClient.simulateContract({
  address: USDC_ADDRESS,
  abi: usdcContract.abi,
  functionName: 'mint',
  args: [recipient as `0x${string}`, FAUCET_AMOUNT],
  account,
});

const tx = await senderClient.writeContract(request);

await publicClient.waitForTransactionReceipt({ hash: tx });
console.log(`Minted 10,000 tUSDC to ${recipient}`);
console.log(`Tx: ${tx}`);
