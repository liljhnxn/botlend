"use client";

import React, { useState, useEffect } from "react";
import { parseUnits, formatUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { Shield, Settings, AlertTriangle, Play, Pause, Save, Lock } from "lucide-react";
import { useBotLend } from "../../hooks/useBotLend";
import { CONTRACT_CONFIG, BOTLEND_ABI } from "../../lib/contracts";
import { TxModal, TxStatus } from "../../components/TxModal";
import { formatTokenAmount, formatPercentRate, formatBpsRate, shortenAddress } from "../../lib/utils";

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const {
    protocolStats,
    riskParameters,
    interestParameters,
    oracleConfig,
    isPaused,
    isAdmin,
    refetchAll,
  } = useBotLend();
  const activeIsAdmin = mounted && isAdmin;

  const { writeContractAsync } = useWriteContract();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [actionTitle, setActionTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined);

  // Form states
  const [newLtvBps, setNewLtvBps] = useState("7000");
  const [newThresholdBps, setNewThresholdBps] = useState("7500");
  const [newBonusBps, setNewBonusBps] = useState("500");

  const [newBaseRate, setNewBaseRate] = useState("0.02");
  const [newSlopeRate, setNewSlopeRate] = useState("0.18");
  const [newReserveFactorBps, setNewReserveFactorBps] = useState("1000");

  const [newOracleAddr, setNewOracleAddr] = useState("");
  const [newFeedId, setNewFeedId] = useState("1");
  const [newMaxAge, setNewMaxAge] = useState("3600");

  const [withdrawReservesTo, setWithdrawReservesTo] = useState("");
  const [withdrawReservesAmount, setWithdrawReservesAmount] = useState("");

  const resetTx = () => {
    setTxStatus("idle");
    setCurrentTxHash(undefined);
    setErrorMessage("");
  };

  const handleAdminTx = async (title: string, actionFn: () => Promise<`0x${string}`>) => {
    setActionTitle(title);
    setTxStatus("awaiting_wallet");
    setErrorMessage("");
    try {
      const hash = await actionFn();
      setCurrentTxHash(hash);
      setTxStatus("pending");
      setTxStatus("success");
      refetchAll();
    } catch (err: any) {
      console.error(err);
      setTxStatus("error");
      setErrorMessage(err?.shortMessage || err?.message || "Admin execution failed");
    }
  };

  const handleUpdateRisk = () => {
    handleAdminTx("Update Risk Parameters", () =>
      writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "setRiskParameters",
        args: [BigInt(newLtvBps), BigInt(newThresholdBps), BigInt(newBonusBps)],
      })
    );
  };

  const handleUpdateInterest = () => {
    handleAdminTx("Update Interest Parameters", () =>
      writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "setInterestParameters",
        args: [
          parseUnits(newBaseRate, 18),
          parseUnits(newSlopeRate, 18),
          BigInt(newReserveFactorBps),
        ],
      })
    );
  };

  const handleUpdateOracle = () => {
    handleAdminTx("Update Oracle Configuration", () =>
      writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "setOracleConfig",
        args: [newOracleAddr as `0x${string}`, BigInt(newFeedId), BigInt(newMaxAge)],
      })
    );
  };

  const handleTogglePause = () => {
    handleAdminTx(isPaused ? "Unpause Protocol" : "Pause Protocol", () =>
      writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: isPaused ? "unpause" : "pause",
      })
    );
  };

  const handleWithdrawReserves = () => {
    const amount = parseUnits(withdrawReservesAmount, 18);
    handleAdminTx("Withdraw Protocol Reserves", () =>
      writeContractAsync({
        address: CONTRACT_CONFIG.botLendAddress,
        abi: BOTLEND_ABI,
        functionName: "withdrawReserves",
        args: [withdrawReservesTo as `0x${string}`, amount],
      })
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Protocol Governance & Admin</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Authorized administrative management for risk parameters, interest rate curves, oracle configurations,
          and protocol safety controls.
        </p>
      </div>

      {/* Global Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
          <span className="text-xs text-slate-400">Total Protocol Reserves</span>
          <div className="text-xl font-bold text-white mt-1">
            {formatTokenAmount(protocolStats?.reserves)} BOT
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
          <span className="text-xs text-slate-400">Total Liquidity</span>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {formatTokenAmount(protocolStats?.totalSupplied)} BOT
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
          <span className="text-xs text-slate-400">Total Debt</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatTokenAmount(protocolStats?.totalBorrowed)} BOT
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
          <span className="text-xs text-slate-400">Emergency Status</span>
          <div className="text-xl font-bold mt-1">
            {isPaused ? (
              <span className="text-rose-400 flex items-center gap-1.5">
                <Pause className="w-4 h-4" /> Paused
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Play className="w-4 h-4" /> Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Role Check / Guard */}
      {!activeIsAdmin ? (
        <div className="p-8 rounded-2xl bg-[#0f172a] border border-[#1e293b] text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Admin Controls Restricted</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your connected address (<span className="text-slate-200 font-mono">{mounted && address ? shortenAddress(address) : "Not Connected"}</span>)
            does not hold the required <code className="text-cyan-400">DEFAULT_ADMIN_ROLE</code> or{" "}
            <code className="text-cyan-400">RISK_MANAGER_ROLE</code>. Administrative forms are hidden to prevent
            unauthorized operations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Parameters Form */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Risk Parameters</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Max LTV (Basis Points, 7000 = 70%):</label>
                <input
                  type="number"
                  value={newLtvBps}
                  onChange={(e) => setNewLtvBps(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Liquidation Threshold (BPS, 7500 = 75%):</label>
                <input
                  type="number"
                  value={newThresholdBps}
                  onChange={(e) => setNewThresholdBps(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Liquidation Bonus (BPS, 500 = 5%):</label>
                <input
                  type="number"
                  value={newBonusBps}
                  onChange={(e) => setNewBonusBps(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <button
                onClick={handleUpdateRisk}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-white transition mt-2"
              >
                Save Risk Parameters
              </button>
            </div>
          </div>

          {/* Interest Rate Parameters Form */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Interest Rate Model</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Base Borrow Rate APY (e.g. 0.02 = 2%):</label>
                <input
                  type="text"
                  value={newBaseRate}
                  onChange={(e) => setNewBaseRate(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Slope Borrow Rate APY (e.g. 0.18 = 18%):</label>
                <input
                  type="text"
                  value={newSlopeRate}
                  onChange={(e) => setNewSlopeRate(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Reserve Factor (BPS, 1000 = 10%):</label>
                <input
                  type="number"
                  value={newReserveFactorBps}
                  onChange={(e) => setNewReserveFactorBps(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <button
                onClick={handleUpdateInterest}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition mt-2"
              >
                Save Interest Parameters
              </button>
            </div>
          </div>

          {/* Oracle Settings Form */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Oracle Configuration</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">BotOracle Address:</label>
                <input
                  type="text"
                  placeholder={oracleConfig?.oracleAddress || "0x..."}
                  value={newOracleAddr}
                  onChange={(e) => setNewOracleAddr(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Feed ID:</label>
                <input
                  type="number"
                  value={newFeedId}
                  onChange={(e) => setNewFeedId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Max Staleness Age (Seconds, min 60s):</label>
                <input
                  type="number"
                  value={newMaxAge}
                  onChange={(e) => setNewMaxAge(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <button
                onClick={handleUpdateOracle}
                disabled={!newOracleAddr}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white disabled:opacity-40 transition mt-2"
              >
                Save Oracle Settings
              </button>
            </div>
          </div>

          {/* Emergency Controls & Reserve Withdrawal */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Emergency Pause Control</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Pauses deposits, borrows, and collateral withdrawals. Repayments remain permitted.
              </p>
              <button
                onClick={handleTogglePause}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isPaused
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
                }`}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? "Resume Protocol (Unpause)" : "Emergency Pause Protocol"}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white">Withdraw Protocol Fee Reserves</h4>
              <div>
                <label className="text-slate-400">Recipient Address:</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={withdrawReservesTo}
                  onChange={(e) => setWithdrawReservesTo(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Amount (BOT):</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={withdrawReservesAmount}
                  onChange={(e) => setWithdrawReservesAmount(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <button
                onClick={handleWithdrawReserves}
                disabled={!withdrawReservesTo || !withdrawReservesAmount}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 disabled:opacity-40 transition"
              >
                Withdraw Reserves
              </button>
            </div>
          </div>
        </div>
      )}

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
