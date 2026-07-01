import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config";

const EXISTING = {
  vault: "0x7008DCE2C72F2eb70A7179a2b400A1177a32FA6B",
  goalManager: "0xa0826186E560DA3836621A16a2069a691D9fd234",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const config = {
    admin: vars.get("PIGGY_ADMIN", deployer.address),
  };

  // Deploy PiggyChallengeManager
  console.log("\n--- Deploying PiggyChallengeManager ---");
  const CMFactory = await ethers.getContractFactory("PiggyChallengeManager");
  const cm = await upgrades.deployProxy(CMFactory, [config.admin], { kind: "uups" });
  await cm.waitForDeployment();
  const cmAddress = await cm.getAddress();
  console.log("ChallengeManager proxy:", cmAddress);

  // Wire to vault
  await cm.setVault(EXISTING.vault, true);
  console.log("Vault authorized on ChallengeManager");

  const vault = await ethers.getContractAt("PiggyVault", EXISTING.vault);
  await vault.setChallengeManager(cmAddress);
  console.log("ChallengeManager set on vault");

  console.log("\n========== SUMMARY ==========");
  console.log("PiggyVault:", EXISTING.vault);
  console.log("PiggyGoalManager:", EXISTING.goalManager);
  console.log("PiggyChallengeManager:", cmAddress);
}

main().catch(console.error);
