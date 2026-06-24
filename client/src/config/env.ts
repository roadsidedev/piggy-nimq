function requireEnv(key: string, fallback = ""): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    if (!import.meta.env.PROD) {
      console.warn(`[env] Missing ${key} — using fallback. Set in .env for full functionality.`);
    }
    return fallback;
  }
  return value;
}

export const config = {
  paymaster: {
    url: requireEnv("VITE_PAYMASTER_URL"),
    apiKey: requireEnv("VITE_PAYMASTER_API_KEY"),
  },
  rpc: {
    polygon: import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com",
    polygonAmoy: import.meta.env.VITE_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
  },
  useTestnet: import.meta.env.VITE_USE_TESTNET !== "false",
} as const;
