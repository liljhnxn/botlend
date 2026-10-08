# BotLend Deployments & Network Registry

This directory contains records of deployments across various networks.

## Deployment Files
- `botchainMainnet.json`: Deployment on BOT Chain Mainnet (Chain ID `677`, RPC: `https://rpc.botchain.ai`, Explorer: `https://scan.botchain.ai`).
- `hardhat.json` / `localhost.json`: Deployment on local development nodes.

## Structure
Each deployment file contains:
- `network`: Target network name
- `chainId`: EVM chain identifier
- `timestamp`: ISO timestamp of deployment
- `deployer`: Address of deploying account
- `contracts`:
  - `BotLend`: Core protocol address
  - `BotToken`: Underlying test token address (BLBOT)
  - `BotOracle`: Price feed oracle address
  - `OracleFeedId`: Assigned feed index
  - `MaxOracleAgeSeconds`: Staleness threshold
- `riskParameters`: Initial LTV, threshold, and bonus
- `interestParameters`: Base and slope borrow APYs
- `explorerUrl`: Block explorer base URL
