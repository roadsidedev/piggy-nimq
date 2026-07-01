import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isAmoy = chainId === 80002;
  console.log(`Chain ID: ${chainId} (${isAmoy ? "Polygon Amoy" : chainId === 137 ? "Polygon Mainnet" : "other"})`);

  // -----------------------------------------------------------------------
  // Configuration
  // -----------------------------------------------------------------------
  const config = {
    admin: vars.get("PIGGY_ADMIN", deployer.address),
    operator: vars.get("PIGGY_OPERATOR", deployer.address),
    asset: vars.get("PIGGY_ASSET", ""),       // If empty, deploys MockERC20 (testnet only)
    maxUserLTVBps: 5000,   // 50%
    minHealthFactorBuffer: ethers.parseEther("1.5"),
  };

  // -----------------------------------------------------------------------
  // Step 0: Deploy MockERC20 (USDT) if no asset address provided (testnet)
  // -----------------------------------------------------------------------
  let assetAddress: string;
  let faucetAddress: string | undefined;

  if (config.asset) {
    console.log(`\n--- Using existing asset at: ${config.asset} ---`);
    assetAddress = config.asset;
  } else {
    console.log("\n--- Deploying MockERC20 (USDT) ---");
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockUsdt = await MockERC20Factory.deploy("Tether USD", "USDT", 6);
    await mockUsdt.waitForDeployment();
    assetAddress = await mockUsdt.getAddress();
    console.log("Mock USDT deployed at:", assetAddress);

    // Mint 100,000 USDT to deployer for distribution
    const mintAmount = ethers.parseUnits("100000", 6);
    await mockUsdt.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} USDT to deployer`);

    // Deploy Faucet
    console.log("\n--- Deploying Faucet ---");
    const FaucetFactory = await ethers.getContractFactory("Faucet");
    const faucet = await FaucetFactory.deploy(assetAddress);
    await faucet.waitForDeployment();
    const faucetAddress = await faucet.getAddress();
    console.log("Faucet deployed at:", faucetAddress);
  }

  // -----------------------------------------------------------------------
  // Step 1: Deploy MockAaveAdapter (no real Aave pool needed)
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying MockAaveAdapter ---");
  const AdapterFactory = await ethers.getContractFactory("MockAaveAdapter");
  const adapter = await AdapterFactory.deploy();
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log("MockAaveAdapter deployed at:", adapterAddress);

  await adapter.setAsset(assetAddress);
  console.log("Adapter asset set to:", assetAddress);

  // -----------------------------------------------------------------------
  // Step 2: Deploy PiggyVault (UUPS proxy)
  // -----------------------------------------------------------------------
  console.log("\n--- Deploying PiggyVault ---");
  const VaultFactory = await ethers.getContractFactory("PiggyVault");
  const vault = await upgrades.deployProxy(VaultFactory, [
    config.admin,
    config.operator,
    assetAddress,
    adapterAddress,
    config.maxUserLTVBps,
    config.minHealthFactorBuffer,
  ], { kind: "uups" });
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault proxy:", vaultAddress);

  // -----------------------------------------------------------------------
  // Step 3: Wire adapter to vault
  // -----------------------------------------------------------------------
  console.log("\n--- Wiring adapter to vault ---");
  await adapter.setVault(vaultAddress);
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
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  console.log("Admin:", config.admin);
  console.log("Operator:", config.operator);
  console.log("Asset (USDT):", assetAddress);
  console.log("MockAaveAdapter:", adapterAddress);
  console.log("PiggyVault:", vaultAddress);
  console.log("PiggyGoalManager:", gmAddress);
  console.log("PiggyChallengeManager:", cmAddress);
  if (!config.asset) {
    console.log("Faucet:", faucetAddress);
  }
  console.log("========================================");
  console.log("\nRoles on vault:");
  console.log("  DEFAULT_ADMIN_ROLE ->", config.admin);
  console.log("  PAUSER_ROLE       ->", config.admin);
  console.log("  UPGRADER_ROLE     ->", config.admin);
  console.log("  RISK_MANAGER_ROLE ->", config.admin);
  console.log("  GOVERNANCE_ROLE   ->", config.admin);
  console.log("  OPERATOR_ROLE     ->", config.operator);
  console.log(""); 
}

main().catch(console.error);
