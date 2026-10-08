"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import {
  Wallet,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Coins,
  Shield,
  Layers,
  Activity,
  Code2,
  PieChart,
  Percent,
  Menu,
  X,
  Droplets,
  ExternalLink,
} from "lucide-react";
import { activeChain, CONTRACT_CONFIG } from "../lib/contracts";
import { shortenAddress } from "../lib/utils";

const NAV_LINKS = [
  { name: "Dashboard", href: "/", icon: PieChart },
  { name: "Markets", href: "/markets", icon: Percent },
  { name: "Supply", href: "/supply", icon: Droplets },
  { name: "Borrow", href: "/borrow", icon: Coins },
  { name: "Position", href: "/position", icon: Layers },
  { name: "Liquidations", href: "/liquidations", icon: Shield },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Admin", href: "/admin", icon: Shield },
  { name: "Developer", href: "/developer", icon: Code2 },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeConnected = mounted && isConnected;
  const isWrongNetwork = activeConnected && chainId !== activeChain.id && chainId !== 31337;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">Bot</span>
                  <span className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Lend
                  </span>
                </div>
                <span className="text-[10px] tracking-wider font-semibold uppercase text-cyan-400/80 -mt-1">
                  Botchain Protocol
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Mainnet Explorer Direct Link */}
            <a
              href={`https://scan.botchain.ai/address/${CONTRACT_CONFIG.botLendAddress || "0x7D097D3C1C56Fb555F76f7C57E84543CAeB6674a"}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/30 text-xs font-semibold shadow-sm transition"
              title="View live verified contract on BotScan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mainnet Explorer</span>
            </a>

            {/* Network Indicator / Switcher */}
            {activeConnected && (
              <div>
                {isWrongNetwork ? (
                  <button
                    onClick={() => switchChain({ chainId: activeChain.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs font-semibold hover:bg-rose-900 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Switch to {activeChain.name}</span>
                  </button>
                ) : (
                  <a
                    href="https://scan.botchain.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition"
                    title="View BOT Chain Mainnet on BotScan"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-medium">{activeChain.name} ({activeChain.id})</span>
                  </a>
                )}
              </div>
            )}

            {/* Wallet Connect / Account Button */}
            {!activeConnected ? (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-white font-medium transition"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-[10px] font-bold">
                    {address?.slice(2, 4)}
                  </div>
                  <span>{shortenAddress(address)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {walletDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0f172a] border border-slate-800 shadow-2xl p-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-800 text-slate-400 text-[11px]">
                      Connected Account
                      <div className="text-white font-mono mt-0.5 truncate">{address}</div>
                    </div>
                    <a
                      href={`https://scan.botchain.ai/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition text-left mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Account on BotScan</span>
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#080c14] px-4 pt-3 pb-6 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <a
              href={`https://scan.botchain.ai/address/${CONTRACT_CONFIG.botLendAddress || "0x7D097D3C1C56Fb555F76f7C57E84543CAeB6674a"}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mainnet Explorer (BotScan)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
