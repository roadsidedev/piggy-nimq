const fs = require('fs');

const content = `import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PiggyVault", function () {
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let user: SignerWithAddress;
  let borrower: SignerWithAddress;
  let other: SignerWithAddress;

  let asset: any;
  let mockAdapter: any;
  let vault: any;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  async function deployFixture() {
    const signers = await ethers.getSigners();
    const _admin = signers[0];
    const _operator = signers[1];
    const _user = signers[2];
    const _borrower = signers[3];
    const _other = signers[4];

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const _asset = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await _asset.waitForDeployment();

    const MockAaveAdapterFactory = await ethers.getContractFactory("MockAaveAdapter");
    const _mockAdapter = await MockAaveAdapterFactory.deploy(await _asset.getAddress());
    await _mockAdapter.waitForDeployment();

    const PiggyVaultFactory = await ethers.getContractFactory("PiggyVault");
    const _vault = await upgrades.deployProxy(
      PiggyVaultFactory,
      [await _asset.getAddress(), _admin.address],
      { kind: "uups", initializer: "initialize" }
    );
    await _vault.waitForDeployment();

    await _vault.connect(_admin).grantRole(await _vault.OPERATOR_ROLE(), _operator.address);
    await _vault.connect(_admin).setYieldAdapter(await _mockAdapter.getAddress());

    return { _asset, _mockAdapter, _vault, _admin, _operator, _user, _borrower, _other };
  }

  describe("Deployment", function () {
    it("should set the correct asset and admin", async function () {
      const { _asset, _vault, _admin } = await loadFixture(deployFixture);
      expect(await _vault.asset()).to.equal(await _asset.getAddress());
      expect(await _vault.hasRole(await _vault.DEFAULT_ADMIN_ROLE(), _admin.address)).to.be.true;
    });

    it("should have zero initial balance", async function () {
      const { _vault } = await loadFixture(deployFixture);
      expect(await _vault.totalAssets()).to.equal(0);
    });

    it("should revert when initializing twice (UUPS)", async function () {
      const { _vault, _asset, _admin } = await loadFixture(deployFixture);
      const PiggyVaultFactory = await ethers.getContractFactory("PiggyVault");
      await expect(
        upgrades.upgradeProxy(await _vault.getAddress(), PiggyVaultFactory, {
          kind: "uups",
          call: { fn: "initialize", args: [await _asset.getAddress(), _admin.address] },
        })
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("Deposits", function () {
    it("should allow deposits", async function () {
      const { _asset, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await expect(() =>
        _vault.connect(_user).deposit(amount, _user.address)
      ).to.changeTokenBalance(_asset, _vault, amount);
    });

    it("should mint correct internal shares", async function () {
      const { _asset, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("500", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);
      expect(await _vault.internalShares(_user.address)).to.equal(amount);
    });

    it("should revert deposit with zero amount", async function () {
      const { _asset, _vault, _user } = await loadFixture(deployFixture);
      await _asset.connect(_user).approve(await _vault.getAddress(), 0);
      await expect(
        _vault.connect(_user).deposit(0, _user.address)
      ).to.be.revertedWithCustomError(_vault, "ZeroAmount");
    });
  });

  describe("enableYield", function () {
    it("should allow user to enable yield", async function () {
      const { _asset, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);

      const DEAD_SHARES = 1000n;
      await _vault.connect(_user).enableYield(amount);
      expect(await _vault.supplyShares(_user.address)).to.equal(amount - DEAD_SHARES);
      expect(await _vault.supplyShares(ethers.ZeroAddress)).to.equal(DEAD_SHARES);
      expect(await _vault.yieldEnabled(_user.address)).to.be.true;
    });

    it("should revert enableYield when not deposited", async function () {
      const { _vault, _other } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_other).enableYield(100)
      ).to.be.revertedWithCustomError(_vault, "InsufficientBalance");
    });

    it("should revert enableYield with zero amount", async function () {
      const { _vault, _other } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_other).enableYield(0)
      ).to.be.revertedWithCustomError(_vault, "ZeroAmount");
    });

    it("should revert when enabling yield twice", async function () {
      const { _asset, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);
      await _vault.connect(_user).enableYield(amount);
      await expect(
        _vault.connect(_user).enableYield(100)
      ).to.be.revertedWithCustomError(_vault, "YieldAlreadyEnabled");
    });
  });

  describe("disableAllYield", function () {
    it("should disable yield and return funds", async function () {
      const { _asset, _mockAdapter, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);
      await _vault.connect(_user).enableYield(amount);

      await _mockAdapter.setSuppliedValue(amount);

      const tx = await _vault.connect(_user).disableAllYield();

      expect(await _vault.yieldEnabled(_user.address)).to.be.false;
      expect(await _vault.supplyShares(_user.address)).to.equal(0);

      const internalShares = await _vault.internalShares(_user.address);
      expect(internalShares).to.be.gt(0);
    });

    it("should revert when yield not enabled", async function () {
      const { _vault, _other } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_other).disableAllYield()
      ).to.be.revertedWithCustomError(_vault, "NoYieldPosition");
    });
  });

  describe("disableYield", function () {
    it("should disable partial yield", async function () {
      const { _asset, _mockAdapter, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);
      await _vault.connect(_user).enableYield(amount);

      await _mockAdapter.setSuppliedValue(amount);

      const halfAmount = amount / 2n;
      await _vault.connect(_user).disableYield(halfAmount);

      expect(await _vault.yieldEnabled(_user.address)).to.be.true;
    });

    it("should revert when disabling more than enabled", async function () {
      const { _asset, _mockAdapter, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);
      await _vault.connect(_user).enableYield(amount);

      await _mockAdapter.setSuppliedValue(amount);

      await expect(
        _vault.connect(_user).disableYield(amount + 1n)
      ).to.be.revertedWithCustomError(_vault, "InsufficientShares");
    });
  });

  describe("Borrow and Repay", function () {
    async function borrowFixture() {
      const base = await deployFixture();
      const { _asset, _vault, _user } = base;
      const amount = ethers.parseUnits("10000", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await _vault.connect(_user).deposit(amount, _user.address);
      await _vault.connect(_user).enableYield(amount);
      return base;
    }

    it("should allow borrow", async function () {
      const { _asset, _vault, _user, _borrower } = await loadFixture(borrowFixture);
      const borrowAmount = ethers.parseUnits("5000", 6);
      await expect(() =>
        _vault.connect(_borrower).borrow(borrowAmount, _borrower.address)
      ).to.changeTokenBalance(_asset, _borrower, borrowAmount);
    });

    it("should track debt correctly", async function () {
      const { _vault, _user, _borrower } = await loadFixture(borrowFixture);
      const borrowAmount = ethers.parseUnits("5000", 6);
      await _vault.connect(_borrower).borrow(borrowAmount, _borrower.address);
      expect(await _vault.debtShares(_borrower.address)).to.equal(borrowAmount);
      expect(await _vault.totalDebt()).to.equal(borrowAmount);
    });

    it("should allow repay", async function () {
      const { _asset, _vault, _user, _borrower } = await loadFixture(borrowFixture);
      const borrowAmount = ethers.parseUnits("5000", 6);
      await _vault.connect(_borrower).borrow(borrowAmount, _borrower.address);

      const repayAmount = ethers.parseUnits("2000", 6);
      await _asset.connect(_borrower).approve(await _vault.getAddress(), repayAmount);
      await _vault.connect(_borrower).repay(repayAmount, _borrower.address);
    });

    it("should revert borrow with zero amount", async function () {
      const { _vault, _borrower } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_borrower).borrow(0, _borrower.address)
      ).to.be.revertedWithCustomError(_vault, "ZeroAmount");
    });
  });

  describe("Access Control", function () {
    it("should not allow non-admin to set adapter", async function () {
      const { _vault, _user } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_user).setYieldAdapter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(
        _vault,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("should not allow non-admin to set total deposit cap", async function () {
      const { _vault, _user } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_user).setTotalDepositCap(1000)
      ).to.be.revertedWithCustomError(
        _vault,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("should not allow non-operator to trigger yield rebalance", async function () {
      const { _vault, _user } = await loadFixture(deployFixture);
      await expect(
        _vault.connect(_user).rebalanceYield(100)
      ).to.be.revertedWithCustomError(
        _vault,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("should revert deposit to zero address", async function () {
      const { _asset, _vault, _user } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("100", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), amount);
      await expect(
        _vault.connect(_user).deposit(amount, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(_vault, "ZeroAddress");
    });
  });

  describe("maxTotalDeposits", function () {
    it("should enforce max total deposits", async function () {
      const { _asset, _vault, _admin, _user } = await loadFixture(deployFixture);
      const cap = ethers.parseUnits("500", 6);
      await _vault.connect(_admin).setTotalDepositCap(cap);

      const depositAmount = ethers.parseUnits("600", 6);
      await _asset.connect(_user).approve(await _vault.getAddress(), depositAmount);
      await expect(
        _vault.connect(_user).deposit(depositAmount, _user.address)
      ).to.be.revertedWithCustomError(_vault, "CapExceedsCurrentBalance");
    });
  });
`;

fs.writeFileSync('test/PiggyVault.test.ts', content);
console.log('OK ' + fs.statSync('test/PiggyVault.test.ts').size + ' bytes');
