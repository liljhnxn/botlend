"use client";

import React from "react";
import { formatUnits } from "viem";
import { ShieldCheck, AlertTriangle, AlertOctagon, Minus } from "lucide-react";
import { cn } from "../lib/utils";

interface HealthFactorBadgeProps {
  healthFactor?: bigint;
  hasDebt?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function HealthFactorBadge({
  healthFactor,
  hasDebt = true,
  className,
  size = "md",
}: HealthFactorBadgeProps) {
  if (!hasDebt || healthFactor === undefined || healthFactor === null) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
          className
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Safe (No Active Debt)</span>
      </div>
    );
  }

  // Check if max uint
  if (healthFactor > BigInt(100) * BigInt(10 ** 18)) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
          className
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Healthy (∞)</span>
      </div>
    );
  }

  const hfNumber = parseFloat(formatUnits(healthFactor, 18));
  const isHealthy = hfNumber >= 1.2;
  const isWarning = hfNumber >= 1.0 && hfNumber < 1.2;
  const isLiquidatable = hfNumber < 1.0;

  if (isLiquidatable) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-500/60 animate-pulse",
          size === "lg" && "text-sm px-4 py-1.5",
          className
        )}
      >
        <AlertOctagon className="w-4 h-4 text-rose-400" />
        <span>Liquidatable: {hfNumber.toFixed(2)} (High Risk)</span>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40",
          size === "lg" && "text-sm px-4 py-1.5",
          className
        )}
      >
        <AlertTriangle className="w-4 h-4 text-amber-300" />
        <span>Warning: {hfNumber.toFixed(2)} (Near Liquidation)</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
        size === "lg" && "text-sm px-4 py-1.5",
        className
      )}
    >
      <ShieldCheck className="w-4 h-4 text-emerald-400" />
      <span>Healthy: {hfNumber.toFixed(2)}</span>
    </div>
  );
}
