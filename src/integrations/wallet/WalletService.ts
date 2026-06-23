import type { NimiqProfile } from "@/types/nimiq";
import { getEthereumProvider, isNimiqPay, NIMIQ_EVENTS, POLYGON_CHAIN_ID, initNimiqSDK } from "@/integrations/nimiq";

export class WalletService {
  private profile: NimiqProfile | null = null;
  private address: `0x${string}` | null = null;
  private nimiqAddress: string | null = null;
  private nimiqConsensus: boolean | null = null;

  async connect(): Promise<NimiqProfile> {
    const provider = getEthereumProvider();
    if (!provider) {
      throw new Error("No EVM provider found. Open Piggy inside Nimiq Pay.");
    }

    const accounts = await provider.request({
      method: "eth_requestAccounts",
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts returned from provider.");
    }

    const account = accounts[0] as `0x${string}`;
    this.address = account;

    this.profile = {
      address: account,
      name: account.slice(0, 6),
    };

    try {
      const nimiq = await initNimiqSDK();
      const nAccounts = await nimiq.listAccounts();
      if (Array.isArray(nAccounts) && nAccounts.length > 0) {
        this.nimiqAddress = nAccounts[0] as string;
      }
      this.nimiqConsensus = await nimiq.isConsensusEstablished();
    } catch {
      // Nimiq SDK may not be available — proceed with EVM-only
    }

    return this.profile;
  }

  disconnect(): void {
    this.profile = null;
    this.address = null;
    this.nimiqAddress = null;
    this.nimiqConsensus = null;
  }

  getProfile(): NimiqProfile | null {
    return this.profile;
  }

  getAddress(): `0x${string}` | null {
    return this.address;
  }

  getNimiqAddress(): string | null {
    return this.nimiqAddress;
  }

  getNimiqConsensus(): boolean | null {
    return this.nimiqConsensus;
  }

  async switchChain(chainId: number = POLYGON_CHAIN_ID): Promise<void> {
    const provider = getEthereumProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 4902) {
        throw new Error("Chain not available. Please add Polygon to your wallet.");
      }
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    const provider = getEthereumProvider();
    if (!provider || !this.address) {
      throw new Error("Wallet not connected.");
    }

    const signature = await provider.request({
      method: "personal_sign",
      params: [message, this.address],
    });

    return signature as string;
  }

  isConnected(): boolean {
    return this.address !== null;
  }

  isNimiqPay(): boolean {
    return isNimiqPay();
  }

  onAccountsChanged(handler: (accounts: string[]) => void): void {
    const provider = getEthereumProvider();
    provider?.on(NIMIQ_EVENTS.ACCOUNT_CHANGED, handler as (...args: unknown[]) => void);
  }

  onChainChanged(handler: (chainId: string) => void): void {
    const provider = getEthereumProvider();
    provider?.on(NIMIQ_EVENTS.CHAIN_CHANGED, handler as (...args: unknown[]) => void);
  }

  removeListeners(): void {
    const provider = getEthereumProvider();
    if (!provider) return;
    provider.removeListener(NIMIQ_EVENTS.ACCOUNT_CHANGED, () => {});
    provider.removeListener(NIMIQ_EVENTS.CHAIN_CHANGED, () => {});
  }
}

export const walletService = new WalletService();
