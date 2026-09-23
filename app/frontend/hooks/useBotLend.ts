"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_CONFIG, BOTLEND_ABI, ERC20_ABI, ORACLE_ABI } from "../lib/contracts";

export function useBotLend() {
  const { address } = useAccount();
  const botLendAddress = CONTRACT_CONFIG.botLendAddress;
  const botTokenAddress = CONTRACT_CONFIG.botTokenAddress;
  const oracleAddress = CONTRACT_CONFIG.oracleAddress;
  const feedId = CONTRACT_CONFIG.oracleFeedId;

  // 1. Read Protocol Stats
  const {
    data: protocolStatsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "getProtocolStats",
    query: {
      enabled: Boolean(botLendAddress && botLendAddress !== "0x"),
      refetchInterval: 10000,
    },
  });

  // 2. Read User Account Details
  const {
    data: userAccountData,
    isLoading: isAccountLoading,
    refetch: refetchUserAccount,
  } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "getUserAccount",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(botLendAddress && botLendAddress !== "0x" && address),
      refetchInterval: 10000,
    },
  });

  // 3. Read Risk Parameters
  const { data: riskParamsData, refetch: refetchRiskParams } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "getRiskParameters",
    query: { enabled: Boolean(botLendAddress && botLendAddress !== "0x") },
  });

  // 4. Read Interest Parameters
  const { data: interestParamsData, refetch: refetchInterestParams } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "getInterestParameters",
    query: { enabled: Boolean(botLendAddress && botLendAddress !== "0x") },
  });

  // 5. Read Oracle Config
  const { data: oracleConfigData, refetch: refetchOracleConfig } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "getOracleConfig",
    query: { enabled: Boolean(botLendAddress && botLendAddress !== "0x") },
  });

  // 6. Read Oracle Feed Answer
  const { data: oracleFeedData } = useReadContract({
    address: oracleAddress,
    abi: ORACLE_ABI,
    functionName: "getLatestAnswer",
    args: [feedId],
    query: { enabled: Boolean(oracleAddress && oracleAddress !== "0x") },
  });

  // 7. Read Protocol Pause Status
  const { data: isPausedData, refetch: refetchPause } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "paused",
    query: { enabled: Boolean(botLendAddress && botLendAddress !== "0x") },
  });

  // 8. Read User Wallet Token Balance
  const {
    data: tokenBalanceData,
    isLoading: isBalanceLoading,
    refetch: refetchTokenBalance,
  } = useReadContract({
    address: botTokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(botTokenAddress && botTokenAddress !== "0x" && address),
      refetchInterval: 10000,
    },
  });

  // 9. Read User Token Allowance for BotLend
  const {
    data: tokenAllowanceData,
    isLoading: isAllowanceLoading,
    refetch: refetchTokenAllowance,
  } = useReadContract({
    address: botTokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && botLendAddress ? [address, botLendAddress] : undefined,
    query: {
      enabled: Boolean(botTokenAddress && botTokenAddress !== "0x" && address && botLendAddress),
      refetchInterval: 10000,
    },
  });

  // 10. Check Admin Roles for connected user
  const adminRoleHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const { data: isAdminData } = useReadContract({
    address: botLendAddress,
    abi: BOTLEND_ABI,
    functionName: "hasRole",
    args: address ? [adminRoleHash, address] : undefined,
    query: { enabled: Boolean(botLendAddress && botLendAddress !== "0x" && address) },
  });

  // Parse values cleanly
  const statsTuple = protocolStatsData as any;
  const protocolStats = statsTuple
    ? {
        totalSupplied: BigInt(statsTuple[0] ?? 0),
        totalBorrowed: BigInt(statsTuple[1] ?? 0),
        availableLiquidity: BigInt(statsTuple[2] ?? 0),
        utilizationRate: BigInt(statsTuple[3] ?? 0),
        supplyRate: BigInt(statsTuple[4] ?? 0),
        borrowRate: BigInt(statsTuple[5] ?? 0),
        reserves: BigInt(statsTuple[6] ?? 0),
      }
    : null;

  const accountTuple = userAccountData as any;
  const userAccount = accountTuple
    ? {
        supplied: BigInt(accountTuple[0] ?? 0),
        collateral: BigInt(accountTuple[1] ?? 0),
        debt: BigInt(accountTuple[2] ?? 0),
        healthFactor: BigInt(accountTuple[3] ?? 0),
        maxBorrow: BigInt(accountTuple[4] ?? 0),
      }
    : null;

  const riskTuple = riskParamsData as any;
  const riskParameters = riskTuple
    ? {
        maxLTV: BigInt(riskTuple[0] ?? 0),
        liquidationThreshold: BigInt(riskTuple[1] ?? 0),
        liquidationBonus: BigInt(riskTuple[2] ?? 0),
      }
    : null;

  const interestTuple = interestParamsData as any;
  const interestParameters = interestTuple
    ? {
        baseBorrowRate: BigInt(interestTuple[0] ?? 0),
        slopeBorrowRate: BigInt(interestTuple[1] ?? 0),
        reserveFactor: BigInt(interestTuple[2] ?? 0),
      }
    : null;

  const oracleTuple = oracleConfigData as any;
  const feedTuple = oracleFeedData as any;
  const oracleConfig = oracleTuple
    ? {
        oracleAddress: (oracleTuple[0] ?? "") as string,
        feedId: BigInt(oracleTuple[1] ?? 0),
        maxOracleAge: BigInt(oracleTuple[2] ?? 0),
        latestPrice: feedTuple ? BigInt(feedTuple[0] ?? 0) : 0n,
        updatedAt: feedTuple ? BigInt(feedTuple[1] ?? 0) : 0n,
      }
    : null;

  const refetchAll = () => {
    refetchStats();
    refetchUserAccount();
    refetchTokenBalance();
    refetchTokenAllowance();
    refetchPause();
  };

  return {
    protocolStats,
    userAccount,
    riskParameters,
    interestParameters,
    oracleConfig,
    isPaused: Boolean(isPausedData),
    tokenBalance: tokenBalanceData ?? 0n,
    tokenAllowance: tokenAllowanceData ?? 0n,
    isAdmin: Boolean(isAdminData),
    isLoading: isStatsLoading || isAccountLoading || isBalanceLoading,
    refetchAll,
  };
}
