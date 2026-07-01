import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config";

// Already-deployed addresses from deploy-v1
const EXISTING = {
  asset: "0x95dFf7AF6FE38a2cF6F3448B829Dc278Ae33873e",
  faucet: "0x4bD93bB444A9335cBFB52d9459a478C68F7DCe4B",
  adapter: "0x196064333Efd80c06D0406ab49a4A756B4Ef2f44",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const network = await ethers.provider.getNetwork();
  console.log("Chain ID:", Number(network.chainId));

  const config = {
    admin: vars.get("PIGGY_ADMIN", deployer.address),
    operator: vars.get("PIGGY_OPERATOR", deployer.address),
    maxUserLTVBps: 5000,
    minHealthFactorBuffer: ethers.parseEther("1.5"),
  };

  // -----------------------------------------------------------------------
  // Step 1: Wire the already-deployed MockAaveAdapter
  // -----------------------------------------------------------------------
  console.log("\n--- Wiring MockAaveAdapter (setAsset + setVault placeholder) ---");
  const adapter = await ethers.getContractAt("MockAaveAdapter", EXISTING.adapter);

  // -----------------------------------------------------------------------
  // Step 2: Deploy PiggyVault (UUPS proxy)
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyVault ---");
  const VaultFactory = await ethers.getContractFactory("PiggyVault");
  const vault = await upgrades.deployProxy(VaultFactory, [
    config.admin,
    config.operator,
    EXISTING.asset,
    EXISTING.adapter,
    config.maxUserLTVBps,
    config.minHealthFactorBuffer,
  ], { kind: "uups" });
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault proxy:", vaultAddress);

  // Set vault on adapter
  await adapter.setVault(vaultAddress);
  console.log("Adapter vault set to:", vaultAddress);

  // -----------------------------------------------------------------------
  // Step 3: Deploy PiggyGoalManager
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyGoalManager ---");
  const GMFactory = await ethers.getContractFactory("PiggyGoalManager");
  const gm = await upgrades.deployProxy(GMFactory, [config.admin], { kind: "uups" });
  await gm.waitForDeployment();
  const gmAddress = await gm.getAddress();
  console.log("GoalManager proxy:", gmAddress);

  await gm.setVault(vaultAddress, true);
  console.log("Vault authorized on GoalManager");

  await vault.setGoalManager(gmAddress);
  console.log("GoalManager set on vault");

  // -----------------------------------------------------------------------
  // Step 4: Deploy PiggyChallengeManager
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyChallengeManager ---");
  const CMFactory = await ethers.getContractFactory("PiggyChallengeManager");
  const cm = await upgrades.deployProxy(CMFactory, [config.admin], { kind: "uups" });
  await cm.waitForDeployment();
  const cmAddress = await cm.getAddress();
  console.log("ChallengeManager proxy:", cmAddress);

  await cm.setVault(vaultAddress, true);
  console.log("Vault authorized on ChallengeManager");

  await vault.setChallengeManager(cmAddress);
  console.log("ChallengeManager set on vault");

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("Admin:", config.admin);
  console.log("Operator:", config.operator);
  console.log("Asset (USDT):", EXISTING.asset);
  console.log("Faucet:", EXISTING.faucet);
  console.log("MockAaveAdapter:", EXISTING.adapter);
  console.log("PiggyVault:", vaultAddress);
  console.log("PiggyGoalManager:", gmAddress);
  console.log("PiggyChallengeManager:", cmAddress);
  console.log("========================================");
}

main().catch(console.error);
