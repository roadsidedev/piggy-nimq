/**
 * Verify contracts via the Etherscan V2 API directly (bypasses hardhat-verify
 * which doesn't natively support the V2 unified endpoint).
 *
 * Usage:
 *   ADAPTER_PROXY=<addr> VAULT_PROXY=<addr> GOAL_MANAGER_PROXY=<addr> CHALLENGE_MANAGER_PROXY=<addr> \
 *     npx hardhat run scripts/verify-v2.ts --network baseSepolia
 */
import { ethers, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

// ─── Map contract names to their Solidity source paths ─────────────────
const CONTRACTS: Record<string, string> = {
  PiggyAaveV3Adapter: "contracts/adapters/AaveV3Adapter.sol",
  PiggyVault: "contracts/PiggyVault.sol",
  PiggyGoalManager: "contracts/GoalManager.sol",
  PiggyChallengeManager: "contracts/ChallengeManager.sol",
};

// EIP1967 UUPS/Transparent proxy implementation storage slot
const EIP1967_IMPL_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`Network chain ID: ${chainId}\n`);

  // 1. Gather proxy addresses
  const proxyEnv: Record<string, string> = {
    PiggyAaveV3Adapter: process.env.ADAPTER_PROXY || "",
    PiggyVault: process.env.VAULT_PROXY || "",
    PiggyGoalManager: process.env.GOAL_MANAGER_PROXY || "",
    PiggyChallengeManager: process.env.CHALLENGE_MANAGER_PROXY || "",
  };

  const active: [string, string][] = Object.entries(proxyEnv)
    .filter(([, addr]) => addr !== "") as [string, string][];

  if (active.length === 0) {
    console.error("No proxy addresses set. Export ADAPTER_PROXY, VAULT_PROXY, etc.");
    process.exit(1);
  }

  const apiKey = process.env.BASESCAN_API_KEY || "";
  if (!apiKey) {
    console.error("BASESCAN_API_KEY not set");
    process.exit(1);
  }

  // 2. For each proxy, get implementation address and verify
  let success = 0;
  let failed = 0;

  for (const [name, proxyAddr] of active) {
    console.log(`\n━━━ ${name} ━━━`);
    console.log(`  Proxy: ${proxyAddr}`);

    try {
      // Read implementation address from EIP1967 storage slot
      const storageValue = await ethers.provider.getStorage(proxyAddr, EIP1967_IMPL_SLOT);
      const implAddr = ethers.getAddress("0x" + storageValue.slice(26));
      console.log(`  Implementation: ${implAddr}`);

      // Check if already verified
      const alreadyVerified = await checkIfVerified(implAddr, apiKey, chainId);
      if (alreadyVerified) {
        console.log(`  ⚠️  Already verified`);
        success++;
        continue;
      }

      // Flatten the contract source
      const flatPath = path.join(__dirname, "..", "cache", `${name}_flattened.sol`);
      await flattenContract(CONTRACTS[name], flatPath);
      const flattenedSource = fs.readFileSync(flatPath, "utf8");
      console.log(`  Flattened source: ${(flattenedSource.length / 1024).toFixed(1)} KB`);

      // Submit to V2 API
      const result = await verifyViaV2Api({
        apiKey,
        chainId,
        contractAddress: implAddr,
        contractName: name,
        sourceCode: flattenedSource,
        compilerVersion: "v0.8.24+commit.e11b9ed9",
        optimizationUsed: 1,
        runs: 200,
      });

      if (result.status === "1" || result.message?.includes("already")) {
        console.log(`  ✅ ${name} verified`);
        success++;
      } else {
        console.log(`  ❌ ${result.result || result.message}`);
        failed++;
      }

      // Clean up flattened file
      try { fs.unlinkSync(flatPath); } catch {}
    } catch (e: any) {
      console.log(`  ❌ ${e.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Verified: ${success}  Failed: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function checkIfVerified(address: string, apiKey: string, chainId: number): Promise<boolean> {
  try {
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data: any = await res.json();
    return data.status === "1" && data.result?.[0]?.SourceCode !== "" && data.result?.[0]?.SourceCode !== undefined;
  } catch {
    return false;
  }
}

async function flattenContract(sourcePath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = cp.spawn("npx", ["hardhat", "flatten", sourcePath], {
      cwd: path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on("close", (code) => {
      if (code === 0) {
        fs.writeFileSync(outputPath, stdout);
        resolve();
      } else {
        reject(new Error(`Flatten failed (exit ${code}): ${stderr.slice(0, 200)}`));
      }
    });

    proc.on("error", reject);
  });
}

interface VerifyParams {
  apiKey: string;
  chainId: number;
  contractAddress: string;
  contractName: string;
  sourceCode: string;
  compilerVersion: string;
  optimizationUsed: number;
  runs: number;
}

async function verifyViaV2Api(params: VerifyParams): Promise<{ status: string; message: string; result: string }> {
  const url = "https://api.etherscan.io/v2/api";

  // Use URLSearchParams for the form body
  const body = new URLSearchParams();
  body.append("chainid", String(params.chainId));
  body.append("module", "contract");
  body.append("action", "verifysourcecode");
  body.append("apikey", params.apiKey);
  body.append("contractaddress", params.contractAddress);
  body.append("sourceCode", params.sourceCode);
  body.append("codeformat", "solidity-single-file");
  body.append("contractname", params.contractName);
  body.append("compilerversion", params.compilerVersion);
  body.append("optimizationUsed", String(params.optimizationUsed));
  body.append("runs", String(params.runs));
  body.append("constructorAruments", "");
  body.append("evmversion", "default");
  body.append("licenseType", "3"); // MIT

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "0", message: text.slice(0, 500), result: text.slice(0, 500) };
  }

  return parsed;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
