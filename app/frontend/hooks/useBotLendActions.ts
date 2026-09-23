"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_CONFIG, BOTLEND_ABI, ERC20_ABI } from "../lib/contracts";
import { TxStatus } from "../components/TxModal";

export function useBotLendActions(onSuccessCallback?: () => void) {
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [actionTitle, setActionTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContractAsync } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: currentTxHash,
  });

  const resetTx = () => {
    setTxStatus("idle");
    setCurrentTxHash(undefined);
    setErrorMessage("");
    setActionTitle("");
  };

  const handleAction = async (title: string, actionFn: () => Promise<`0x${string}`>) => {
    setActionTitle(title);
    setTxStatus("awaiting_wallet");
    setErrorMessage("");

    try {
      const hash = await actionFn();
      setCurrentTxHash(hash);
      setTxStatus("pending");

      // Transaction is mined
      setTxStatus("success");
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err: any) {
      console.error(`Error executing ${title}:`, err);
      setTxStatus("error");
      const errorMsg =
        err?.shortMessage ||
        err?.message ||
        "Transaction failed or was rejected in your wallet.";
      setErrorMessage(errorMsg);
    }
  };

  // 1. Approve Token
  const approveToken = async (amount: bigint) => {
    return handleAction("Approve BLBOT", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botTokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_CONFIG.botLendAddress, amount],
      });
    });
  };

  // 2. Faucet (Test Tokens)
  const claimFaucet = async () => {
    return handleAction("Claim Faucet (1,000 BLBOT)", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botTokenAddress,
        abi: ERC20_ABI,
        functionName: "faucet",
      });
    });
  };

  // 3. Supply
  const supplyTokens = async (amount: bigint) => {
    return handleAction("Supply BOT Liquidity", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "supply",
        args: [amount],
      });
    });
  };

  // 4. Withdraw Supply
  const withdrawTokens = async (amount: bigint) => {
    return handleAction("Withdraw Supplied BOT", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "withdraw",
        args: [amount],
      });
    });
  };

  // 5. Deposit Collateral
  const depositCollateral = async (amount: bigint) => {
    return handleAction("Deposit Collateral", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "depositCollateral",
        args: [amount],
      });
    });
  };

  // 6. Withdraw Collateral
  const withdrawCollateral = async (amount: bigint) => {
    return handleAction("Withdraw Collateral", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "withdrawCollateral",
        args: [amount],
      });
    });
  };

  // 7. Borrow
  const borrowTokens = async (amount: bigint) => {
    return handleAction("Borrow BOT", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "borrow",
        args: [amount],
      });
    });
  };

  // 8. Repay
  const repayDebt = async (amount: bigint) => {
    return handleAction("Repay Debt", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "repay",
        args: [amount],
      });
    });
  };

  // 9. Repay All
  const repayAllDebt = async () => {
    return handleAction("Repay All Debt", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "repayAll",
      });
    });
  };

  // 10. Liquidate Unhealthy Position
  const liquidatePosition = async (borrower: `0x${string}`, debtAmount: bigint) => {
    return handleAction("Liquidate Unhealthy Loan", async () => {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "liquidate",
        args: [borrower, debtAmount],
      });
    });
  };

  return {
    txStatus,
    currentTxHash,
    actionTitle,
    errorMessage,
    resetTx,
    approveToken,
    claimFaucet,
    supplyTokens,
    withdrawTokens,
    depositCollateral,
    withdrawCollateral,
    borrowTokens,
    repayDebt,
    repayAllDebt,
    liquidatePosition,
  };
}
