"use client";

import React, { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Coins, ShieldCheck, ArrowRight, Wallet, AlertTriangle, Layers } from "lucide-react";
import { useBotLend } from "../../hooks/useBotLend";
import { useBotLendActions } from "../../hooks/useBotLendActions";
import { HealthFactorBadge } from "../../components/HealthFactorBadge";
import { TxModal } from "../../components/TxModal";
import { formatTokenAmount, formatPercentRate, formatBpsRate } from "../../lib/utils";

type BorrowTab = "deposit_collateral" | "withdraw_collateral" | "borrow" | "repay";

export default function BorrowPage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const activeConnected = mounted && isConnected;
  const { protocolStats, userAccount, riskParameters, tokenBalance, tokenAllowance, refetchAll } =
    useBotLend();
  const {
    txStatus,
    currentTxHash,
    actionTitle,
    errorMessage,
    resetTx,
    approveToken,
    depositCollateral,
    withdrawCollateral,
    borrowTokens,
    repayDebt,
    repayAllDebt,
  } = useBotLendActions(refetchAll);

  const [activeTab, setActiveTab] = useState<BorrowTab>("deposit_collateral");
  const [amountInput, setAmountInput] = useState("");

  const parsedAmount =
    amountInput && !isNaN(Number(amountInput)) && Number(amountInput) > 0
      ? parseUnits(amountInput, 18)
      : 0n;

  const needsApproval =
    (activeTab === "deposit_collateral" || activeTab === "repay") &&
    parsedAmount > 0n &&
    tokenAllowance < parsedAmount;

  const handleMax = () => {
    switch (activeTab) {
      case "deposit_collateral":
        setAmountInput(formatUnits(tokenBalance, 18));
        break;
      case "withdraw_collateral":
        setAmountInput(formatUnits(userAccount?.collateral ?? 0n, 18));
        break;
      case "borrow":
        setAmountInput(formatUnits(userAccount?.maxBorrow ?? 0n, 18));
        break;
      case "repay":
        setAmountInput(formatUnits(userAccount?.debt ?? 0n, 18));
        break;
    }
  };

  const handleExecute = async () => {
    if (parsedAmount <= 0n) return;

    if (activeTab === "deposit_collateral") {
      if (needsApproval) {
        await approveToken(parsedAmount);
      } else {
        await depositCollateral(parsedAmount);
        setAmountInput("");
      }
    } else if (activeTab === "withdraw_collateral") {
      await withdrawCollateral(parsedAmount);
      setAmountInput("");
    } else if (activeTab === "borrow") {
      await borrowTokens(parsedAmount);
      setAmountInput("");
    } else if (activeTab === "repay") {
      if (needsApproval) {
        await approveToken(parsedAmount);
      } else {
        await repayDebt(parsedAmount);
        setAmountInput("");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Borrow & Collateral</h1>
        <p className="text-slate-400 text-sm mt-1">
          Deposit BOT as collateral, unlock borrowing capacity up to 70% LTV, and manage active debt.
        </p>
      </div>

      {/* Position Quick Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
        <div>
          <span className="text-[11px] text-slate-400">Deposited Collateral</span>
          <div className="text-base font-bold text-white mt-0.5">
            {formatTokenAmount(userAccount?.collateral)} BOT
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Current Debt</span>
          <div className="text-base font-bold text-rose-400 mt-0.5">
            {formatTokenAmount(userAccount?.debt)} BOT
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Available to Borrow</span>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            {formatTokenAmount(userAccount?.maxBorrow)} BOT
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Health Factor</span>
          <div className="mt-1">
            <HealthFactorBadge
              healthFactor={userAccount?.healthFactor}
              hasDebt={Boolean(userAccount?.debt && userAccount.debt > 0n)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Interaction Card */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-2xl space-y-6">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("deposit_collateral");
              setAmountInput("");
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "deposit_collateral"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Deposit Collateral
          </button>
          <button
            onClick={() => {
              setActiveTab("withdraw_collateral");
              setAmountInput("");
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "withdraw_collateral"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Withdraw Collateral
          </button>
          <button
            onClick={() => {
              setActiveTab("borrow");
              setAmountInput("");
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "borrow"
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Borrow BOT
          </button>
          <button
            onClick={() => {
              setActiveTab("repay");
              setAmountInput("");
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "repay"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Repay Debt
          </button>
        </div>

        {/* Input Box */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>
              {activeTab === "deposit_collateral" && "Wallet Balance Available:"}
              {activeTab === "withdraw_collateral" && "Collateral Available:"}
              {activeTab === "borrow" && "Max Borrow Capacity:"}
              {activeTab === "repay" && "Outstanding Debt:"}
            </span>
            <span className="font-semibold text-slate-200">
              {activeTab === "deposit_collateral" && `${formatTokenAmount(tokenBalance)} BOT`}
              {activeTab === "withdraw_collateral" && `${formatTokenAmount(userAccount?.collateral)} BOT`}
              {activeTab === "borrow" && `${formatTokenAmount(userAccount?.maxBorrow)} BOT`}
              {activeTab === "repay" && `${formatTokenAmount(userAccount?.debt)} BOT`}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="number"
              placeholder="0.0"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full py-3.5 pl-4 pr-24 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-cyan-500 focus:outline-none text-white text-lg font-mono placeholder:text-slate-600"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleMax}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-cyan-400 transition uppercase"
              >
                Max
              </button>
              <span className="text-xs font-bold text-slate-300">BOT</span>
            </div>
          </div>
        </div>

        {/* Context Information Card */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Borrow APY (Variable):</span>
            <span className="font-bold text-indigo-400">{formatPercentRate(protocolStats?.borrowRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Max LTV:</span>
            <span className="font-semibold text-white">{formatBpsRate(riskParameters?.maxLTV)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Liquidation Threshold:</span>
            <span className="font-semibold text-amber-400">{formatBpsRate(riskParameters?.liquidationThreshold)}</span>
          </div>
        </div>

        {/* Action Button */}
        {!activeConnected ? (
          <div className="text-center py-3 text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
            Please connect your wallet to manage loans and collateral.
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleExecute}
              disabled={parsedAmount <= 0n}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold text-white text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {activeTab === "deposit_collateral" &&
                (needsApproval ? "Approve BLBOT for Collateral" : "Deposit Collateral")}
              {activeTab === "withdraw_collateral" && "Withdraw Collateral"}
              {activeTab === "borrow" && "Borrow BOT"}
              {activeTab === "repay" && (needsApproval ? "Approve BLBOT for Repay" : "Repay Loan")}
            </button>

            {activeTab === "repay" && userAccount?.debt && userAccount.debt > 0n && (
              <button
                type="button"
                onClick={() => repayAllDebt()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition"
              >
                Repay Full Debt in One-Click (repayAll)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Global Tx Modal */}
      <TxModal
        isOpen={txStatus !== "idle"}
        status={txStatus}
        txHash={currentTxHash}
        actionTitle={actionTitle}
        errorMessage={errorMessage}
        onClose={resetTx}
      />
    </div>
  );
}
