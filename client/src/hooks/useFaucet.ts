import { useState } from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { PIGGY_CONTRACTS, RPC_URL } from "@/integrations/contracts/constants";
import { getEthereumProvider } from "@/integrations/nimiq";
import { ensureCorrectChain } from "@/integrations/wallet/chain";

const FAUCET_ABI = [
  {
    type: "function",
    name: "drip",
    inputs: [{ name: "to", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(RPC_URL),
});

export function useFaucet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drip = async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await ensureCorrectChain();
      const provider = getEthereumProvider();
      if (!provider) throw new Error("No wallet provider found");

      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: polygonAmoy,
        transport: custom(provider),
      });

      let gas: bigint;
      let gasPrice: bigint;
      let nonce: number;
      try {
        const [estimated, price, count] = await Promise.all([
          publicClient.estimateContractGas({
            address: PIGGY_CONTRACTS.faucet as `0x${string}`,
            abi: FAUCET_ABI,
            functionName: "drip",
            args: [address as `0x${string}`],
            account: address as `0x${string}`,
          }),
          publicClient.getGasPrice(),
          publicClient.getTransactionCount({ address: address as `0x${string}` }),
        ]);
        gas = (estimated * 130n) / 100n;
        gasPrice = price;
        nonce = count;
      } catch {
        gas = 200_000n;
        gasPrice = 50_000_000_000n;
        nonce = await publicClient.getTransactionCount({ address: address as `0x${string}` }).catch(() => 0);
      }

      const hash = await walletClient.writeContract({
        chain: polygonAmoy,
        address: PIGGY_CONTRACTS.faucet as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: "drip",
        args: [address],
        gas,
        gasPrice,
        nonce,
        type: "legacy",
      } as never);

      if (!hash) throw new Error("Faucet transaction failed");

      await publicClient.waitForTransactionReceipt({ hash });

      return true;
    } catch (err) {
      let message: string;
      if (err instanceof Error) {
        const errObj = err as { code?: number; shortMessage?: string };
        if (errObj.code === 4001) {
          message = "Transaction was not signed. Please try again and approve the request in your wallet.";
        } else if (errObj.shortMessage) {
          message = errObj.shortMessage;
        } else {
          message = err.message;
        }
      } else {
        message = "Faucet request failed";
      }
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { drip, isLoading, error, clearError: () => setError(null) };
}