export const config = {
  paymaster: {
    url: import.meta.env.VITE_PAYMASTER_URL as string | undefined,
    apiKey: import.meta.env.VITE_PAYMASTER_API_KEY as string | undefined,
  },
  rpc: {
    polygon: import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com",
    polygonAmoy: import.meta.env.VITE_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
  },
  useTestnet: import.meta.env.VITE_USE_TESTNET !== "false",
} as const;
