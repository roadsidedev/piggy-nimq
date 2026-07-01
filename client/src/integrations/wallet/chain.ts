import { polygonAmoy } from "viem/chains";
import { getEthereumProvider } from "@/integrations/nimiq";

const TARGET_CHAIN = polygonAmoy;
const TARGET_CHAIN_ID = `0x${TARGET_CHAIN.id.toString(16)}`;

const ADD_CHAIN_PARAMS = {
  chainId: TARGET_CHAIN_ID,
  chainName: TARGET_CHAIN.name,
  nativeCurrency: TARGET_CHAIN.nativeCurrency,
  rpcUrls: [TARGET_CHAIN.rpcUrls.default.http[0]],
  blockExplorerUrls: [TARGET_CHAIN.blockExplorers.default.url],
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function ensureCorrectChain(): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No EVM provider available");

  const currentChainId = (await provider.request({
    method: "eth_chainId",
  })) as string;

  if (currentChainId === TARGET_CHAIN_ID) return;

  let triedAdd = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (!triedAdd) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TARGET_CHAIN_ID }],
        });
      } catch (error: unknown) {
        const err = error as { code?: number; message?: string };
        if (err.code === 4902) {
          // Chain not in wallet — add it
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [ADD_CHAIN_PARAMS],
          });
          triedAdd = true;
        } else {
          // User rejected or other error — rethrow
          throw error;
        }
      }
    }

    // Verify the switch took effect
    for (let verify = 0; verify < 5; verify++) {
      const after = (await provider.request({
        method: "eth_chainId",
      })) as string;
      if (after === TARGET_CHAIN_ID) return;
      await sleep(500);
    }

    // If we tried adding but the chain still isn't set, try switching one more time
    if (triedAdd) {
      triedAdd = false; // allow one more switch attempt
      continue;
    }
    break;
  }

  throw new Error(
    `Failed to switch wallet to ${TARGET_CHAIN.name} (chain ID ${TARGET_CHAIN.id}). ` +
      `Please switch manually in your wallet.`,
  );
}
