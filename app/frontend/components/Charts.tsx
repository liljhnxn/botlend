"use client";

import React from "react";
import { formatUnits } from "viem";
import { formatTokenAmount, formatPercentRate } from "../lib/utils";

interface PoolMetricsProps {
  totalSupplied?: bigint;
  totalBorrowed?: bigint;
  availableLiquidity?: bigint;
  utilizationRate?: bigint;
}

export function PoolMetricsVisualizer({
  totalSupplied = 0n,
  totalBorrowed = 0n,
  availableLiquidity = 0n,
  utilizationRate = 0n,
}: PoolMetricsProps) {
  const utilPercent = parseFloat(formatUnits(utilizationRate, 18)) * 100;
  const clampedUtil = Math.min(Math.max(utilPercent, 0), 100);

  return (
    <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Pool Liquidity & Utilization</h3>
          <p className="text-xs text-slate-400">Current real-time lending pool distribution</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Utilization Rate</span>
          <div className="text-lg font-bold text-cyan-400">{utilPercent.toFixed(2)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${clampedUtil}%` }}
          />
          <div
            className="h-full bg-slate-700 transition-all duration-500"
            style={{ width: `${100 - clampedUtil}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Borrowed: {formatTokenAmount(totalBorrowed)} BOT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Available: {formatTokenAmount(availableLiquidity)} BOT</span>
          </div>
        </div>
      </div>

      {/* Grid of Key Breakdowns */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Total Supplied</div>
          <div className="text-sm font-bold text-white mt-0.5">{formatTokenAmount(totalSupplied)} BOT</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Total Borrowed</div>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">{formatTokenAmount(totalBorrowed)} BOT</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Available Liquidity</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">{formatTokenAmount(availableLiquidity)} BOT</div>
        </div>
      </div>
    </div>
  );
}
