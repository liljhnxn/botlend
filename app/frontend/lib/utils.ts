import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTokenAmount(amount?: bigint, decimals = 18, displayDecimals = 4): string {
  if (amount === undefined || amount === null) return "0.00";
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return "0.00";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: displayDecimals,
  });
}

export function formatPercentRate(rateWei?: bigint): string {
  if (rateWei === undefined || rateWei === null) return "0.00%";
  const num = parseFloat(formatUnits(rateWei, 18)) * 100;
  return `${num.toFixed(2)}%`;
}

export function formatBpsRate(bps?: bigint): string {
  if (bps === undefined || bps === null) return "0.00%";
  const num = Number(bps) / 100;
  return `${num.toFixed(2)}%`;
}

export function shortenAddress(address?: string): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function getExplorerTxUrl(hash?: string): string {
  const base = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.bohr.life";
  return `${base.replace(/\/$/, "")}/tx/${hash || ""}`;
}

export function getExplorerAddressUrl(address?: string): string {
  const base = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.bohr.life";
  return `${base.replace(/\/$/, "")}/address/${address || ""}`;
}
