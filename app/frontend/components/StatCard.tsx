"use client";

import React, { ReactNode } from "react";
import { cn } from "../lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subValue,
  icon,
  badge,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative p-5 rounded-2xl bg-[#0f172a]/80 border border-[#1e293b] backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300 group shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700/50 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        {badge}
      </div>

      {(subValue || trend) && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/50">
          {subValue && <span>{subValue}</span>}
          {trend && <span className="text-cyan-400 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
}
