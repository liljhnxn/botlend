"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, ExternalLink, Terminal, BookOpen } from "lucide-react";
import { CONTRACT_CONFIG } from "../../lib/contracts";

export default function DeveloperPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const solidityIntegrationCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBotLend {
    function getUserAccount(address user) external view returns (
        uint256 supplied,
        uint256 collateral,
        uint256 debt,
        uint256 healthFactor,
        uint256 maxBorrow
    );

    function getHealthFactor(address user) external view returns (uint256);
    function getDebt(address user) external view returns (uint256);
    function getMaxBorrow(address user) external view returns (uint256);
    function getSuppliedBalance(address user) external view returns (uint256);
    function getCollateralBalance(address user) external view returns (uint256);
    function getAvailableLiquidity() external view returns (uint256);

    function supply(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function depositCollateral(uint256 amount) external;
    function withdrawCollateral(uint256 amount) external;
    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
}

contract BotLendIntegration {
    IBotLend public immutable botLend;

    constructor(address _botLend) {
        botLend = IBotLend(_botLend);
    }

    /// @notice Check if a borrower can safely take more debt
    function checkSolvency(address borrower) external view returns (bool isHealthy, uint256 maxAdditionalBorrow) {
        uint256 hf = botLend.getHealthFactor(borrower);
        // 1e18 = 1.0 Health Factor
        isHealthy = hf >= 1e18;
        maxAdditionalBorrow = botLend.getMaxBorrow(borrower);
    }
}`;

  const botOracleCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBotOracle {
    function getLatestAnswer(uint256 feedId) external view returns (
        int256 answer,
        uint256 updatedAt,
        uint256 roundId
    );
}

// BotLend evaluates collateral freshness directly:
// require(answer > 0, "Oracle price must be positive");
// require(block.timestamp - updatedAt <= maxOracleAge, "Oracle price is stale");`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Developer Integration Guide</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Build decentralized applications, liquidation bots, and automated vaults integrated with the BotLend protocol.
        </p>
      </div>

      {/* Contract Registry Section */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Verified Contract Addresses</span>
        </h2>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">BotLend Core Protocol:</span>
              <span className="text-white font-bold">{CONTRACT_CONFIG.botLendAddress || "Configured via .env"}</span>
            </div>
            <button
              onClick={() => copyToClipboard(CONTRACT_CONFIG.botLendAddress, "botlend")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {copiedKey === "botlend" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">BOT Token (BLBOT):</span>
              <span className="text-white font-bold">{CONTRACT_CONFIG.botTokenAddress || "Configured via .env"}</span>
            </div>
            <button
              onClick={() => copyToClipboard(CONTRACT_CONFIG.botTokenAddress, "token")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {copiedKey === "token" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-sans block text-[11px]">BotOracle Feed Contract:</span>
              <span className="text-white font-bold">{CONTRACT_CONFIG.oracleAddress || "Configured via .env"}</span>
            </div>
            <button
              onClick={() => copyToClipboard(CONTRACT_CONFIG.oracleAddress, "oracle")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {copiedKey === "oracle" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Solidity Integration Snippet */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Solidity Interface & Integration</span>
          </h2>
          <button
            onClick={() => copyToClipboard(solidityIntegrationCode, "solidity")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
          >
            {copiedKey === "solidity" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Interface</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#080c14] border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
          {solidityIntegrationCode}
        </pre>
      </div>

      {/* BotOracle Relationship */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>BotOracle Ecosystem Relationship</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          BotLend integrates natively with BotOracle feeds. Collateral valuation is safeguarded against stale prices
          using configurable max age checks (<code className="text-cyan-400">maxOracleAge</code>). If an oracle
          update is older than the configured threshold or returns a non-positive value, borrowing and liquidation
          actions revert automatically to preserve protocol solvency.
        </p>
        <pre className="p-4 rounded-xl bg-[#080c14] border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {botOracleCode}
        </pre>
      </div>
    </div>
  );
}
