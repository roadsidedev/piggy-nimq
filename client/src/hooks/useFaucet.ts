import { useState } from "react";
import { createPublicClient, createWalletClient, custom } from "viem";
import { polygonAmoy } from "viem/chains";
import { PIGGY_CONTRACTS } from "@/integrations/contracts/constants";
import { getEthereumProvider } from "@/integrations/nimiq";

const FAUCET_ABI = [
  {
    type: "function",
    name: "drip",
    inputs: [{ name: "to", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export function useFaucet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drip = async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getEthereumProvider();
      if (!provider) throw new Error("No wallet provider found");

      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: polygonAmoy,
        transport: custom(provider),
      });

      const hash = await walletClient.writeContract({
        address: PIGGY_CONTRACTS.faucet as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: "drip",
        args: [address],
      } as never);

      if (!hash) throw new Error("Faucet transaction failed");

      const publicClient = createPublicClient({
        chain: polygonAmoy,
        transport: custom(provider),
      });
      await publicClient.waitForTransactionReceipt({ hash });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Faucet request failed";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { drip, isLoading, error, clearError: () => setError(null) };
}
