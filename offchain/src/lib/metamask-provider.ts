/**
 * Gets the MetaMask EIP-1193 provider via EIP-6963 discovery.
 * This bypasses Phantom's window.ethereum override and returns
 * the MetaMask provider directly.
 */
export async function getMetaMaskProvider(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let found = false;

    const handler = (event: Event) => {
      const { info, provider } = (event as CustomEvent).detail as {
        info: { rdns: string; name: string };
        provider: unknown;
      };
      if (info.rdns === 'io.metamask') {
        found = true;
        window.removeEventListener('eip6963:announceProvider', handler);
        resolve(provider);
      }
    };

    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handler);
      if (!found) {
        reject(new Error('MetaMask extension not found. Please install MetaMask.'));
      }
    }, 1000);
  });
}
