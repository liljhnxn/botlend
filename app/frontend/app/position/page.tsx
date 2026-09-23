"use client";

import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import {
  Layers,
  Shield,
  Coins,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Percent,
} from "lucide-react";
import { useBotLend } from "../../hooks/useBotLend";
import { HealthFactorBadge } from "../../components/HealthFactorBadge";
import { formatTokenAmount, formatPercentRate, formatBpsRate } from "../../lib/utils";

export default function PositionPage() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const activeConnected = mounted && isConnected;
  const { userAccount, protocolStats, riskParameters, oracleConfig } = useBotLend();

  const hasDebt = Boolean(userAccount?.debt && userAccount.debt > 0n);
  const collateralAmount = userAccount?.collateral ?? 0n;
  const debtAmount = userAccount?.debt ?? 0n;

  // Liquidation Price calculation:
  // Position liquidates when (Collateral * Price * LiquidationThreshold) / (Debt * Price) < 1
  // If price is relative or in USD:
  // LiquidationPrice = (Debt * 10000) / (Collateral * LiquidationThreshold)
  let liquidationPriceDisplay = "N/A (No Debt)";
  if (hasDebt && collateralAmount > 0n && riskParameters?.liquidationThreshold) {
    const thresholdNum = Number(riskParameters.liquidationThreshold) / 10000;
    const debtNum = parseFloat(formatUnits(debtAmount, 18));
    const collatNum = parseFloat(formatUnits(collateralAmount, 18));
    if (collatNum > 0 && thresholdNum > 0) {
      const liqPrice = debtNum / (collatNum * thresholdNum);
      liquidationPriceDisplay = `$${liqPrice.toFixed(4)}`;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Detailed Position</h1>
        <p className="text-slate-400 text-sm mt-1">
          In-depth accounting of your collateral solvency, active debt, borrowing limits, and liquidation risk.
        </p>
      </div>

      {!activeConnected ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4 shadow-xl">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">Wallet Not Connected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please connect your Web3 wallet in the top navigation bar to inspect your live on-chain position.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Overall Position Health
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-white">Account Status:</span>
                <HealthFactorBadge
                  healthFactor={userAccount?.healthFactor}
                  hasDebt={hasDebt}
                  size="lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/borrow"
                className="px-4 py-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 hover:bg-cyan-900/50 text-xs font-semibold text-cyan-300 transition"
              >
                Deposit Collateral
              </Link>
              <Link
                href="/borrow"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition"
              >
                Repay Loan
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Collateral Card */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Collateral Deposited</span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatTokenAmount(userAccount?.collateral)} BOT
              </div>
              <p className="text-[11px] text-slate-500">
                Valued on-chain via BotOracle price feed.
              </p>
            </div>

            {/* Debt Card */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Outstanding Borrowed Debt</span>
                <Coins className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-400">
                {formatTokenAmount(userAccount?.debt)} BOT
              </div>
              <p className="text-[11px] text-slate-500">
                Includes continuously accrued variable interest.
              </p>
            </div>

            {/* Borrow Capacity Card */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Available Borrowing Power</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatTokenAmount(userAccount?.maxBorrow)} BOT
              </div>
              <p className="text-[11px] text-slate-500">
                Capped at {formatBpsRate(riskParameters?.maxLTV)} max LTV.
              </p>
            </div>
          </div>

          {/* Deep Breakdown Card */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Risk & Liquidation Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Liquidation Price (Estimated):</span>
                <div className="text-base font-bold text-white font-mono">{liquidationPriceDisplay}</div>
                <p className="text-[10px] text-slate-500">
                  If oracle price falls below this, the position becomes eligible for liquidation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Liquidation Threshold:</span>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {formatBpsRate(riskParameters?.liquidationThreshold)}
                </div>
                <p className="text-[10px] text-slate-500">
                  Maximum borrow allowed before position health factor enters liquidatable status (&lt; 1.0).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Lending Liquidity Supplied:</span>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {formatTokenAmount(userAccount?.supplied)} BOT
                </div>
                <p className="text-[10px] text-slate-500">
                  Tokens earning {formatPercentRate(protocolStats?.supplyRate)} supply APY in the lending pool.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Liquidation Incentive Bonus:</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {formatBpsRate(riskParameters?.liquidationBonus)}
                </div>
                <p className="text-[10px] text-slate-500">
                  Bonus collateral awarded to liquidator upon debt repayment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
