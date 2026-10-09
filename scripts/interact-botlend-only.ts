import { ethers } from "hardhat";
import * as fs from "fs";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=========================================================");
  console.log("BOT CHAIN MAINNET: 5 STRICT BOTLEND CONTRACT INTERACTIONS");
  console.log("=========================================================");

  const deployments = JSON.parse(fs.readFileSync("deployments/botchainMainnet.json", "utf8"));
  const botLendAddress = deployments.contracts.BotLend;
  console.log(`BotLend Target Contract: ${botLendAddress}`);

  const interactionReport = JSON.parse(fs.readFileSync("deployments/interactions-report.json", "utf8"));
  const savedWallets = interactionReport.wallets;

  const provider = ethers.provider;
  const gasPrice = ethers.parseUnits("20", "gwei");
  const gasLimit = 35000n; // 29,260 actual gas used, safely within balance

  const botLendAbi = [
    "function accrueInterest() public",
    "function lastAccrualTimestamp() view returns (uint256)",
    "function borrowIndex() view returns (uint256)"
  ];

  const results: any[] = [
    {
      interaction: 1,
      walletIndex: 1,
      walletAddress: savedWallets[0].address,
      contract: "BotLend",
      contractAddress: botLendAddress,
      action: "accrueInterest()",
      txHash: "0x79a2c3b1d5423b0826886111f4dc67f3fe7edc2570bb34610f669d42b17c7b12",
      blockNumber: 26024458,
      gasUsed: "29260",
      explorerUrl: "https://scan.botchain.ai/tx/0x79a2c3b1d5423b0826886111f4dc67f3fe7edc2570bb34610f669d42b17c7b12",
    }
  ];

  // We need 4 more interactions to complete 5:
  // Tx 2: Wallet 1
  // Tx 3: Wallet 2
  // Tx 4: Wallet 2
  // Tx 5: Wallet 3
  const remainingSequence = [
    { walletIndex: 1, walletInfo: savedWallets[0] },
    { walletIndex: 2, walletInfo: savedWallets[1] },
    { walletIndex: 2, walletInfo: savedWallets[1] },
    { walletIndex: 3, walletInfo: savedWallets[2] },
  ];

  for (let i = 0; i < remainingSequence.length; i++) {
    const item = remainingSequence[i];
    const interactionNum = results.length + 1;
    const signer = new ethers.Wallet(item.walletInfo.privateKey, provider);
    const balance = await provider.getBalance(signer.address);
    console.log(`\nExecuting Interaction ${interactionNum}/5: Wallet ${item.walletIndex} (${signer.address})`);
    console.log(`   Balance: ${ethers.formatEther(balance)} BOT`);

    const botLend = new ethers.Contract(botLendAddress, botLendAbi, signer);

    const tx = await botLend.accrueInterest({
      gasPrice: gasPrice,
      gasLimit: gasLimit,
    });

    console.log(`   Tx Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`   Confirmed in block: ${receipt.blockNumber} (Gas used: ${receipt.gasUsed})`);

    const explorerUrl = `https://scan.botchain.ai/tx/${tx.hash}`;
    results.push({
      interaction: interactionNum,
      walletIndex: item.walletIndex,
      walletAddress: signer.address,
      contract: "BotLend",
      contractAddress: botLendAddress,
      action: "accrueInterest()",
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: explorerUrl,
    });

    console.log(`   Explorer: ${explorerUrl}`);
    if (i < remainingSequence.length - 1) {
      console.log("   Waiting 4 seconds for next block...");
      await sleep(4000);
    }
  }

  // Update interactions-report.json
  const updatedReport = {
    ...interactionReport,
    interactions: results,
  };

  fs.writeFileSync("deployments/interactions-report.json", JSON.stringify(updatedReport, null, 2));
  console.log("\n=========================================================");
  console.log("Successfully completed and saved all 5 BotLend interactions!");
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
