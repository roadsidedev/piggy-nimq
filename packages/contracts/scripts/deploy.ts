import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // -----------------------------------------------------------------------
  // Configuration — set these via hardhat vars or environment
  // -----------------------------------------------------------------------
  const config = {
    admin: vars.get("PIGGY_ADMIN", deployer.address),
    operator: vars.get("PIGGY_OPERATOR", deployer.address),
    asset: vars.get("PIGGY_ASSET", ""),       // Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    aavePool: vars.get("AAVE_POOL", ""),       // Base Sepolia Aave V3 Pool: 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27
    aToken: vars.get("A_TOKEN", ""),           // aUSDC: 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC
    variableDebtToken: vars.get("VARIABLE_DEBT_TOKEN", ""), // variableDebtUSDC: 0xFB3e85601b7fEb3691bbb8779Ef0E1069E347204
    maxUserLTVBps: 5000,   // 50%
    minHealthFactorBuffer: ethers.parseEther("1.5"),
  };

  if (!config.asset || !config.aavePool || !config.aToken || !config.variableDebtToken) {
    console.error("Missing required config. Set PIGGY_ASSET, AAVE_POOL, A_TOKEN, VARIABLE_DEBT_TOKEN");
    process.exit(1);
  }

  // -----------------------------------------------------------------------
  // Step 1: Deploy AaveV3Adapter (UUPS proxy)
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyAaveV3Adapter ---");
  const AdapterFactory = await ethers.getContractFactory("PiggyAaveV3Adapter");
  // Temporarily use admin as the vault address in the initializer (ZeroAddress reverts).
  // We'll update it to the real vault address via setVault() after vault deployment.
  const TEMP_VAULT = config.admin;
  const adapter = await upgrades.deployProxy(AdapterFactory, [
    config.admin,
    TEMP_VAULT, // placeholder — set to real vault after vault deployment
    config.aavePool,
    config.asset,
    config.aToken,
    config.variableDebtToken,
  ], { kind: "uups" });
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log("Adapter proxy:", adapterAddress);

  // -----------------------------------------------------------------------
  // Step 2: Deploy PiggyVault (UUPS proxy)
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyVault ---");
  const VaultFactory = await ethers.getContractFactory("PiggyVault");
  const vault = await upgrades.deployProxy(VaultFactory, [
    config.admin,
    config.operator,
    config.asset,
    adapterAddress,
    config.maxUserLTVBps,
    config.minHealthFactorBuffer,
  ], { kind: "uups" });
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault proxy:", vaultAddress);

  // -----------------------------------------------------------------------
  // Step 3: Wire adapter back to vault
  // -----------------------------------------------------------------------
  console.log("\n--- Wiring adapter to vault ---");
  await adapter.connect(deployer).setVault(vaultAddress);
  console.log("Adapter vault set to:", vaultAddress);

  // -----------------------------------------------------------------------
  // Step 4: Deploy PiggyGoalManager
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyGoalManager ---");
  const GMFactory = await ethers.getContractFactory("PiggyGoalManager");
  const gm = await upgrades.deployProxy(GMFactory, [config.admin], { kind: "uups" });
  await gm.waitForDeployment();
  const gmAddress = await gm.getAddress();
  console.log("GoalManager proxy:", gmAddress);

  await gm.connect(deployer).setVault(vaultAddress, true);
  console.log("Vault authorized on GoalManager");

  await vault.connect(deployer).setGoalManager(gmAddress);
  console.log("GoalManager set on vault");

  // -----------------------------------------------------------------------
  // Step 5: Deploy PiggyChallengeManager
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyChallengeManager ---");
  const CMFactory = await ethers.getContractFactory("PiggyChallengeManager");
  const cm = await upgrades.deployProxy(CMFactory, [config.admin], { kind: "uups" });
  await cm.waitForDeployment();
  const cmAddress = await cm.getAddress();
  console.log("ChallengeManager proxy:", cmAddress);

  await cm.connect(deployer).setVault(vaultAddress, true);
  console.log("Vault authorized on ChallengeManager");

  await vault.connect(deployer).setChallengeManager(cmAddress);
  console.log("ChallengeManager set on vault");

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("Admin:", config.admin);
  console.log("Operator:", config.operator);
  console.log("Asset:", config.asset);
  console.log("Aave Pool:", config.aavePool);
  console.log("AaveV3Adapter:", adapterAddress);
  console.log("PiggyVault:", vaultAddress);
  console.log("PiggyGoalManager:", gmAddress);
  console.log("PiggyChallengeManager:", cmAddress);
  console.log("========================================");
}

main().catch(console.error);
