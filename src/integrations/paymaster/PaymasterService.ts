import { config } from "@/config/env";

export type GasStrategy = "native" | "paymaster" | "fallback";

interface SponsorResponse {
  sponsored: boolean;
  txHash?: string;
  error?: string;
}

interface GasQuote {
  strategy: GasStrategy;
  sponsored: boolean;
  estimatedGas: bigint;
  polRequired: boolean;
}

export class PaymasterService {
  private sponsorshipLimit = 100;
  private userTxCount: Map<string, number> = new Map();

  private get endpointUrl(): string | undefined {
    return config.paymaster.url;
  }

  private get apiKey(): string | undefined {
    return config.paymaster.apiKey;
  }

  getGasStrategy(userAddress: string): GasStrategy {
    const count = this.userTxCount.get(userAddress) ?? 0;

    if (!this.endpointUrl) {
      return "native";
    }

    if (count < this.sponsorshipLimit) {
      return "paymaster";
    }

    return "native";
  }

  async quoteGas(userAddress: string, txType: string): Promise<GasQuote> {
    if (!this.endpointUrl) {
      return {
        strategy: "native",
        sponsored: false,
        estimatedGas: 100000n,
        polRequired: true,
      };
    }

    try {
      const response = await fetch(`${this.endpointUrl}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
        },
        body: JSON.stringify({ userAddress, txType }),
      });

      if (!response.ok) {
        throw new Error(`Paymaster quote failed: ${response.status}`);
      }

      const data = await response.json() as GasQuote;
      return data;
    } catch {
      const strategy = this.getGasStrategy(userAddress);
      return {
        strategy,
        sponsored: strategy === "paymaster",
        estimatedGas: 100000n,
        polRequired: strategy !== "paymaster",
      };
    }
  }

  async sponsorTransaction(
    userAddress: string,
    txData: { to: string; data: string; gasLimit?: string },
  ): Promise<SponsorResponse> {
    if (!this.endpointUrl) {
      return { sponsored: false, error: "Paymaster not configured" };
    }

    try {
      const response = await fetch(`${this.endpointUrl}/sponsor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
        },
        body: JSON.stringify({ userAddress, ...txData }),
      });

      if (!response.ok) {
        throw new Error(`Sponsorship failed: ${response.status}`);
      }

      const data = await response.json() as SponsorResponse;
      return data;
    } catch (err) {
      return {
        sponsored: false,
        error: err instanceof Error ? err.message : "Sponsorship request failed",
      };
    }
  }

  recordTransaction(userAddress: string): void {
    const count = this.userTxCount.get(userAddress) ?? 0;
    this.userTxCount.set(userAddress, count + 1);
  }

  getRemainingSponsorships(userAddress: string): number {
    const count = this.userTxCount.get(userAddress) ?? 0;
    return Math.max(0, this.sponsorshipLimit - count);
  }

  isSponsorshipAvailable(userAddress: string): boolean {
    return this.getRemainingSponsorships(userAddress) > 0;
  }
}

export const paymasterService = new PaymasterService();
