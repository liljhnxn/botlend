import { defineChain } from "viem";

export const botchainMainnet = defineChain({
  id: 677,
  name: "BOT Chain Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotScan",
      url: process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.botchain.ai",
    },
  },
});

export const activeChain = botchainMainnet;

export const localhostChain = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
});

export const CONTRACT_CONFIG = {
  botLendAddress: (process.env.NEXT_PUBLIC_BOTLEND_CONTRACT_ADDRESS || "") as `0x${string}`,
  botTokenAddress: (process.env.NEXT_PUBLIC_BOT_TOKEN_ADDRESS || "") as `0x${string}`,
  oracleAddress: (process.env.NEXT_PUBLIC_BOTORACLE_CONTRACT_ADDRESS || "") as `0x${string}`,
  oracleFeedId: BigInt(process.env.NEXT_PUBLIC_BOTORACLE_FEED_ID || "1"),
};

export const BOTLEND_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_botToken", type: "address" },
      { name: "_oracle", type: "address" },
      { name: "_oracleFeedId", type: "uint256" },
      { name: "_maxOracleAge", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "supply",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositCollateral",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawCollateral",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "borrow",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repayAll",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "liquidate",
    inputs: [
      { name: "borrower", type: "address" },
      { name: "debtAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawReserves",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setRiskParameters",
    inputs: [
      { name: "_maxLTV", type: "uint256" },
      { name: "_liquidationThreshold", type: "uint256" },
      { name: "_liquidationBonus", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setInterestParameters",
    inputs: [
      { name: "_baseBorrowRate", type: "uint256" },
      { name: "_slopeBorrowRate", type: "uint256" },
      { name: "_reserveFactor", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setOracleConfig",
    inputs: [
      { name: "_oracle", type: "address" },
      { name: "_feedId", type: "uint256" },
      { name: "_maxOracleAge", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserAccount",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "supplied", type: "uint256" },
      { name: "collateral", type: "uint256" },
      { name: "debt", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
      { name: "maxBorrow", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSuppliedBalance",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCollateralBalance",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDebt",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAccruedInterest",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getHealthFactor",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMaxBorrow",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAvailableLiquidity",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUtilizationRate",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBorrowRate",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSupplyRate",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReserves",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProtocolStats",
    inputs: [],
    outputs: [
      { name: "_totalSupplied", type: "uint256" },
      { name: "_totalBorrowed", type: "uint256" },
      { name: "_availableLiquidity", type: "uint256" },
      { name: "_utilizationRate", type: "uint256" },
      { name: "_supplyRate", type: "uint256" },
      { name: "_borrowRate", type: "uint256" },
      { name: "_reserves", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRiskParameters",
    inputs: [],
    outputs: [
      { name: "_maxLTV", type: "uint256" },
      { name: "_liquidationThreshold", type: "uint256" },
      { name: "_liquidationBonus", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInterestParameters",
    inputs: [],
    outputs: [
      { name: "_baseBorrowRate", type: "uint256" },
      { name: "_slopeBorrowRate", type: "uint256" },
      { name: "_reserveFactor", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOracleConfig",
    inputs: [],
    outputs: [
      { name: "_oracle", type: "address" },
      { name: "_feedId", type: "uint256" },
      { name: "_maxOracleAge", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasRole",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "RISK_MANAGER_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PAUSER_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "Supply",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Borrow",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Repay",
    inputs: [
      { name: "borrower", type: "address", indexed: true },
      { name: "repayer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "debtRemaining", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CollateralDeposited",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CollateralWithdrawn",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Liquidation",
    inputs: [
      { name: "liquidator", type: "address", indexed: true },
      { name: "borrower", type: "address", indexed: true },
      { name: "debtRepaid", type: "uint256", indexed: false },
      { name: "collateralSeized", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "faucet",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

export const ORACLE_ABI = [
  {
    type: "function",
    name: "getLatestAnswer",
    inputs: [{ name: "feedId", type: "uint256" }],
    outputs: [
      { name: "answer", type: "int256" },
      { name: "updatedAt", type: "uint256" },
      { name: "roundId", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setAnswer",
    inputs: [
      { name: "feedId", type: "uint256" },
      { name: "answer", type: "int256" },
      { name: "updatedAt", type: "uint256" },
      { name: "roundId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
