"use client";

import React, { useState, useEffect } from "react";
import { parseUnits, formatUnits, createPublicClient, http } from "viem";
import { useAccount } from "wagmi";
import { ShieldAlert, AlertOctagon, CheckCircle2, Coins, ArrowRight, Loader2 } from "lucide-react";
import { useBotLend } from "../../hooks/useBotLend";
import { useBotLendActions } from "../../hooks/useBotLendActions";
import { useEvents } from "../../hooks/useEvents";
import { botchainMainnet, CONTRACT_CONFIG, BOTLEND_ABI } from "../../lib/contracts";
import { HealthFactorBadge } from "../../components/HealthFactorBadge";
import { TxModal } from "../../components/TxModal";
import { formatTokenAmount, shortenAddress } from "../../lib/utils";
import { LiquidatablePosition } from "../../types";

export default function LiquidationsPage() {
  const { isConnected } = useAccount();
  const { riskParameters, refetchAll } = useBotLend();
  const { events } = useEvents();
  const {
    txStatus,
    currentTxHash,
    actionTitle,
    errorMessage,
    resetTx,
    liquidatePosition,
  } = useBotLendActions(refetchAll);

  const [liquidatablePositions, setLiquidatablePositions] = useState<LiquidatablePosition[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<LiquidatablePosition | null>(null);
  const [repayAmountInput, setRepayAmountInput] = useState("");

  // Scan unique borrower addresses from blockchain events and query live on-chain health factor
  useEffect(() => {
    let isCancelled = false;

    async function scanBorrowers() {
      if (!CONTRACT_CONFIG.botLendAddress || CONTRACT_CONFIG.botLendAddress === "0x") return;

      setIsScanning(true);
      try {
        const client = createPublicClient({
          chain: botchainMainnet,
          transport: http(process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"),
        });

        // Extract unique borrower addresses from event logs
        const borrowerAddresses = Array.from(
          new Set(
            events
              .filter((e) => e.type === "Borrow")
              .map((e) => e.user.toLowerCase() as `0x${string}`)
          )
        );

        const unhealthyPositions: LiquidatablePosition[] = [];

        for (const borrower of borrowerAddresses) {
          try {
            const account = await client.readContract({
              address: CONTRACT_CONFIG.botLendAddress,
              abi: BOTLEND_ABI,
              functionName: "getUserAccount",
              args: [borrower],
            });

            const [supplied, collateral, debt, healthFactor] =
              account as readonly [bigint, bigint, bigint, bigint, bigint];

            // Health factor < 1.0 (1e18) means liquidatable
            if (debt > 0n && healthFactor < BigInt(10 ** 18)) {
              const bonusBps = riskParameters?.liquidationBonus ?? 500n;
              const estCollateral = (debt * (10000n + bonusBps)) / 10000n;

              unhealthyPositions.push({
                borrower,
                collateral,
                debt,
                healthFactor,
                maxLiquidationAmount: debt,
                estimatedCollateralReceived:
                  estCollateral > collateral ? collateral : estCollateral,
              });
            }
          } catch (readErr) {
            // Ignore single address read failures
          }
        }

        if (!isCancelled) {
          setLiquidatablePositions(unhealthyPositions);
        }
      } catch (err) {
        console.warn("Could not scan on-chain liquidations:", err);
      } finally {
        if (!isCancelled) {
          setIsScanning(false);
        }
      }
    }

    scanBorrowers();
  }, [events, riskParameters?.liquidationBonus]);

  const handleExecuteLiquidation = async () => {
    if (!selectedBorrower) return;
    const parsed =
      repayAmountInput && !isNaN(Number(repayAmountInput))
        ? parseUnits(repayAmountInput, 18)
        : selectedBorrower.debt;

    await liquidatePosition(selectedBorrower.borrower as `0x${string}`, parsed);
    setSelectedBorrower(null);
    setRepayAmountInput("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Liquidations Engine</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Monitor and liquidate unhealthy loans (Health Factor &lt; 1.0). Liquidators repay borrower debt in
          exchange for their collateral plus an on-chain liquidation bonus (
          {riskParameters ? `${Number(riskParameters.liquidationBonus) / 100}%` : "5%"}).
        </p>
      </div>

      {/* Main Container */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Liquidatable Positions</h2>
          </div>
          {isScanning && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning on-chain loans...</span>
            </div>
          )}
        </div>

        {liquidatablePositions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
            <h3 className="text-base font-bold text-white">No Liquidatable Positions</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All active loans currently maintain healthy collateralization levels (Health Factor &ge; 1.0).
              Undercollateralized positions will automatically surface here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-sans">
                <tr>
                  <th className="pb-3">Borrower</th>
                  <th className="pb-3">Health Factor</th>
                  <th className="pb-3">Collateral</th>
                  <th className="pb-3">Debt to Repay</th>
                  <th className="pb-3">Est. Collateral Seized</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {liquidatablePositions.map((pos) => (
                  <tr key={pos.borrower} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 text-white font-bold">{shortenAddress(pos.borrower)}</td>
                    <td className="py-3">
                      <HealthFactorBadge healthFactor={pos.healthFactor} hasDebt={true} size="sm" />
                    </td>
                    <td className="py-3 text-slate-300">{formatTokenAmount(pos.collateral)} BOT</td>
                    <td className="py-3 text-rose-400 font-bold">{formatTokenAmount(pos.debt)} BOT</td>
                    <td className="py-3 text-emerald-400 font-bold">
                      {formatTokenAmount(pos.estimatedCollateralReceived)} BOT
                    </td>
                    <td className="py-3 text-right font-sans">
                      <button
                        onClick={() => {
                          setSelectedBorrower(pos);
                          setRepayAmountInput(formatUnits(pos.debt, 18));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 font-semibold text-white text-xs transition"
                      >
                        Liquidate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Liquidation Action Modal */}
      {selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl text-white space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <span>Liquidate Undercollateralized Loan</span>
            </h3>

            <div className="space-y-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Borrower Address:</span>
                <span className="font-mono text-white">{shortenAddress(selectedBorrower.borrower)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Borrower Debt:</span>
                <span className="font-bold text-rose-400">
                  {formatTokenAmount(selectedBorrower.debt)} BOT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Borrower Collateral:</span>
                <span className="font-semibold text-white">
                  {formatTokenAmount(selectedBorrower.collateral)} BOT
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Debt Amount to Repay (BOT):</label>
              <input
                type="number"
                value={repayAmountInput}
                onChange={(e) => setRepayAmountInput(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 focus:outline-none text-white font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBorrower(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteLiquidation}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition"
              >
                Execute Liquidation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Tx Modal */}
      <TxModal
        isOpen={txStatus !== "idle"}
        status={txStatus}
        txHash={currentTxHash}
        actionTitle={actionTitle}
        errorMessage={errorMessage}
        onClose={resetTx}
      />
    </div>
  );
}
