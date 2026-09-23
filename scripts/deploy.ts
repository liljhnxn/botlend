import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log(`Starting BotLend Deployment on network: ${network.name}`);
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);

  let botTokenAddress = process.env.NEXT_PUBLIC_BOT_TOKEN_ADDRESS;
  let oracleAddress = process.env.NEXT_PUBLIC_BOTORACLE_CONTRACT_ADDRESS;
  const feedId = process.env.NEXT_PUBLIC_BOTORACLE_FEED_ID ? parseInt(process.env.NEXT_PUBLIC_BOTORACLE_FEED_ID) : 1;
  const maxOracleAge = 3600; // 1 hour

  // 1. Token Setup
  if (!botTokenAddress || botTokenAddress.trim() === "") {
    console.log("\nNo existing token address configured. Deploying BotLendToken (BLBOT) for testing...");
    const BotLendTokenFactory = await ethers.getContractFactory("BotLendToken");
    const botToken = await BotLendTokenFactory.deploy();
    await botToken.waitForDeployment();
    botTokenAddress = await botToken.getAddress();
    console.log(`✓ BotLendToken deployed at: ${botTokenAddress}`);
  } else {
    console.log(`\nUsing existing token at: ${botTokenAddress}`);
  }

  // 2. Oracle Setup
  if (!oracleAddress || oracleAddress.trim() === "") {
    console.log("\nNo BotOracle address configured. Deploying MockBotOracle for testing...");
    const MockBotOracleFactory = await ethers.getContractFactory("MockBotOracle");
    const mockOracle = await MockBotOracleFactory.deploy();
    await mockOracle.waitForDeployment();
    oracleAddress = await mockOracle.getAddress();
    console.log(`✓ MockBotOracle deployed at: ${oracleAddress}`);

    // Set initial price: 1 BOT = $1.00 (1e18)
    const block = await ethers.provider.getBlock("latest");
    const timestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);
    const initialPrice = ethers.parseUnits("1.0", 18);
    await mockOracle.setAnswer(feedId, initialPrice, timestamp, 1);
    console.log(`✓ Configured initial feed ${feedId} price: $1.00 at timestamp ${timestamp}`);
  } else {
    console.log(`\nUsing configured BotOracle at: ${oracleAddress}`);
  }

  // 3. Deploy BotLend Protocol
  console.log("\nDeploying BotLend protocol...");
  const BotLendFactory = await ethers.getContractFactory("BotLend");
  const botLend = await BotLendFactory.deploy(botTokenAddress, oracleAddress, feedId, maxOracleAge);
  await botLend.waitForDeployment();
  const botLendAddress = await botLend.getAddress();
  console.log(`✓ BotLend protocol deployed at: ${botLendAddress}`);

  // 4. Save Deployment Metadata
  const deploymentDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId || (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      BotLend: botLendAddress,
      BotToken: botTokenAddress,
      BotOracle: oracleAddress,
      OracleFeedId: feedId,
      MaxOracleAgeSeconds: maxOracleAge,
    },
    riskParameters: {
      maxLTVBps: 7000,
      liquidationThresholdBps: 7500,
      liquidationBonusBps: 500,
      reserveFactorBps: 1000,
    },
    interestParameters: {
      baseBorrowRateApy: "2%",
      slopeBorrowRateApy: "18%",
    },
    explorerUrl: "https://scan.bohr.life",
  };

  const deploymentPath = path.join(deploymentDir, `${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\nDeployment metadata saved to: ${deploymentPath}`);

  console.log("\n==================================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("==================================================");
  console.log(`BotLend Protocol:  ${botLendAddress}`);
  console.log(`BOT Token:         ${botTokenAddress}`);
  console.log(`Oracle:            ${oracleAddress}`);
  console.log(`Feed ID:           ${feedId}`);
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
