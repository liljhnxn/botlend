import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log(`Configuring BotLend on network: ${network.name}`);
  console.log("==================================================");

  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found at ${deploymentPath}. Run deploy.ts first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const botLendAddress = deployment.contracts.BotLend;
  console.log(`Connecting to BotLend at: ${botLendAddress}`);

  const [signer] = await ethers.getSigners();
  const code = await ethers.provider.getCode(botLendAddress);
  if (code === "0x") {
    console.log(`No contract code found at ${botLendAddress} on network ${network.name}.`);
    console.log("If testing locally, please run a persistent node with 'npx hardhat node' and deploy with '--network localhost'.");
    return;
  }
  const botLend = await ethers.getContractAt("BotLend", botLendAddress, signer);

  // Read current parameters
  const [maxLTV, threshold, bonus] = await botLend.getRiskParameters();
  console.log(`Current LTV: ${Number(maxLTV) / 100}%, Liquidation Threshold: ${Number(threshold) / 100}%, Bonus: ${Number(bonus) / 100}%`);

  const [baseRate, slopeRate, reserveFactor] = await botLend.getInterestParameters();
  console.log(`Current Base Rate: ${ethers.formatUnits(baseRate, 16)}%, Slope Rate: ${ethers.formatUnits(slopeRate, 16)}%, Reserve Factor: ${Number(reserveFactor) / 100}%`);

  const [oracleAddr, feedId, maxAge] = await botLend.getOracleConfig();
  console.log(`Oracle: ${oracleAddr}, Feed ID: ${feedId}, Max Age: ${maxAge}s`);

  console.log("\nConfiguration verification complete!");
}

main().catch((error) => {
  console.error("Configuration failed:", error);
  process.exitCode = 1;
});
