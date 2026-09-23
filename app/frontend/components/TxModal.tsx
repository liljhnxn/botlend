"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, X } from "lucide-react";
import { getExplorerTxUrl } from "../lib/utils";

export type TxStatus = "idle" | "awaiting_wallet" | "pending" | "success" | "error";

interface TxModalProps {
  isOpen: boolean;
  status: TxStatus;
  txHash?: string;
  actionTitle: string;
  errorMessage?: string;
  onClose: () => void;
}

export function TxModal({
  isOpen,
  status,
  txHash,
  actionTitle,
  errorMessage,
  onClose,
}: TxModalProps) {
  if (!isOpen || status === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl text-white">
        <button
          onClick={onClose}
          disabled={status === "awaiting_wallet" || status === "pending"}
          className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {status === "awaiting_wallet" && (
            <>
              <div className="w-16 h-16 mb-4 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm in Wallet</h3>
              <p className="text-sm text-slate-400 mb-6">
                Please approve the <span className="text-cyan-400 font-medium">{actionTitle}</span> transaction in your Web3 wallet.
              </p>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="w-16 h-16 mb-4 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Transaction Pending</h3>
              <p className="text-sm text-slate-400 mb-4">
                Broadcasting to Botchain network and awaiting block confirmation...
              </p>
              {txHash && (
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4 mb-4"
                >
                  View on BohrScan <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mb-4 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Transaction Confirmed</h3>
              <p className="text-sm text-slate-400 mb-4">
                Your <span className="text-emerald-400 font-medium">{actionTitle}</span> has been confirmed on-chain.
              </p>
              {txHash && (
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-900/40 transition mb-6"
                >
                  View on BohrScan Explorer <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-medium text-white transition shadow-lg shadow-cyan-500/20"
              >
                Close
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mb-4 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Transaction Failed</h3>
              <div className="w-full max-h-36 overflow-y-auto p-3 mb-6 bg-slate-900/80 rounded-xl border border-rose-900/30 text-xs text-rose-300 font-mono text-left break-words">
                {errorMessage || "Transaction was rejected or reverted by on-chain guard checks."}
              </div>
              {txHash && (
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 underline underline-offset-4 mb-4"
                >
                  View on BohrScan Explorer <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-white transition"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
