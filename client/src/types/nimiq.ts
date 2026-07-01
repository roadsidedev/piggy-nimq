export interface NimiqProfile {
  name?: string;
  address: string;
}

export interface NimiqProvider {
  isNimiq: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface EthereumProvider {
  isMetaMask?: boolean;
  isNimiq?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface NimiqWindow {
  nimiq?: NimiqProvider;
  ethereum?: EthereumProvider;
  nimiqPay?: {
    language?: string;
    requestDeviceIdentifier?: (options: { reason: string }) => Promise<string>;
  };
}

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";
