"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { botchainTestnet, CONTRACT_CONFIG } from "../lib/contracts";
import { ProtocolActivityItem } from "../types";

export function useEvents() {
  const [events, setEvents] = useState<ProtocolActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      if (!CONTRACT_CONFIG.botLendAddress || CONTRACT_CONFIG.botLendAddress === "0x") {
        return;
      }

      setIsLoading(true);
      try {
        const client = createPublicClient({
          chain: botchainTestnet,
          transport: http(process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.bohr.life"),
        });

        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        // Query all protocol events in parallel
        const [
          supplyLogs,
          withdrawLogs,
          collateralDepositLogs,
          collateralWithdrawLogs,
          borrowLogs,
          repayLogs,
          liquidationLogs,
        ] = await Promise.all([
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem("event Supply(address indexed user, uint256 amount)"),
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem("event Withdraw(address indexed user, uint256 amount)"),
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem("event CollateralDeposited(address indexed user, uint256 amount)"),
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem("event CollateralWithdrawn(address indexed user, uint256 amount)"),
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem("event Borrow(address indexed user, uint256 amount)"),
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem(
              "event Repay(address indexed borrower, address indexed repayer, uint256 amount, uint256 debtRemaining)"
            ),
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_CONFIG.botLendAddress,
            event: parseAbiItem(
              "event Liquidation(address indexed liquidator, address indexed borrower, uint256 debtRepaid, uint256 collateralSeized)"
            ),
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        const allItems: ProtocolActivityItem[] = [];

        supplyLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "Supply",
            user: log.args.user || "",
            amount: log.args.amount || 0n,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        withdrawLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "Withdraw",
            user: log.args.user || "",
            amount: log.args.amount || 0n,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        collateralDepositLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "CollateralDeposited",
            user: log.args.user || "",
            amount: log.args.amount || 0n,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        collateralWithdrawLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "CollateralWithdrawn",
            user: log.args.user || "",
            amount: log.args.amount || 0n,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        borrowLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "Borrow",
            user: log.args.user || "",
            amount: log.args.amount || 0n,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        repayLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "Repay",
            user: log.args.borrower || "",
            amount: log.args.amount || 0n,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        liquidationLogs.forEach((log) => {
          allItems.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "Liquidation",
            user: log.args.borrower || "",
            amount: log.args.debtRepaid || 0n,
            extra: `Seized: ${log.args.collateralSeized?.toString()}`,
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          });
        });

        allItems.sort((a, b) => b.blockNumber - a.blockNumber);

        if (isMounted) {
          setEvents(allItems);
        }
      } catch (err) {
        console.warn("Could not query on-chain logs:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { events, isLoading };
}
