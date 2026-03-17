import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentAccount, AgentFactory, AgentRegistry, GuardianPolicy, MockEntryPoint } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentFactory", function () {
  let factory: AgentFactory;
  let registry: AgentRegistry;
  let guardian: GuardianPolicy;
  let entryPoint: MockEntryPoint;
  let implementation: AgentAccount;
  let deployer: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let aiSigner: HardhatEthersSigner;

  const stakeSelector = ethers.id("stake(uint256)").slice(0, 10);

  beforeEach(async function () {
    [deployer, user, aiSigner] = await ethers.getSigners();

    const EntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();

    const GuardianFactory = await ethers.getContractFactory("GuardianPolicy");
    guardian = await GuardianFactory.deploy();
    await guardian.waitForDeployment();

    const RegistryFactory = await ethers.getContractFactory("AgentRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();

    const ImplFactory = await ethers.getContractFactory("AgentAccount");
    implementation = await ImplFactory.deploy(await entryPoint.getAddress());
    await implementation.waitForDeployment();

    const FactoryFactory = await ethers.getContractFactory("AgentFactory");
    factory = await FactoryFactory.deploy(
      await implementation.getAddress(),
      await entryPoint.getAddress(),
      await guardian.getAddress(),
      await registry.getAddress()
    );
    await factory.waitForDeployment();

    const AGENT_OWNER_ROLE = await guardian.AGENT_OWNER_ROLE();
    const FACTORY_ROLE = await registry.FACTORY_ROLE();

    await guardian.grantRole(AGENT_OWNER_ROLE, await factory.getAddress());
    await registry.grantRole(FACTORY_ROLE, await factory.getAddress());
  });

  describe("Deployment", function () {
    it("sets implementation, entryPoint, guardian, registry correctly", async function () {
      expect(await factory.implementation()).to.equal(await implementation.getAddress());
      expect(await factory.entryPoint()).to.equal(await entryPoint.getAddress());
    });
  });

  describe("createAgent", function () {
    it("deploys a new agent and registers it", async function () {
      const mockProtocol = ethers.Wallet.createRandom().address;
      
      const tx = await factory.connect(user).createAgent(
        aiSigner.address,
        0,
        [mockProtocol],
        [stakeSelector],
        ethers.parseEther("1"),
        ethers.parseEther("5"),
        false,
        "Stake DOT conservatively"
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const agents = await factory.getOwnerAgents(user.address);
      expect(agents.length).to.equal(1);
      expect(await factory.isAgent(agents[0])).to.be.true;
    });

    it("emits AgentCreated event", async function () {
      const mockProtocol = ethers.Wallet.createRandom().address;

      await expect(
        factory.connect(user).createAgent(
          aiSigner.address,
          0,
          [mockProtocol],
          [stakeSelector],
          ethers.parseEther("1"),
          ethers.parseEther("5"),
          false,
          "Test strategy"
        )
      ).to.emit(factory, "AgentCreated");
    });

    it("registers agent in registry", async function () {
      const mockProtocol = ethers.Wallet.createRandom().address;

      await factory.connect(user).createAgent(
        aiSigner.address,
        0,
        [mockProtocol],
        [stakeSelector],
        ethers.parseEther("1"),
        ethers.parseEther("5"),
        false,
        "Test strategy"
      );

      const agents = await factory.getOwnerAgents(user.address);
      const info = await registry.getAgentInfo(agents[0]);
      expect(info.owner).to.equal(user.address);
      expect(info.active).to.be.true;
    });

    it("predictAgentAddress returns correct address before deployment", async function () {
      const mockProtocol = ethers.Wallet.createRandom().address;
      const currentCount = await factory.agentCount();
      
      const predicted = await factory.predictAgentAddress(user.address, currentCount);
      
      await factory.connect(user).createAgent(
        aiSigner.address,
        0,
        [mockProtocol],
        [stakeSelector],
        ethers.parseEther("1"),
        ethers.parseEther("5"),
        false,
        "Test"
      );

      const agents = await factory.getOwnerAgents(user.address);
      expect(agents[0]).to.equal(predicted);
    });
  });

  describe("deactivateAgent", function () {
    it("owner can deactivate their agent", async function () {
      const mockProtocol = ethers.Wallet.createRandom().address;
      await factory.connect(user).createAgent(
        aiSigner.address, 0, [mockProtocol], [stakeSelector],
        ethers.parseEther("1"), ethers.parseEther("5"), false, "Test"
      );
      const agents = await factory.getOwnerAgents(user.address);

      await expect(factory.connect(user).deactivateAgent(agents[0]))
        .to.emit(factory, "AgentDeactivated");
    });

    it("non-owner cannot deactivate agent", async function () {
      const mockProtocol = ethers.Wallet.createRandom().address;
      await factory.connect(user).createAgent(
        aiSigner.address, 0, [mockProtocol], [stakeSelector],
        ethers.parseEther("1"), ethers.parseEther("5"), false, "Test"
      );
      const agents = await factory.getOwnerAgents(user.address);

      const [, , nonOwner] = await ethers.getSigners();
      await expect(factory.connect(nonOwner).deactivateAgent(agents[0])).to.be.revertedWith(
        "Factory: caller is not agent owner"
      );
    });
  });
});
