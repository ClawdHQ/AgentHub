import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentAccount, CloneFactory, GuardianPolicy, MockEntryPoint, MockDeFiProtocol } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentAccount", function () {
  let agentClone: AgentAccount;
  let cloneFactory: CloneFactory;
  let guardian: GuardianPolicy;
  let entryPoint: MockEntryPoint;
  let mockProtocol: MockDeFiProtocol;
  let deployer: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let aiSigner: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const stakeSelector = ethers.id("stake(uint256)").slice(0, 10);

  beforeEach(async function () {
    [deployer, owner, aiSigner, unauthorized] = await ethers.getSigners();

    const EntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();

    const GuardianFactory = await ethers.getContractFactory("GuardianPolicy");
    guardian = await GuardianFactory.deploy();
    await guardian.waitForDeployment();

    const MockDeFiFactory = await ethers.getContractFactory("MockDeFiProtocol");
    mockProtocol = await MockDeFiFactory.deploy();
    await mockProtocol.waitForDeployment();

    // Deploy implementation (constructor calls _disableInitializers, so we can't use it directly)
    const AgentAccountFactory = await ethers.getContractFactory("AgentAccount");
    const implementation = await AgentAccountFactory.deploy(await entryPoint.getAddress());
    await implementation.waitForDeployment();

    // Deploy CloneFactory helper to create a minimal proxy clone
    const CloneFactoryContract = await ethers.getContractFactory("CloneFactory");
    cloneFactory = await CloneFactoryContract.deploy();
    await cloneFactory.waitForDeployment();

    // Create a clone and get its address from the emitted event
    const cloneTx = await cloneFactory.clone(await implementation.getAddress());
    const receipt = await cloneTx.wait();
    const cloneEvent = receipt?.logs
      .map((log) => {
        try { return cloneFactory.interface.parseLog(log); } catch { return null; }
      })
      .find((e) => e?.name === "CloneCreated");
    const cloneAddress = cloneEvent!.args.clone;

    agentClone = AgentAccountFactory.attach(cloneAddress) as AgentAccount;

    const AGENT_OWNER_ROLE = await guardian.AGENT_OWNER_ROLE();
    await guardian.grantRole(AGENT_OWNER_ROLE, deployer.address);

    const policy = {
      tier: 0,
      maxSingleTxValue: ethers.parseEther("1"),
      maxDailyVolume: ethers.parseEther("5"),
      allowedProtocols: [await mockProtocol.getAddress()],
      allowedSelectors: [stakeSelector, "0x2e1a7d4d"],
      xcmEnabled: false,
      createdAt: 0n,
      updatedAt: 0n,
    };

    await agentClone.initialize(
      owner.address,
      aiSigner.address,
      await guardian.getAddress(),
      "Test strategy"
    );

    await guardian.setPolicy(await agentClone.getAddress(), policy);
  });

  describe("Initialization", function () {
    it("sets owner, aiSigner, guardian, strategy correctly", async function () {
      expect(await agentClone.owner()).to.equal(owner.address);
      expect(await agentClone.aiSigner()).to.equal(aiSigner.address);
      expect(await agentClone.strategyDescription()).to.equal("Test strategy");
      expect(await agentClone.active()).to.be.true;
    });

    it("reverts on second initialize call", async function () {
      await expect(
        agentClone.initialize(owner.address, aiSigner.address, await guardian.getAddress(), "")
      ).to.be.reverted;
    });
  });

  describe("updateAISigner", function () {
    it("owner can update aiSigner", async function () {
      await expect(agentClone.connect(owner).updateAISigner(unauthorized.address))
        .to.emit(agentClone, "SignerUpdated")
        .withArgs(aiSigner.address, unauthorized.address);
      expect(await agentClone.aiSigner()).to.equal(unauthorized.address);
    });

    it("non-owner cannot update aiSigner", async function () {
      await expect(
        agentClone.connect(unauthorized).updateAISigner(unauthorized.address)
      ).to.be.revertedWith("AgentAccount: caller is not owner");
    });
  });

  describe("deactivate", function () {
    it("owner can deactivate agent", async function () {
      await agentClone.connect(owner).deactivate();
      expect(await agentClone.active()).to.be.false;
    });

    it("non-owner cannot deactivate", async function () {
      await expect(agentClone.connect(unauthorized).deactivate()).to.be.revertedWith(
        "AgentAccount: caller is not owner or factory"
      );
    });
  });

  describe("execute", function () {
    it("only EntryPoint can call execute", async function () {
      const callData = stakeSelector + "00".repeat(32);
      await expect(
        agentClone.connect(owner).execute(await mockProtocol.getAddress(), 0n, callData)
      ).to.be.revertedWith("AgentAccount: caller is not EntryPoint");
    });
  });

  describe("addDeposit", function () {
    it("deposits to entryPoint", async function () {
      const depositAmount = ethers.parseEther("1");
      await agentClone.connect(owner).addDeposit({ value: depositAmount });
      const balance = await entryPoint.balanceOf(await agentClone.getAddress());
      expect(balance).to.equal(depositAmount);
    });
  });
});

