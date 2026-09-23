"use client";

import React, { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Droplets, ArrowDownLeft, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { useBotLend } from "../../hooks/useBotLend";
import { useBotLendActions } from "../../hooks/useBotLendActions";
import { TxModal } from "../../components/TxModal";
import { formatTokenAmount, formatPercentRate } from "../../lib/utils";

export default function SupplyPage() {
  const { isConnected } = useAccount();
  const { protocolStats, userAccount, tokenBalance, tokenAllowance, refetchAll } = useBotLend();
  const {
    txStatus,
    currentTxHash,
    actionTitle,
    errorMessage,
    resetTx,
    approveToken,
    supplyTokens,
    withdrawTokens,
    claimFaucet,
  } = useBotLendActions(refetchAll);

  const [activeTab, setActiveTab] = useState<"supply" | "withdraw">("supply");
  const [amountInput, setAmountInput] = useState("");
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeConnected = mounted && isConnected;

  const parsedAmount =
    amountInput && !isNaN(Number(amountInput)) && Number(amountInput) > 0
      ? parseUnits(amountInput, 18)
      : 0n;

  const needsApproval = parsedAmount > 0n && tokenAllowance < parsedAmount;

  const handleMax = () => {
    if (activeTab === "supply") {
      setAmountInput(formatUnits(tokenBalance, 18));
    } else {
      setAmountInput(formatUnits(userAccount?.supplied ?? 0n, 18));
    }
  };

  const handleExecute = async () => {
    if (parsedAmount <= 0n) return;

    if (activeTab === "supply") {
      if (needsApproval) {
        await approveToken(parsedAmount);
      } else {
        await supplyTokens(parsedAmount);
        setAmountInput("");
      }
    } else {
      await withdrawTokens(parsedAmount);
      setAmountInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Supply Liquidity</h1>
        <p className="text-slate-400 text-sm mt-1">
          Supply BOT tokens to earn dynamic variable interest accrued every block from active borrowers.
        </p>
      </div>

      {/* Main Supply Card */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-2xl space-y-6">
        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("supply");
              setAmountInput("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "supply"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Supply Liquidity
          </button>
          <button
            onClick={() => {
              setActiveTab("withdraw");
              setAmountInput("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "withdraw"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Withdraw Supplied
          </button>
        </div>

        {/* Input Box */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>
              {activeTab === "supply" ? "Wallet Balance:" : "Supplied Balance:"}
            </span>
            <span className="font-semibold text-slate-200">
              {activeTab === "supply"
                ? `${formatTokenAmount(tokenBalance)} BOT`
                : `${formatTokenAmount(userAccount?.supplied)} BOT`}
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

        {/* Market Rate Summary */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Estimated Supply APY:</span>
            <span className="font-bold text-emerald-400">
              {formatPercentRate(protocolStats?.supplyRate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Pool Available Liquidity:</span>
            <span className="font-semibold text-white">
              {formatTokenAmount(protocolStats?.availableLiquidity)} BOT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Supplied in Pool:</span>
            <span className="font-semibold text-slate-300">
              {formatTokenAmount(userAccount?.supplied)} BOT
            </span>
          </div>
        </div>

        {/* Action Button */}
        {!activeConnected ? (
          <div className="text-center py-3 text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
            Please connect your wallet to supply liquidity.
          </div>
        ) : (
          <button
            onClick={handleExecute}
            disabled={parsedAmount <= 0n}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold text-white text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {activeTab === "supply"
              ? needsApproval
                ? "Approve BLBOT for Supply"
                : "Supply BOT"
              : "Withdraw BOT"}
          </button>
        )}

        {/* Test Faucet Prompt */}
        {activeConnected && (
          <div className="pt-2 text-center">
            <button
              onClick={() => claimFaucet()}
              className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Need test tokens? Claim 1,000 BLBOT from faucet</span>
            </button>
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
