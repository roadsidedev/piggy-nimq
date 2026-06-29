import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PiggyVault", function () {
  let asset: any;
  let mockAdapter: any;
  let vault: any;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;

  async function deployFixture() {
    const signers = await ethers.getSigners();
    const _admin = signers[0];
    const _operator = signers[1];
    const _user = signers[2];
    const _other = signers[3];

    const F1 = await ethers.getContractFactory("MockERC20");
    const _asset = await F1.deploy("USD Coin", "USDC", 6);
    await _asset.waitForDeployment();
    const assetAddr = await _asset.getAddress();

    // Mint tokens to test users
    const mintAmt = ethers.parseUnits("1000000", 6);
    await _asset.mint(_user.address, mintAmt);
    await _asset.mint(_other.address, mintAmt);
    await _asset.mint(_admin.address, mintAmt);

    const F2 = await ethers.getContractFactory("MockAaveAdapter");
    const _mockAdapter = await F2.deploy();
    await _mockAdapter.waitForDeployment();
    await _mockAdapter.setAsset(assetAddr);
    const maAddr = await _mockAdapter.getAddress();

    const VF = await ethers.getContractFactory("PiggyVault");
    const _vault = await upgrades.deployProxy(VF, [
      _admin.address,
      _operator.address,
      assetAddr,
      maAddr,
      5000,
      ethers.parseEther("1.3")
    ], { kind: "uups" });
    await _vault.waitForDeployment();

    return { _asset, _mockAdapter, _vault, _admin, _operator, _user, _other };
  }

  beforeEach(async function () {
    const f = await loadFixture(deployFixture);
    asset = f._asset;
    mockAdapter = f._mockAdapter;
    vault = f._vault;
    admin = f._admin;
    operator = f._operator;
    user = f._user;
    other = f._other;
  });

  describe("Deployment", function () {
    it("should set the correct asset and admin", async function () {
      expect(await vault.asset()).to.equal(await asset.getAddress());
      expect(await vault.hasRole(await vault.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });
    it("should have zero balance initially", async function () {
      const vAddr = await vault.getAddress();
      expect(await asset.balanceOf(vAddr)).to.equal(0);
    });
    it("should revert reinitialization (UUPS)", async function () {
      const VF = await ethers.getContractFactory("PiggyVault");
      const vAddr = await vault.getAddress();
      const aAddr = await asset.getAddress();
      const maAddr = await mockAdapter.getAddress();
      await expect(
        upgrades.upgradeProxy(vAddr, VF, {
          kind: "uups",
          call: { fn: "initialize", args: [admin.address, operator.address, aAddr, maAddr, 5000, ethers.parseEther("1.3")] },
        })
      ).to.be.reverted;
    });
  });

  describe("Deposits", function () {
    it("should allow deposits", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, amount);
      await vault.connect(user).deposit(amount);
      expect(await vault.idleBalance(user.address)).to.equal(amount);
    });
    it("should revert zero deposit", async function () {
      await expect(vault.connect(user).deposit(0)).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  describe("enableYield", function () {
    it("should enable yield with dead shares protection", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, amount);
      await vault.connect(user).deposit(amount);
      await vault.connect(user).enableYield(amount);
      const DS = 1000n;
      expect(await vault.supplyShares(user.address)).to.equal(amount - DS);
      expect(await vault.supplyShares(ethers.ZeroAddress)).to.equal(DS);
    });
    it("should revert if amount <= DEAD_SHARES as first depositor", async function () {
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, 1000);
      await vault.connect(user).deposit(1000);
      await expect(
        vault.connect(user).enableYield(999)
      ).to.be.revertedWithCustomError(vault, "InsufficientFirstDeposit");
    });
    it("should revert zero amount", async function () {
      await expect(
        vault.connect(user).enableYield(0)
      ).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
    it("should revert if insufficient balance", async function () {
      await expect(
        vault.connect(user).enableYield(100)
      ).to.be.revertedWithCustomError(vault, "InsufficientUnallocatedBalance");
    });
  });

  describe("disableAllYield", function () {
    it("should disable yield and clear supply shares", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, amount);
      await vault.connect(user).deposit(amount);
      await vault.connect(user).enableYield(amount);
      // Mock adapter tracks supplied state through actual supplyToAave calls
      await vault.connect(user).disableAllYield();
      expect(await vault.supplyShares(user.address)).to.equal(0);
    });
    it("should revert if not enabled", async function () {
      await expect(
        vault.connect(other).disableAllYield()
      ).to.be.revertedWithCustomError(vault, "NoYieldPosition");
    });
  });

  describe("disableYield", function () {
    it("should disable partial yield", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, amount);
      await vault.connect(user).deposit(amount);
      await vault.connect(user).enableYield(amount);
      await vault.connect(user).disableYield(amount / 2n);
      expect(await vault.supplyShares(user.address)).to.be.gt(0);
      expect(await vault.supplyShares(user.address)).to.be.lt(amount);
    });
    it("should revert if over-withdrawing yield", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, amount);
      await vault.connect(user).deposit(amount);
      await vault.connect(user).enableYield(amount);
      await expect(
        vault.connect(user).disableYield(amount + 1n)
      ).to.be.revertedWithCustomError(vault, "InsufficientShares");
    });
  });

  describe("Borrow and Repay", function () {
    async function fundAndEnable() {
      const amount = ethers.parseUnits("10000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, amount);
      await vault.connect(user).deposit(amount);
      await vault.connect(user).enableYield(amount);
    }
    it("should allow borrow and update idle balance", async function () {
      await fundAndEnable();
      const bAmt = ethers.parseUnits("4000", 6);
      await vault.connect(user).borrow(bAmt);
      expect(await vault.idleBalance(user.address)).to.equal(bAmt);
      expect(await vault.debtShares(user.address)).to.be.gt(0);
    });
    it("should allow repay from external funds", async function () {
      await fundAndEnable();
      const bAmt = ethers.parseUnits("4000", 6);
      await vault.connect(user).borrow(bAmt);
      const rAmt = ethers.parseUnits("2000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(admin).transfer(user.address, rAmt);
      await asset.connect(user).approve(vAddr, rAmt);
      await vault.connect(user)['repay(uint256,bool)'](rAmt, false);
      expect(await vault.debtShares(user.address)).to.be.gt(0);
      expect(await vault.debtValueOf(user.address)).to.be.lt(bAmt);
    });
    it("should revert zero borrow", async function () {
      await expect(
        vault.connect(user).borrow(0)
      ).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  describe("Access Control", function () {
    it("should reject non-admin setAdapter", async function () {
      await expect(
        vault.connect(user).setAdapter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(vault, "AccessControlUnauthorizedAccount");
    });
    it("should reject non-admin setTotalDepositCap", async function () {
      await expect(
        vault.connect(user).setTotalDepositCap(1000)
      ).to.be.revertedWithCustomError(vault, "AccessControlUnauthorizedAccount");
    });
  });

  describe("maxTotalDeposits", function () {
    it("should enforce deposit cap", async function () {
      const cap = ethers.parseUnits("5", 6);
      await vault.connect(admin).setTotalDepositCap(cap);
      expect(await vault.maxTotalDeposits()).to.equal(cap);
      const over = ethers.parseUnits("500", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, over);
      await expect(
        vault.connect(user).deposit(over)
      ).to.be.revertedWithCustomError(vault, "TVLCapReached");
    });
    it("should reject cap below current balance", async function () {
      const bigAmount = ethers.parseUnits("1000", 6);
      const vAddr = await vault.getAddress();
      await asset.connect(user).approve(vAddr, bigAmount);
      await vault.connect(user).deposit(bigAmount);
      await expect(
        vault.connect(admin).setTotalDepositCap(100)
      ).to.be.revertedWithCustomError(vault, "CapExceedsCurrentBalance");
    });
  });
});
