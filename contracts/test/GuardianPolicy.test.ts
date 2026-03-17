import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { GuardianPolicy, MockDeFiProtocol } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GuardianPolicy", function () {
  let guardian: GuardianPolicy;
  let mockProtocol: MockDeFiProtocol;
  let deployer: HardhatEthersSigner;
  let agentOwner: HardhatEthersSigner;
  let watcher: HardhatEthersSigner;
  let guardianRole: HardhatEthersSigner;
  let protocolAdmin: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;
  let agent: HardhatEthersSigner;

  const stakeSelector = ethers.id("stake(uint256)").slice(0, 10);
  const withdrawSelector = ethers.id("withdraw(uint256)").slice(0, 10);
  const swapSelector = ethers.id("swap(uint256)").slice(0, 10);

  function buildPolicy(overrides: Partial<{
    tier: number;
    maxSingleTxValue: bigint;
    maxDailyVolume: bigint;
    allowedProtocols: string[];
    allowedSelectors: string[];
    xcmEnabled: boolean;
    createdAt: bigint;
    updatedAt: bigint;
  }> = {}) {
    return {
      tier: 0,
      maxSingleTxValue: ethers.parseEther("1"),
      maxDailyVolume: ethers.parseEther("5"),
      allowedProtocols: overrides.allowedProtocols ?? [mockProtocol.target as string],
      allowedSelectors: overrides.allowedSelectors ?? [stakeSelector, withdrawSelector],
      xcmEnabled: false,
      createdAt: 0n,
      updatedAt: 0n,
      ...overrides,
    };
  }

  beforeEach(async function () {
    [deployer, agentOwner, watcher, guardianRole, protocolAdmin, unauthorized, agent] =
      await ethers.getSigners();

    const GuardianPolicyFactory = await ethers.getContractFactory("GuardianPolicy");
    guardian = await GuardianPolicyFactory.deploy();
    await guardian.waitForDeployment();

    const MockDeFiFactory = await ethers.getContractFactory("MockDeFiProtocol");
    mockProtocol = await MockDeFiFactory.deploy();
    await mockProtocol.waitForDeployment();

    const AGENT_OWNER_ROLE = await guardian.AGENT_OWNER_ROLE();
    const WATCHER_ROLE = await guardian.WATCHER_ROLE();
    const GUARDIAN_ROLE = await guardian.GUARDIAN_ROLE();
    const PROTOCOL_ADMIN_ROLE = await guardian.PROTOCOL_ADMIN_ROLE();

    await guardian.grantRole(AGENT_OWNER_ROLE, agentOwner.address);
    await guardian.grantRole(WATCHER_ROLE, watcher.address);
    await guardian.grantRole(GUARDIAN_ROLE, guardianRole.address);
    await guardian.grantRole(PROTOCOL_ADMIN_ROLE, protocolAdmin.address);
  });

  describe("Deployment", function () {
    it("deploys with DEFAULT_ADMIN_ROLE assigned to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await guardian.DEFAULT_ADMIN_ROLE();
      expect(await guardian.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
    });

    it("has MAX_VIOLATIONS_BEFORE_FREEZE = 3", async function () {
      expect(await guardian.MAX_VIOLATIONS_BEFORE_FREEZE()).to.equal(3);
    });
  });

  describe("Policy Management", function () {
    it("allows AGENT_OWNER_ROLE to set CONSERVATIVE policy", async function () {
      const policy = buildPolicy();
      await expect(guardian.connect(agentOwner).setPolicy(agent.address, policy)).to.not.be
        .reverted;

      const stored = await guardian.getPolicy(agent.address);
      expect(stored.tier).to.equal(0);
    });

    it("reverts CONSERVATIVE policy with xcmEnabled=true", async function () {
      const policy = buildPolicy({ xcmEnabled: true });
      await expect(guardian.connect(agentOwner).setPolicy(agent.address, policy)).to.be.revertedWith(
        "Guardian: CONSERVATIVE tier cannot enable XCM"
      );
    });

    it("reverts CONSERVATIVE policy with maxSingleTxValue > 1 ether", async function () {
      const policy = buildPolicy({ maxSingleTxValue: ethers.parseEther("2") });
      await expect(guardian.connect(agentOwner).setPolicy(agent.address, policy)).to.be.revertedWith(
        "Guardian: CONSERVATIVE maxSingleTxValue must be <= 1 ether"
      );
    });

    it("reverts if allowedProtocols is empty", async function () {
      const policy = buildPolicy({ allowedProtocols: [] });
      await expect(guardian.connect(agentOwner).setPolicy(agent.address, policy)).to.be.revertedWith(
        "Guardian: must allow at least one protocol"
      );
    });

    it("emits PolicyCreated on first set, PolicyUpdated on subsequent", async function () {
      const policy = buildPolicy();
      await expect(guardian.connect(agentOwner).setPolicy(agent.address, policy))
        .to.emit(guardian, "PolicyCreated")
        .withArgs(agent.address, 0);

      await expect(guardian.connect(agentOwner).setPolicy(agent.address, policy))
        .to.emit(guardian, "PolicyUpdated")
        .withArgs(agent.address, 0);
    });
  });

  describe("validateOperation", function () {
    beforeEach(async function () {
      const policy = buildPolicy();
      await guardian.connect(agentOwner).setPolicy(agent.address, policy);
    });

    it("returns (true,'') for valid op within all policy bounds", async function () {
      const callData = stakeSelector + ethers.AbiCoder.defaultAbiCoder()
        .encode(["uint256"], [ethers.parseEther("0.5")]).slice(2);

      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address,
        mockProtocol.target,
        callData,
        ethers.parseEther("0.5")
      );
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("returns (false,reason) if target not in allowedProtocols", async function () {
      const callData = stakeSelector + "00".repeat(32);
      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address,
        unauthorized.address,
        callData,
        0n
      );
      expect(valid).to.be.false;
      expect(reason).to.include("not whitelisted");
    });

    it("returns (false,reason) if selector not whitelisted", async function () {
      const unknownSelector = ethers.id("unknownFunction(uint256)").slice(0, 10);
      const callData = unknownSelector + "00".repeat(32);
      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address,
        mockProtocol.target,
        callData,
        0n
      );
      expect(valid).to.be.false;
      expect(reason).to.include("selector not whitelisted");
    });

    it("returns (false,reason) if value exceeds maxSingleTxValue", async function () {
      const callData = stakeSelector + "00".repeat(32);
      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address,
        mockProtocol.target,
        callData,
        ethers.parseEther("2")
      );
      expect(valid).to.be.false;
      expect(reason).to.include("maxSingleTxValue");
    });

    it("returns (false,reason) if daily volume exceeded", async function () {
      const callData = stakeSelector + "00".repeat(32);

      await guardian.connect(agentOwner).setPolicy(agent.address, buildPolicy({
        maxDailyVolume: ethers.parseEther("5"),
        maxSingleTxValue: ethers.parseEther("5"),
        tier: 1
      }));

      await guardian.validateOperation(
        agent.address,
        mockProtocol.target,
        callData,
        ethers.parseEther("4.5")
      );

      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address,
        mockProtocol.target,
        callData,
        ethers.parseEther("1")
      );
      expect(valid).to.be.false;
      expect(reason).to.include("daily volume");
    });

    it("resets daily volume after 1 day (time.increase(86401))", async function () {
      await guardian.connect(agentOwner).setPolicy(agent.address, buildPolicy({
        maxDailyVolume: ethers.parseEther("5"),
        maxSingleTxValue: ethers.parseEther("5"),
        tier: 1
      }));

      const callData = stakeSelector + "00".repeat(32);

      await guardian.validateOperation(agent.address, mockProtocol.target, callData, ethers.parseEther("5"));

      const [valid1] = await guardian.validateOperation.staticCall(
        agent.address, mockProtocol.target, callData, ethers.parseEther("1")
      );
      expect(valid1).to.be.false;

      await time.increase(86401);

      const [valid2] = await guardian.validateOperation.staticCall(
        agent.address, mockProtocol.target, callData, ethers.parseEther("1")
      );
      expect(valid2).to.be.true;
    });

    it("increments violationCount on each failure", async function () {
      const callData = stakeSelector + "00".repeat(32);
      const badTarget = unauthorized.address;

      await guardian.validateOperation(agent.address, badTarget, callData, 0n);
      expect(await guardian.getViolationCount(agent.address)).to.equal(1);

      await guardian.validateOperation(agent.address, badTarget, callData, 0n);
      expect(await guardian.getViolationCount(agent.address)).to.equal(2);
    });

    it("auto-triggers softPause after 3 violations", async function () {
      const callData = stakeSelector + "00".repeat(32);
      const badTarget = unauthorized.address;

      expect(await guardian.softPaused()).to.be.false;

      await guardian.validateOperation(agent.address, badTarget, callData, 0n);
      await guardian.validateOperation(agent.address, badTarget, callData, 0n);
      await guardian.validateOperation(agent.address, badTarget, callData, 0n);

      expect(await guardian.softPaused()).to.be.true;
    });
  });

  describe("Two-Tier Pause", function () {
    beforeEach(async function () {
      const policy = buildPolicy();
      await guardian.connect(agentOwner).setPolicy(agent.address, policy);
    });

    it("WATCHER_ROLE can softPause, blocks non-withdrawal selectors", async function () {
      await guardian.connect(watcher).softPause();
      expect(await guardian.softPaused()).to.be.true;

      const callData = stakeSelector + "00".repeat(32);
      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address, mockProtocol.target, callData, 0n
      );
      expect(valid).to.be.false;
      expect(reason).to.include("soft-paused");
    });

    it("softPause allows withdrawal selector 0x2e1a7d4d (withdraw(uint256))", async function () {
      await guardian.connect(watcher).softPause();

      const withdrawData = "0x2e1a7d4d" + ethers.AbiCoder.defaultAbiCoder()
        .encode(["uint256"], [100n]).slice(2);

      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address, mockProtocol.target, withdrawData, 0n
      );
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("WATCHER_ROLE can hardPause, blocks ALL operations", async function () {
      await guardian.connect(watcher).hardPause();
      expect(await guardian.paused()).to.be.true;

      const callData = stakeSelector + "00".repeat(32);
      const [valid, reason] = await guardian.validateOperation.staticCall(
        agent.address, mockProtocol.target, callData, 0n
      );
      expect(valid).to.be.false;
      expect(reason).to.include("hard-paused");
    });

    it("GUARDIAN_ROLE forceUnpause clears both pause states", async function () {
      await guardian.connect(watcher).softPause();
      await guardian.connect(watcher).hardPause();

      expect(await guardian.softPaused()).to.be.true;
      expect(await guardian.paused()).to.be.true;

      await guardian.connect(guardianRole).forceUnpause();

      expect(await guardian.softPaused()).to.be.false;
      expect(await guardian.paused()).to.be.false;
    });

    it("non-GUARDIAN cannot forceUnpause", async function () {
      await guardian.connect(watcher).softPause();

      await expect(guardian.connect(unauthorized).forceUnpause()).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("reverts addGlobalProtocol for non-PROTOCOL_ADMIN", async function () {
      await expect(
        guardian.connect(unauthorized).addGlobalProtocol(mockProtocol.target as string)
      ).to.be.reverted;
    });

    it("reverts setPolicy for unauthorized caller", async function () {
      const policy = buildPolicy();
      await expect(
        guardian.connect(unauthorized).setPolicy(agent.address, policy)
      ).to.be.revertedWith("Guardian: caller lacks AGENT_OWNER_ROLE or DEFAULT_ADMIN_ROLE");
    });
  });
});
