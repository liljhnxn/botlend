"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Coins,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
  Shield,
  Droplets,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useBotLend } from "../hooks/useBotLend";
import { useBotLendActions } from "../hooks/useBotLendActions";
import { useEvents } from "../hooks/useEvents";
import { StatCard } from "../components/StatCard";
import { HealthFactorBadge } from "../components/HealthFactorBadge";
import { PoolMetricsVisualizer } from "../components/Charts";
import { TxModal } from "../components/TxModal";
import {
  formatTokenAmount,
  formatPercentRate,
  shortenAddress,
  getExplorerTxUrl,
} from "../lib/utils";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeConnected = mounted && isConnected;
  const { protocolStats, userAccount, isLoading, refetchAll } = useBotLend();
  const { txStatus, currentTxHash, actionTitle, errorMessage, resetTx, claimFaucet } =
    useBotLendActions(refetchAll);
  const { events } = useEvents();

  return (
    <div className="space-y-10">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Botchain Decentralized Lending Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Protocol Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Overcollateralized lending and borrowing powered by on-chain smart contracts. Real-time metrics
            directly verified from Botchain Testnet.
          </p>
        </div>

        {/* Quick Faucet & Action Buttons */}
        <div className="flex items-center gap-3">
          {activeConnected && (
            <button
              onClick={() => claimFaucet()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-medium text-xs transition"
            >
              <Droplets className="w-4 h-4" />
              <span>Claim Test BLBOT</span>
            </button>
          )}
          <Link
            href="/supply"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <span>Supply BOT</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Protocol Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Supplied"
          value={`${formatTokenAmount(protocolStats?.totalSupplied)} BOT`}
          subValue="Total protocol liquidity"
          icon={<Droplets className="w-5 h-5 text-cyan-400" />}
        />
        <StatCard
          title="Total Borrowed"
          value={`${formatTokenAmount(protocolStats?.totalBorrowed)} BOT`}
          subValue="Active outstanding debt"
          icon={<Coins className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          title="Estimated Supply APY"
          value={formatPercentRate(protocolStats?.supplyRate)}
          subValue="Variable lending return"
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          title="Estimated Borrow APY"
          value={formatPercentRate(protocolStats?.borrowRate)}
          subValue="Variable borrowing cost"
          icon={<Percent className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Middle Row: User Position Summary & Pool Metrics Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Position Overview */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Your Position</span>
              </h2>
              {activeConnected && (
                <HealthFactorBadge
                  healthFactor={userAccount?.healthFactor}
                  hasDebt={Boolean(userAccount?.debt && userAccount.debt > 0n)}
                />
              )}
            </div>

            {!activeConnected ? (
              <div className="py-10 text-center space-y-3">
                <Shield className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Connect your Web3 wallet to monitor your collateral, debt, and borrow capacity.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Supplied Balance:</span>
                  <span className="font-semibold text-white">
                    {formatTokenAmount(userAccount?.supplied)} BOT
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Collateral Deposited:</span>
                  <span className="font-semibold text-white">
                    {formatTokenAmount(userAccount?.collateral)} BOT
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Borrowed Debt:</span>
                  <span className="font-semibold text-rose-400">
                    {formatTokenAmount(userAccount?.debt)} BOT
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Remaining Borrow Power:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatTokenAmount(userAccount?.maxBorrow)} BOT
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-2">
            <Link
              href="/borrow"
              className="flex-1 py-2 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition"
            >
              Manage Debt
            </Link>
            <Link
              href="/position"
              className="flex-1 py-2 text-center rounded-xl bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/50 text-xs font-medium text-cyan-300 transition"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Pool Utilization Visualizer */}
        <div className="lg:col-span-2">
          <PoolMetricsVisualizer
            totalSupplied={protocolStats?.totalSupplied}
            totalBorrowed={protocolStats?.totalBorrowed}
            availableLiquidity={protocolStats?.availableLiquidity}
            utilizationRate={protocolStats?.utilizationRate}
          />
        </div>
      </div>

      {/* Recent On-chain Activity Feed */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Recent Protocol Activity</h2>
            <p className="text-xs text-slate-400">Real-time blockchain events recorded by BotLend contract</p>
          </div>
          <Link
            href="/activity"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No on-chain events detected in recent blocks. Interacting with the protocol will record real activity here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Block</th>
                  <th className="pb-3 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {events.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          item.type === "Supply"
                            ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                            : item.type === "Borrow"
                            ? "bg-indigo-950/70 text-indigo-400 border border-indigo-500/30"
                            : item.type === "Liquidation"
                            ? "bg-rose-950/70 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{shortenAddress(item.user)}</td>
                    <td className="py-3 font-sans font-semibold text-white">
                      {formatTokenAmount(item.amount)} BOT
                    </td>
                    <td className="py-3 text-slate-500">#{item.blockNumber}</td>
                    <td className="py-3 text-right">
                      <a
                        href={getExplorerTxUrl(item.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        <span>BohrScan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Global Transaction Modal */}
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
