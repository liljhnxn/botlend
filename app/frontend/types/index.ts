export interface ProtocolStats {
  totalSupplied: bigint;
  totalBorrowed: bigint;
  availableLiquidity: bigint;
  utilizationRate: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
  reserves: bigint;
}

export interface UserAccount {
  supplied: bigint;
  collateral: bigint;
  debt: bigint;
  healthFactor: bigint;
  maxBorrow: bigint;
}

export interface RiskParameters {
  maxLTV: bigint; // BPS
  liquidationThreshold: bigint; // BPS
  liquidationBonus: bigint; // BPS
}

export interface InterestParameters {
  baseBorrowRate: bigint; // 1e18
  slopeBorrowRate: bigint; // 1e18
  reserveFactor: bigint; // BPS
}

export interface OracleConfig {
  oracleAddress: string;
  feedId: bigint;
  maxOracleAge: bigint;
  latestPrice: bigint;
  updatedAt: bigint;
}

export interface LiquidatablePosition {
  borrower: string;
  collateral: bigint;
  debt: bigint;
  healthFactor: bigint;
  maxLiquidationAmount: bigint;
  estimatedCollateralReceived: bigint;
}

export interface ProtocolActivityItem {
  id: string;
  type: "Supply" | "Withdraw" | "Borrow" | "Repay" | "CollateralDeposited" | "CollateralWithdrawn" | "Liquidation";
  user: string;
  amount: bigint;
  extra?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp?: number;
}
