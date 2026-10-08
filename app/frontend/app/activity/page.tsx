"use client";

import React, { useState } from "react";
import { Activity, ExternalLink, Filter, Loader2 } from "lucide-react";
import { useEvents } from "../../hooks/useEvents";
import { formatTokenAmount, shortenAddress, getExplorerTxUrl } from "../../lib/utils";

const FILTER_TYPES = [
  "ALL",
  "Supply",
  "Withdraw",
  "Borrow",
  "Repay",
  "CollateralDeposited",
  "CollateralWithdrawn",
  "Liquidation",
] as const;

export default function ActivityPage() {
  const { events, isLoading } = useEvents();
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredEvents = events.filter((e) => {
    if (selectedFilter === "ALL") return true;
    return e.type === selectedFilter;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">On-Chain Protocol Activity</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Real-time decentralized event log indexed directly from BotLend smart contract logs on BOT Chain Mainnet.
        </p>
      </div>

      {/* Main Activity Table */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl space-y-6">
        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFilter === type
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Indexing latest blocks from Botchain RPC...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Events Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions matching the selected criteria have been executed in recent blocks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3">Event Type</th>
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Block Number</th>
                  <th className="pb-3 text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredEvents.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 font-sans">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          item.type === "Supply"
                            ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                            : item.type === "Withdraw"
                            ? "bg-purple-950/70 text-purple-400 border border-purple-500/30"
                            : item.type === "Borrow"
                            ? "bg-indigo-950/70 text-indigo-400 border border-indigo-500/30"
                            : item.type === "Repay"
                            ? "bg-cyan-950/70 text-cyan-400 border border-cyan-500/30"
                            : item.type === "CollateralDeposited"
                            ? "bg-amber-950/70 text-amber-400 border border-amber-500/30"
                            : item.type === "CollateralWithdrawn"
                            ? "bg-orange-950/70 text-orange-400 border border-orange-500/30"
                            : item.type === "Liquidation"
                            ? "bg-rose-950/70 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.type === "CollateralDeposited"
                          ? "Collateral Deposit"
                          : item.type === "CollateralWithdrawn"
                          ? "Collateral Withdrawal"
                          : item.type}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-300">{shortenAddress(item.user)}</td>
                    <td className="py-3.5 font-sans font-bold text-white">
                      {formatTokenAmount(item.amount)} BOT
                    </td>
                    <td className="py-3.5 text-slate-500">#{item.blockNumber}</td>
                    <td className="py-3.5 text-right font-sans">
                      <a
                        href={getExplorerTxUrl(item.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <span>View on BohrScan</span>
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
    </div>
  );
}
