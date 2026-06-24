import { init, getHostLanguage, requestDeviceIdentifier } from "@nimiq/mini-app-sdk";
import type { NimiqProvider, EthereumProvider, NimiqWindow } from "@/types/nimiq";
import { NIMIQ_SDK_TIMEOUT } from "./constants";

declare const window: NimiqWindow;

let sdkInstance: Awaited<ReturnType<typeof init>> | null = null;
let sdkInitPromise: Promise<Awaited<ReturnType<typeof init>>> | null = null;

export async function initNimiqSDK(): Promise<Awaited<ReturnType<typeof init>>> {
  if (sdkInstance) return sdkInstance;
  if (sdkInitPromise) return sdkInitPromise;

  sdkInitPromise = init({ timeout: NIMIQ_SDK_TIMEOUT }).then((instance) => {
    sdkInstance = instance;
    return instance;
  });

  return sdkInitPromise;
}

export function getNimiqSDK(): Awaited<ReturnType<typeof init>> | null {
  return sdkInstance;
}

export function getNimiqProvider(): NimiqProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.nimiq;
}

export function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

export function isNimiqPay(): boolean {
  const ethereum = getEthereumProvider();
  return !!(ethereum?.isNimiq);
}

export function getLanguage(): string | undefined {
  return getHostLanguage();
}

export async function requestId(reason: string): Promise<string> {
  return requestDeviceIdentifier({ reason });
}
