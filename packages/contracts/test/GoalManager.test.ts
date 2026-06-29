import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PiggyGoalManager", function () {
  let admin: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;
  let gm: any;

  async function deployFixture() {
    const signers = await ethers.getSigners();
    const _admin = signers[0];
    const _user = signers[1];
    const _other = signers[2];

    const GMFactory = await ethers.getContractFactory("PiggyGoalManager");
    const _gm = await upgrades.deployProxy(GMFactory, [_admin.address], { kind: "uups" });
    await _gm.waitForDeployment();

    return { gm: _gm, admin: _admin, user: _user, other: _other };
  }

  beforeEach(async function () {
    const f = await loadFixture(deployFixture);
    gm = f.gm;
    admin = f.admin;
    user = f.user;
    other = f.other;
  });

  describe("Goal Creation", function () {
    it("should create a goal", async function () {
      const targetDate = Math.floor(Date.now() / 1000) + 86400 * 30;
      const tx = await gm.connect(user).createGoal(user.address, ethers.parseEther("1000"), targetDate, "Vacation");
      await expect(tx).to.emit(gm, "GoalCreated").withArgs(user.address, 0, ethers.parseEther("1000"), targetDate, "Vacation");

      const g = await gm.getGoal(user.address, 0);
      expect(g.targetAmount).to.equal(ethers.parseEther("1000"));
      expect(g.active).to.be.true;
    });

    it("should reject zero target", async function () {
      await expect(gm.connect(user).createGoal(user.address, 0, 0, "bad"))
        .to.be.revertedWithCustomError(gm, "ZeroTarget");
    });

    it("should track next goal ID per user", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("100"), 0, "A");
      await gm.connect(user).createGoal(user.address, ethers.parseEther("200"), 0, "B");
      expect(await gm.nextGoalId(user.address)).to.equal(2);
      expect(await gm.nextGoalId(other.address)).to.equal(0);
    });
  });

  describe("Allocation", function () {
    it("should allocate and track total", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("1000"), 0, "Save");
      await gm.connect(user).allocateToGoal(user.address, 0, ethers.parseEther("100"));
      const g = await gm.getGoal(user.address, 0);
      expect(g.allocated).to.equal(ethers.parseEther("100"));
      expect(await gm.totalAllocated(user.address)).to.equal(ethers.parseEther("100"));
    });

    it("should deallocate", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("1000"), 0, "Save");
      await gm.connect(user).allocateToGoal(user.address, 0, ethers.parseEther("100"));
      await gm.connect(user).deallocateFromGoal(user.address, 0, ethers.parseEther("40"));
      expect(await gm.totalAllocated(user.address)).to.equal(ethers.parseEther("60"));
    });

    it("should reject allocating to inactive goal", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("1000"), 0, "Save");
      await gm.connect(user).allocateToGoal(user.address, 0, ethers.parseEther("100"));
      await gm.connect(user).deallocateFromGoal(user.address, 0, ethers.parseEther("100"));
      await gm.connect(user).closeGoal(user.address, 0);
      await expect(gm.connect(user).allocateToGoal(user.address, 0, 1))
        .to.be.revertedWithCustomError(gm, "GoalNotActive");
    });
  });

  describe("Closing", function () {
    it("should close a deallocated goal", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("1000"), 0, "Save");
      await gm.connect(user).allocateToGoal(user.address, 0, ethers.parseEther("100"));
      await gm.connect(user).deallocateFromGoal(user.address, 0, ethers.parseEther("100"));
      await gm.connect(user).closeGoal(user.address, 0);
      const g = await gm.getGoal(user.address, 0);
      expect(g.active).to.be.false;
    });

    it("should reject closing a goal with allocation", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("1000"), 0, "Save");
      await gm.connect(user).allocateToGoal(user.address, 0, ethers.parseEther("50"));
      await expect(gm.connect(user).closeGoal(user.address, 0))
        .to.be.revertedWithCustomError(gm, "GoalHasAllocation");
    });
  });

  describe("Vault Authorization", function () {
    it("should allow vault to act on behalf of users", async function () {
      const vaultAddr = other.address; // treat as vault
      await gm.connect(admin).setVault(vaultAddr, true);
      await gm.connect(user).createGoal(user.address, ethers.parseEther("500"), 0, "Goal");
      // vault allocates on behalf of user
      await gm.connect(other).allocateToGoal(user.address, 0, ethers.parseEther("50"));
      expect(await gm.totalAllocated(user.address)).to.equal(ethers.parseEther("50"));
    });

    it("should reject non-vault acting for others", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("500"), 0, "Goal");
      await expect(gm.connect(other).allocateToGoal(user.address, 0, ethers.parseEther("50")))
        .to.be.reverted;
    });

    it("should allow users to act on themselves regardless of vault role", async function () {
      await gm.connect(user).createGoal(user.address, ethers.parseEther("500"), 0, "Goal");
      await gm.connect(user).allocateToGoal(user.address, 0, ethers.parseEther("50"));
      expect(await gm.totalAllocated(user.address)).to.equal(ethers.parseEther("50"));
    });
  });
});
