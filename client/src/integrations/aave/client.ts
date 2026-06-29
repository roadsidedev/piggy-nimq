import { type Chain, createPublicClient, createWalletClient, custom, http } from "viem";
import { polygon, baseSepolia } from "viem/chains";
import { getEthereumProvider } from "@/integrations/nimiq";
import { POLYGON_MAINNET, BASE_SEPOLIA } from "./constants";

function getChain(useTestnet: boolean): Chain {
  return useTestnet ? baseSepolia : polygon;
}

function getRpcUrl(useTestnet: boolean) {
  return useTestnet ? BASE_SEPOLIA.RPC_URL : POLYGON_MAINNET.RPC_URL;
}

export function createPublicViemClient(useTestnet = false) {
  return createPublicClient({
    chain: getChain(useTestnet),
    transport: http(getRpcUrl(useTestnet)),
  });
}

export function createWalletViemClient(useTestnet = false) {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("No EVM provider available");
  }

  return createWalletClient({
    chain: getChain(useTestnet),
    transport: custom(provider),
  });
}
