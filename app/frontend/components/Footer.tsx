"use client";

import React from "react";
import Link from "next/link";
import { Coins, ExternalLink, ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#060910] text-slate-400 text-xs py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">BotLend</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Decentralized, overcollateralized lending & borrowing protocol built natively for the Botchain ecosystem.
            </p>
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

          {/* Col 3: Network & Resources */}
          <div>
            <h4 className="text-white font-semibold mb-3">Botchain Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://scan.bohr.life"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-400 transition"
                >
                  BohrScan Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://rpc.bohr.life"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-400 transition"
                >
                  Botchain RPC <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><Link href="/developer" className="hover:text-cyan-400 transition">Developer Integration</Link></li>
              <li><Link href="/admin" className="hover:text-cyan-400 transition">Admin Governance</Link></li>
            </ul>
          </div>

          {/* Col 4: Network Specs */}
          <div className="space-y-2 text-slate-500">
            <h4 className="text-white font-semibold mb-3">Network Specs</h4>
            <p><span className="text-slate-400">Network:</span> Botchain Testnet</p>
            <p><span className="text-slate-400">Chain ID:</span> 968</p>
            <p><span className="text-slate-400">Gas Token:</span> BOT</p>
            <p><span className="text-slate-400">Oracle:</span> BotOracle Feed v1</p>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-slate-400">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-300">Important Disclaimer & Risk Disclosure:</p>
            <p>
              BotLend is an MVP demonstration protocol designed for testing and development. It has not been formally audited by independent security firms.
              Do not deposit funds you cannot afford to lose. Interest rates and APYs are protocol-defined estimates based on real-time pool utilization,
              not guaranteed yields. All collateral valuations rely on on-chain oracle price feeds, and undercollateralized positions are subject to automated liquidation.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-600 text-[11px]">
          &copy; {new Date().getFullYear()} BotLend Protocol. Source code verified and open-source.
        </div>
      </div>
    </footer>
  );
}
