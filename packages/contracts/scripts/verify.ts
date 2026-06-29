import { ethers, run } from "hardhat";

/**
 * Verify all deployed UUPS proxy implementations on Etherscan/PolygonScan.
 *
 * Usage (after deployment):
 *   export ADAPTER_PROXY=<proxy_address>
 *   export VAULT_PROXY=<proxy_address>
 *   export GOAL_MANAGER_PROXY=<proxy_address>
 *   export CHALLENGE_MANAGER_PROXY=<proxy_address>
 *   npx hardhat run scripts/verify.ts --network baseSepolia
 *   npx hardhat run scripts/verify.ts --network polygonAmoy
 *
 * This script reads the implementation address from each proxy's EIP1967
 * storage slot and verifies it via hardhat-verify. The proxy contracts
 * themselves (ERC1967Proxy) are standard well-known contracts that are
 * typically already verified on block explorers; this script focuses on
 * verifying the custom implementation logic.
 */
async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  console.log(`Network: ${networkName}\n`);

  // Map proxy addresses to contract names via environment variables
  const proxyEnvVars: Record<string, string> = {
    PiggyAaveV3Adapter: process.env.ADAPTER_PROXY || "",
    PiggyVault: process.env.VAULT_PROXY || "",
    PiggyGoalManager: process.env.GOAL_MANAGER_PROXY || "",
    PiggyChallengeManager: process.env.CHALLENGE_MANAGER_PROXY || "",
  };

  const active: [string, string][] = Object.entries(proxyEnvVars)
    .filter(([, addr]) => addr !== "") as [string, string][];

  if (active.length === 0) {
    console.error(
      "No proxy addresses found. Set environment variables:\n" +
      "  ADAPTER_PROXY=<address>\n" +
      "  VAULT_PROXY=<address>\n" +
      "  GOAL_MANAGER_PROXY=<address>\n" +
      "  CHALLENGE_MANAGER_PROXY=<address>"
    );
    process.exit(1);
  }

  // EIP1967 UUPS/Transparent proxy implementation storage slot
  // keccak256("eip1967.proxy.implementation") - 1
  const EIP1967_IMPL_SLOT =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

  let verified = 0;
  let failed = 0;

  for (const [name, proxyAddr] of active) {
    console.log(`\n━━━ ${name} ━━━`);
    console.log(`  Proxy: ${proxyAddr}`);

    try {
      // Read implementation address from the proxy's EIP1967 storage slot
      const storageValue = await ethers.provider.getStorage(
        proxyAddr,
        EIP1967_IMPL_SLOT
      );
      const implAddr = ethers.getAddress("0x" + storageValue.slice(26));
      console.log(`  Implementation: ${implAddr}`);

      // Verify the implementation contract on the block explorer
      await run("verify:verify", {
        address: implAddr,
        constructorArguments: [],
      });

      console.log(`  ✅ ${name} implementation verified`);
      verified++;
    } catch (e: any) {
      const msg = e.message?.toLowerCase() || "";
      if (msg.includes("already verified") || msg.includes("already")) {
        console.log(`  ⚠️  Already verified`);
        verified++;
      } else {
        console.log(`  ❌ ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Verified: ${verified}  Failed: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch(console.error);
