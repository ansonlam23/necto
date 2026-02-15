import { network } from 'hardhat';
import { type Abi, defineChain } from 'viem';

const CONTRACT_ADDRESS = '0x3f0c2Bee1b84038525E4abD172138090B68862C9';

const adiChain = defineChain({
  id: 99999,
  name: 'ADI Chain',
  network: 'adiTestnet',
  nativeCurrency: { name: 'ADI', symbol: 'ADI', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ab.testnet.adifoundation.ai'] } },
});

const { viem } = await network.connect('adiTestnet');

const publicClient = await viem.getPublicClient({ chain: adiChain });
const [senderClient] = await viem.getWalletClients({ chain: adiChain });
if (!senderClient) throw new Error('No wallet client. Set TESTNET_PRIVATE_KEY in hardhat config.');

const counterContract = await viem.getContractAt('Counter', CONTRACT_ADDRESS, {
  client: { public: publicClient, wallet: senderClient },
});

const initialCount = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: counterContract.abi as Abi,
  functionName: 'x',
});
console.log('Initial count:', initialCount);

const tx = await senderClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: counterContract.abi as Abi,
  functionName: 'incBy',
  args: [1n],
});
await publicClient.waitForTransactionReceipt({ hash: tx });
console.log('Transaction sent successfully');

const newCount = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: counterContract.abi as Abi,
  functionName: 'x',
});
console.log('New count:', newCount);