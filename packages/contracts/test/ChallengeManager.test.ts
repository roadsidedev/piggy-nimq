import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PiggyChallengeManager", function () {
  let admin: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let cm: any;

  async function deployFixture() {
    const signers = await ethers.getSigners();
    const _admin = signers[0];
    const _alice = signers[1];
    const _bob = signers[2];
    const _carol = signers[3];

    const CMFactory = await ethers.getContractFactory("PiggyChallengeManager");
    const _cm = await upgrades.deployProxy(CMFactory, [_admin.address], { kind: "uups" });
    await _cm.waitForDeployment();

    return { cm: _cm, admin: _admin, alice: _alice, bob: _bob, carol: _carol };
  }

  beforeEach(async function () {
    const f = await loadFixture(deployFixture);
    cm = f.cm;
    admin = f.admin;
    alice = f.alice;
    bob = f.bob;
    carol = f.carol;
  });

  describe("Challenge Creation", function () {
    it("should create a public challenge and auto-join creator", async function () {
      const tx = await cm.connect(alice).createChallenge("Save for trip", ethers.parseEther("1000"), 30, 1, 10, true);
      await expect(tx).to.emit(cm, "ChallengeCreated").withArgs(1, "Save for trip", alice.address, ethers.parseEther("1000"), 30, 1, true);

      const c = await cm.getChallenge(1);
      expect(c.name).to.equal("Save for trip");
      expect(c.isActive).to.be.true;
      expect(c.owner).to.equal(alice.address);
      expect(c.memberCount).to.equal(1);

      const progress = await cm.getMemberProgress(1, alice.address);
      expect(progress.isMember).to.be.true;
    });

    it("should reject empty name", async function () {
      await expect(cm.connect(alice).createChallenge("", ethers.parseEther("1000"), 30, 1, 10, true))
        .to.be.revertedWithCustomError(cm, "NameTooLong");
    });

    it("should reject zero target", async function () {
      await expect(cm.connect(alice).createChallenge("Test", 0, 30, 1, 10, true))
        .to.be.revertedWithCustomError(cm, "ZeroTarget");
    });

    it("should reject invalid duration", async function () {
      await expect(cm.connect(alice).createChallenge("Test", ethers.parseEther("1000"), 0, 1, 10, true))
        .to.be.revertedWithCustomError(cm, "DurationOutOfBounds");
    });

    it("should reject exceeding max members", async function () {
      await expect(cm.connect(alice).createChallenge("Test", ethers.parseEther("1000"), 30, 1, 1001, true))
        .to.be.revertedWithCustomError(cm, "MaxMembersExceeded");
    });
  });

  describe("Joining and Leaving", function () {
    it("should allow joining a public challenge", async function () {
      await cm.connect(alice).createChallenge("Public", ethers.parseEther("500"), 30, 1, 10, true);
      await cm.connect(bob).joinChallenge(1);
      const p = await cm.getMemberProgress(1, bob.address);
      expect(p.isMember).to.be.true;
    });

    it("should reject joining a non-existent challenge", async function () {
      await expect(cm.connect(bob).joinChallenge(99)).to.be.revertedWithCustomError(cm, "ChallengeExpired");
    });

    it("should reject joining a private challenge", async function () {
      await cm.connect(alice).createChallenge("Private", ethers.parseEther("500"), 30, 1, 10, false);
      await expect(cm.connect(bob).joinChallenge(1)).to.be.revertedWithCustomError(cm, "ChallengeNotPublic");
    });

    it("should allow owner to add members to any challenge", async function () {
      await cm.connect(alice).createChallenge("Private", ethers.parseEther("500"), 30, 1, 10, false);
      await cm.connect(alice).addMember(1, bob.address);
      const p = await cm.getMemberProgress(1, bob.address);
      expect(p.isMember).to.be.true;
    });

    it("should allow members to leave", async function () {
      await cm.connect(alice).createChallenge("Public", ethers.parseEther("500"), 30, 1, 10, true);
      await cm.connect(bob).joinChallenge(1);
      await cm.connect(bob).leaveChallenge(1);
      const p = await cm.getMemberProgress(1, bob.address);
      expect(p.isMember).to.be.false;
    });

    it("should prevent owner from leaving (must end challenge instead)", async function () {
      await cm.connect(alice).createChallenge("Public", ethers.parseEther("500"), 30, 1, 10, true);
      await expect(cm.connect(alice).leaveChallenge(1)).to.be.revertedWithCustomError(cm, "NotChallengeOwner");
    });

    it("should reject joining a full challenge", async function () {
      await cm.connect(alice).createChallenge("Full", ethers.parseEther("500"), 30, 1, 2, true);
      // alice auto-joined, adding one more fills it
      await cm.connect(bob).joinChallenge(1);
      await expect(cm.connect(carol).joinChallenge(1)).to.be.revertedWithCustomError(cm, "ChallengeFull");
    });
  });

  describe("Progress Tracking & Streaks", function () {
    it("should record progress and update streak", async function () {
      await cm.connect(alice).createChallenge("Save", ethers.parseEther("1000"), 30, 0, 10, true); // DAILY frequency

      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("100"));
      let p = await cm.getMemberProgress(1, alice.address);
      expect(p.totalSaved).to.equal(ethers.parseEther("100"));
      expect(p.currentStreak).to.equal(1);

      await time.increase(86400);
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("50"));
      p = await cm.getMemberProgress(1, alice.address);
      expect(p.totalSaved).to.equal(ethers.parseEther("150"));
      expect(p.currentStreak).to.equal(2);
    });

    it("should reset streak if gap exceeds grace period", async function () {
      await cm.connect(alice).createChallenge("Save", ethers.parseEther("1000"), 30, 1, 10, true); // WEEKLY
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("100"));
      let p = await cm.getMemberProgress(1, alice.address);
      expect(p.currentStreak).to.equal(1);

      // Advance past weekly window + 50% grace (7 + 3.5 = 10.5 days max)
      await time.increase(86400 * 12);
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("50"));
      p = await cm.getMemberProgress(1, alice.address);
      expect(p.currentStreak).to.equal(1); // Reset
      expect(p.longestStreak).to.equal(1); // Still 1
    });

    it("should update longest streak", async function () {
      await cm.connect(alice).createChallenge("Save", ethers.parseEther("1000"), 30, 0, 10, true);
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("10"));
      await time.increase(86400);
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("10"));
      await time.increase(86400);
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("10"));

      let p = await cm.getMemberProgress(1, alice.address);
      expect(p.currentStreak).to.equal(3);
      expect(p.longestStreak).to.equal(3);

      // Reset streak
      await time.increase(86400 * 4);
      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("10"));
      p = await cm.getMemberProgress(1, alice.address);
      expect(p.currentStreak).to.equal(1);
      expect(p.longestStreak).to.equal(3); // Still 3
    });
  });

  describe("Leaderboard", function () {
    it("should return members in insertion order (unsorted)", async function () {
      await cm.connect(alice).createChallenge("Compete", ethers.parseEther("1000"), 30, 1, 10, true);
      await cm.connect(bob).joinChallenge(1);
      await cm.connect(carol).joinChallenge(1);

      await cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("50"));
      await cm.connect(bob).recordProgress(bob.address, 1, ethers.parseEther("100"));
      await cm.connect(carol).recordProgress(carol.address, 1, ethers.parseEther("75"));

      const [members, progress] = await cm.getLeaderboard(1);
      expect(members.length).to.equal(3);
      // Insertion order: alice (creator) → bob → carol
      expect(members[0]).to.equal(alice.address);
      expect(members[1]).to.equal(bob.address);
      expect(members[2]).to.equal(carol.address);
      // Raw fields available for off-chain composite scoring
      expect(progress[0].totalSaved).to.equal(ethers.parseEther("50"));
      expect(progress[1].totalSaved).to.equal(ethers.parseEther("100"));
      expect(progress[2].totalSaved).to.equal(ethers.parseEther("75"));
    });
  });

  describe("Vault Integration", function () {
    it("should accept progress from registered vault", async function () {
      await cm.connect(alice).createChallenge("VaultTest", ethers.parseEther("500"), 30, 0, 10, true);
      await cm.connect(admin).setVault(bob.address, true);

      await cm.connect(bob).recordProgress(alice.address, 1, ethers.parseEther("200"));
      const p = await cm.getMemberProgress(1, alice.address);
      expect(p.totalSaved).to.equal(ethers.parseEther("200"));
    });

    it("should reject progress from unregistered address", async function () {
      await cm.connect(alice).createChallenge("VaultTest", ethers.parseEther("500"), 30, 0, 10, true);
      await expect(
        cm.connect(bob).recordProgress(alice.address, 1, ethers.parseEther("200"))
      ).to.be.reverted;
    });
  });

  describe("Challenge Lifecycle", function () {
    it("should end a challenge", async function () {
      await cm.connect(alice).createChallenge("Temp", ethers.parseEther("500"), 30, 1, 10, true);
      await cm.connect(alice).endChallenge(1);
      const c = await cm.getChallenge(1);
      expect(c.isActive).to.be.false;
    });

    it("should prevent progress on ended challenge", async function () {
      await cm.connect(alice).createChallenge("Temp", ethers.parseEther("500"), 30, 1, 10, true);
      await cm.connect(alice).endChallenge(1);
      await expect(
        cm.connect(alice).recordProgress(alice.address, 1, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(cm, "ChallengeAlreadyEnded");
    });

    it("should prevent joining ended challenge", async function () {
      await cm.connect(alice).createChallenge("Temp", ethers.parseEther("500"), 30, 1, 10, true);
      await cm.connect(alice).endChallenge(1);
      await expect(
        cm.connect(bob).joinChallenge(1)
      ).to.be.revertedWithCustomError(cm, "ChallengeAlreadyEnded");
    });
  });

  describe("Admin", function () {
    it("should register and unregister vaults", async function () {
      await cm.connect(admin).setVault(alice.address, true);
      expect(await cm.isVault(alice.address)).to.be.true;
      await cm.connect(admin).setVault(alice.address, false);
      expect(await cm.isVault(alice.address)).to.be.false;
    });
  });

  describe("Views", function () {
    it("should return user challenges", async function () {
      await cm.connect(alice).createChallenge("A", ethers.parseEther("500"), 30, 1, 10, true);
      await cm.connect(alice).createChallenge("B", ethers.parseEther("500"), 30, 1, 10, true);

      const challenges = await cm.getUserChallenges(alice.address);
      expect(challenges.length).to.equal(2);
    });

    it("should return challenge count", async function () {
      expect(await cm.challengeCount()).to.equal(0);
      await cm.connect(alice).createChallenge("A", ethers.parseEther("500"), 30, 1, 10, true);
      expect(await cm.challengeCount()).to.equal(1);
    });
  });
});
