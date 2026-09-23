"use client";

import React from "react";
import Link from "next/link";
import { Coins, Droplets, TrendingUp, Percent, ArrowRight, ShieldCheck } from "lucide-react";
import { useBotLend } from "../../hooks/useBotLend";
import { formatTokenAmount, formatPercentRate, formatBpsRate } from "../../lib/utils";

export default function MarketsPage() {
  const { protocolStats, riskParameters } = useBotLend();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Lending & Borrowing Markets</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Explore Botchain lending markets, real-time utilization rates, and dynamically calculated APYs.
        </p>
      </div>

      {/* Main Markets Table / Cards */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Active Markets</h2>
          </div>
          <div className="text-xs text-slate-400">
            Chain: <span className="text-cyan-400 font-semibold">Botchain Testnet (968)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="pb-4">Asset</th>
                <th className="pb-4">Total Supplied</th>
                <th className="pb-4">Total Borrowed</th>
                <th className="pb-4">Available Liquidity</th>
                <th className="pb-4">Supply APY</th>
                <th className="pb-4">Borrow APY</th>
                <th className="pb-4">Utilization</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-900/50 transition">
                {/* Asset */}
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold font-sans text-xs">
                      BOT
                    </div>
                    <div>
                      <div className="font-sans font-bold text-white text-sm">Bot Token</div>
                      <div className="text-[10px] text-slate-400 font-sans">BOT / BLBOT</div>
                    </div>
                  </div>
                </td>

                {/* Total Supplied */}
                <td className="py-4">
                  <div className="font-sans font-semibold text-white">
                    {formatTokenAmount(protocolStats?.totalSupplied)} BOT
                  </div>
                </td>

                {/* Total Borrowed */}
                <td className="py-4">
                  <div className="font-sans font-semibold text-slate-300">
                    {formatTokenAmount(protocolStats?.totalBorrowed)} BOT
                  </div>
                </td>

                {/* Available Liquidity */}
                <td className="py-4">
                  <div className="font-sans font-semibold text-emerald-400">
                    {formatTokenAmount(protocolStats?.availableLiquidity)} BOT
                  </div>
                </td>

                {/* Supply APY */}
                <td className="py-4">
                  <div className="inline-flex items-center gap-1 font-sans font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3" />
                    <span>{formatPercentRate(protocolStats?.supplyRate)}</span>
                  </div>
                </td>

                {/* Borrow APY */}
                <td className="py-4">
                  <div className="inline-flex items-center gap-1 font-sans font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                    <Percent className="w-3 h-3" />
                    <span>{formatPercentRate(protocolStats?.borrowRate)}</span>
                  </div>
                </td>

                {/* Utilization */}
                <td className="py-4">
                  <div className="font-sans font-semibold text-cyan-400">
                    {formatPercentRate(protocolStats?.utilizationRate)}
                  </div>
                </td>

                {/* Action Buttons */}
                <td className="py-4 text-right">
                  <div className="inline-flex items-center gap-2 font-sans">
                    <Link
                      href="/supply"
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 font-medium transition"
                    >
                      Supply
                    </Link>
                    <Link
                      href="/borrow"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
                    >
                      Borrow
                    </Link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Risk Parameters Spec */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
          <div className="text-xs text-slate-400 mb-1">Max Loan-to-Value (LTV)</div>
          <div className="text-2xl font-bold text-white">{formatBpsRate(riskParameters?.maxLTV)}</div>
          <p className="text-[11px] text-slate-500 mt-2">Maximum borrowing limit against deposited collateral.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
          <div className="text-xs text-slate-400 mb-1">Liquidation Threshold</div>
          <div className="text-2xl font-bold text-amber-400">
            {formatBpsRate(riskParameters?.liquidationThreshold)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Threshold where position becomes unhealthy and liquidatable.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
          <div className="text-xs text-slate-400 mb-1">Liquidation Bonus</div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatBpsRate(riskParameters?.liquidationBonus)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Incentive bonus awarded to liquidators for repaying bad loans.</p>
        </div>
      </div>
    </div>
  );
}
