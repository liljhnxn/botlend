"use client";

import React from "react";
import Link from "next/link";
import { Coins, ExternalLink, ShieldAlert, Globe, Compass, Cpu } from "lucide-react";
import { BotChainLogo } from "./BotChainLogo";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#060910] text-slate-400 text-xs py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BOT Chain Ecosystem Feature Banner */}
        <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/60 border border-cyan-500/30 shadow-xl backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex items-center justify-center p-2 shadow-lg shadow-cyan-500/15 flex-shrink-0">
              <BotChainLogo className="w-full h-full" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  BOT Chain Ecosystem
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tracking-wide uppercase">
                  Mainnet 677
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                BotLend is natively deployed on the BOT Chain ecosystem, delivering high-throughput, low-fee decentralized lending and borrowing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold shadow-md transition-all group"
            >
              <BotChainLogo className="w-4 h-4 rounded-sm group-hover:scale-110 transition-transform" size={16} />
              <span>BOT Chain Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </a>

            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 text-cyan-200 hover:text-white border border-cyan-400/40 text-xs font-semibold shadow-md transition-all group"
            >
              <BotChainLogo className="w-4 h-4 rounded-sm group-hover:scale-110 transition-transform" size={16} />
              <span>BOT Chain Explorer</span>
              <ExternalLink className="w-3 h-3 text-cyan-300" />
            </a>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">BotLend</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Decentralized, overcollateralized lending & borrowing protocol built natively for the BOT Chain ecosystem.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <div className="w-5 h-5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                <BotChainLogo className="w-4 h-4" size={16} />
              </div>
              <span>Powered by <span className="text-cyan-400 font-medium">BOT Chain</span></span>
            </div>
          </div>

          {/* Col 2: Protocol Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Protocol</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-cyan-400 transition">Dashboard</Link></li>
              <li><Link href="/markets" className="hover:text-cyan-400 transition">Markets</Link></li>
              <li><Link href="/supply" className="hover:text-cyan-400 transition">Supply Liquidity</Link></li>
              <li><Link href="/borrow" className="hover:text-cyan-400 transition">Borrow & Collateral</Link></li>
              <li><Link href="/liquidations" className="hover:text-cyan-400 transition">Liquidations</Link></li>
            </ul>
          </div>

          {/* Col 3: BOT Chain Ecosystem & Resources */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>BOT Chain Ecosystem</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cyan-400 transition group"
                >
                  <BotChainLogo className="w-3.5 h-3.5 rounded-xs" size={14} />
                  <span>BOT Chain Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
                </a>
              </li>
              <li>
                <a
                  href="https://scan.botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cyan-400 transition group"
                >
                  <BotChainLogo className="w-3.5 h-3.5 rounded-xs" size={14} />
                  <span>BOT Chain Explorer</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
                </a>
              </li>
              <li>
                <a
                  href="https://rpc.botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-400 transition"
                >
                  <span>Botchain RPC</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li><Link href="/developer" className="hover:text-cyan-400 transition">Developer Integration</Link></li>
              <li><Link href="/admin" className="hover:text-cyan-400 transition">Admin Governance</Link></li>
            </ul>
          </div>

          {/* Col 4: Network Specs */}
          <div className="space-y-2 text-slate-400 text-xs">
            <h4 className="text-white font-semibold mb-3">Network Specs</h4>
            <p><span className="text-slate-500">Network:</span> BOT Chain Mainnet</p>
            <p><span className="text-slate-500">Chain ID:</span> 677</p>
            <p><span className="text-slate-500">Gas Token:</span> BOT</p>
            <p>
              <span className="text-slate-500">Website: </span>
              <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                <BotChainLogo className="w-3 h-3" size={12} />
                botchain.ai
              </a>
            </p>
            <p>
              <span className="text-slate-500">Explorer: </span>
              <a href="https://scan.botchain.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                <BotChainLogo className="w-3 h-3" size={12} />
                scan.botchain.ai
              </a>
            </p>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-slate-400">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-300">Important Disclaimer & Risk Disclosure:</p>
            <p>
              BotLend is an MVP demonstration protocol designed for testing and development on BOT Chain Mainnet.
              Always verify contract addresses on the official BOT Chain Explorer before transacting.
              Do not deposit funds you cannot afford to lose. Interest rates and APYs are protocol-defined estimates based on real-time pool utilization.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-600 text-[11px] flex items-center justify-center gap-2 flex-wrap">
          <span>&copy; {new Date().getFullYear()} BotLend Protocol.</span>
          <span>•</span>
          <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-400 transition">
            <BotChainLogo className="w-3 h-3" size={12} />
            <span>BOT Chain Website</span>
          </a>
          <span>•</span>
          <a href="https://scan.botchain.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-400 transition">
            <BotChainLogo className="w-3 h-3" size={12} />
            <span>BOT Chain Explorer</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

