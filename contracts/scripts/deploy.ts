import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\n🚀 Deploying AgentHub to network: ${network.name} (chainId: ${network.chainId})`);
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  const deployments: Record<string, string> = {};

  console.log("1️⃣  Deploying AgentHubToken (AHT)...");
  const AgentHubToken = await ethers.getContractFactory("AgentHubToken");
  const token = await AgentHubToken.deploy(deployer.address);
  await token.waitForDeployment();
  deployments.AgentHubToken = await token.getAddress();
  console.log(`   ✅ AgentHubToken: ${deployments.AgentHubToken}`);

  console.log("2️⃣  Deploying AgentHubTimelock (24h delay)...");
  const AgentHubTimelock = await ethers.getContractFactory("AgentHubTimelock");
  const timelock = await AgentHubTimelock.deploy(
    86400,
    [],
    [ethers.ZeroAddress],
    deployer.address
  );
  await timelock.waitForDeployment();
  deployments.AgentHubTimelock = await timelock.getAddress();
  console.log(`   ✅ AgentHubTimelock: ${deployments.AgentHubTimelock}`);

  console.log("3️⃣  Deploying AgentHubGovernor...");
  const AgentHubGovernor = await ethers.getContractFactory("AgentHubGovernor");
  const governor = await AgentHubGovernor.deploy(
    await token.getAddress(),
    await timelock.getAddress(),
    deployer.address,
    deployer.address
  );
  await governor.waitForDeployment();
  deployments.AgentHubGovernor = await governor.getAddress();
  console.log(`   ✅ AgentHubGovernor: ${deployments.AgentHubGovernor}`);

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress());
  console.log(`   ✅ Granted PROPOSER_ROLE to Governor on Timelock`);

  console.log("4️⃣  Deploying GuardianPolicy...");
  const GuardianPolicy = await ethers.getContractFactory("GuardianPolicy");
  const guardian = await GuardianPolicy.deploy();
  await guardian.waitForDeployment();
  deployments.GuardianPolicy = await guardian.getAddress();
  console.log(`   ✅ GuardianPolicy: ${deployments.GuardianPolicy}`);

  const PROTOCOL_ADMIN_ROLE = await guardian.PROTOCOL_ADMIN_ROLE();
  await guardian.grantRole(PROTOCOL_ADMIN_ROLE, deployer.address);
  console.log(`   ✅ Granted PROTOCOL_ADMIN_ROLE to deployer`);

  console.log("5️⃣  Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  deployments.AgentRegistry = await registry.getAddress();
  console.log(`   ✅ AgentRegistry: ${deployments.AgentRegistry}`);

  console.log("6️⃣  Deploying AgentAccount (implementation)...");
  const AgentAccount = await ethers.getContractFactory("AgentAccount");
  const accountImpl = await AgentAccount.deploy(ENTRY_POINT_ADDRESS);
  await accountImpl.waitForDeployment();
  deployments.AgentAccountImplementation = await accountImpl.getAddress();
  console.log(`   ✅ AgentAccount (impl): ${deployments.AgentAccountImplementation}`);

  console.log("7️⃣  Deploying AgentFactory...");
  const AgentFactory = await ethers.getContractFactory("AgentFactory");
  const factory = await AgentFactory.deploy(
    await accountImpl.getAddress(),
    ENTRY_POINT_ADDRESS,
    await guardian.getAddress(),
    await registry.getAddress()
  );
  await factory.waitForDeployment();
  deployments.AgentFactory = await factory.getAddress();
  console.log(`   ✅ AgentFactory: ${deployments.AgentFactory}`);

  console.log("8️⃣  Configuring roles...");
  const AGENT_OWNER_ROLE = await guardian.AGENT_OWNER_ROLE();
  const FACTORY_ROLE = await registry.FACTORY_ROLE();

  await guardian.grantRole(AGENT_OWNER_ROLE, await factory.getAddress());
  await registry.grantRole(FACTORY_ROLE, await factory.getAddress());
  console.log(`   ✅ Granted AGENT_OWNER_ROLE to AgentFactory on GuardianPolicy`);
  console.log(`   ✅ Granted FACTORY_ROLE to AgentFactory on AgentRegistry`);

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: deployments,
  };

  const outputPath = path.join(deploymentsDir, "hub-testnet.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n📝 Deployment addresses written to: ${outputPath}`);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("📊 Summary:");
  Object.entries(deployments).forEach(([name, addr]) => {
    console.log(`   ${name}: ${addr}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
