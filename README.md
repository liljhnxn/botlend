# BotLend — Decentralized Lending & Borrowing Protocol

> Overcollateralized decentralized lending and borrowing protocol architected natively for the **Botchain** ecosystem.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)](https://hardhat.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Network](https://img.shields.io/badge/Network-BOT%20Chain%20Mainnet%20(677)-00f0ff)](https://scan.botchain.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## 1. Product Overview

**BotLend** is a non-custodial, overcollateralized lending and borrowing protocol built on Botchain. Suppliers deposit BOT liquidity to earn continuous borrowing interest, while borrowers deposit collateral to take out loans within predefined risk and loan-to-value (LTV) limits.

The protocol uses on-chain smart contracts as the single source of truth for all accounting, interest accrual, solvency calculations, and liquidations.

### Key Capabilities
- **Supply BOT Liquidity**: Deposit tokens into the liquidity pool and earn dynamic variable interest based on pool utilization.
- **Withdraw Liquidity**: Withdraw supplied funds at any time, constrained only by pool solvency and active borrower debt.
- **Deposit & Withdraw Collateral**: Post BOT as collateral to unlock borrowing power up to 70% Max LTV.
- **Borrow BOT**: Take out loans against collateral, backed by real-time on-chain health factor monitoring.
- **Repay Loans**: Perform partial repayments or settle 100% of outstanding debt in a single transaction (`repayAll`).
- **Health Factor Monitoring**: Live position health indicators: **Healthy** (HF &ge; 1.2), **Warning** (1.0 &le; HF &lt; 1.2), and **Liquidatable** (HF &lt; 1.0).
- **Automated Liquidations**: Anyone can liquidate undercollateralized loans, repaying debt in exchange for seized collateral plus an on-chain liquidation bonus (5%).
- **Protocol Reserves**: A portion of borrow interest accrues to protocol fee reserves, managed through OpenZeppelin `AccessControl`.
- **BotOracle Integration**: Freshness-verified price feeds rejecting stale data, zero prices, and future timestamps.

---

## 2. DeFi Model & Mathematical Specifications

BotLend operates on an **overcollateralized lending model** with fixed-point integer mathematics:

$$\text{Precision} = 10^{18} \quad (\text{1e18})$$
$$\text{Basis Points Divisor} = 10,000 \quad (100\%)$$

### Initial Risk Parameters
| Parameter | Value (BPS) | Percentage | Description |
| :--- | :--- | :--- | :--- |
| **Max LTV** | `7,000` | **70%** | Maximum borrow capacity relative to deposited collateral |
| **Liquidation Threshold** | `7,500` | **75%** | Threshold where a loan position enters liquidatable status |
| **Liquidation Bonus** | `500` | **5%** | Incentive bonus seized by liquidators upon debt repayment |
| **Reserve Factor** | `1,000` | **10%** | Percentage of accrued borrowing interest allocated to protocol reserves |

### Health Factor
$$\text{Health Factor} = \frac{\text{Collateral Value} \times \text{Liquidation Threshold}}{\text{Debt Value}}$$

- If $\text{Debt} = 0$, $\text{Health Factor} = \infty$ (`type(uint256).max`).
- If $\text{Health Factor} \ge 1.0 \times 10^{18}$, the position is solvent.
- If $\text{Health Factor} < 1.0 \times 10^{18}$, the position can be liquidated.

### Utilization & Interest Rate Model
$$\text{Utilization } (U) = \frac{\text{Total Borrowed}}{\text{Total Supplied}}$$

$$\text{Borrow APY} = \text{Base Rate} + (U \times \text{Slope Rate})$$

$$\text{Supply APY} = \text{Borrow APY} \times U \times (1 - \text{Reserve Factor})$$

- **Base Borrow Rate**: 2.00% APY
- **Slope Borrow Rate**: 18.00% APY

### Timestamp-Based Accrual Engine
Interest compounds continuously using a cumulative global index (`borrowIndex`):
$$\text{Interest Factor} = \frac{\text{Borrow Rate} \times \Delta t}{\text{Seconds Per Year}}$$
$$\text{Interest Accrued} = \text{Total Borrowed} \times \text{Interest Factor}$$
$$\text{borrowIndex}_{\text{new}} = \text{borrowIndex}_{\text{old}} \times (1 + \text{Interest Factor})$$

---

## 3. Project Structure

```
botlend/
├── app/
│   └── frontend/                   # Next.js 14 Web3 dApp
│       ├── app/
│       │   ├── layout.tsx          # Root Web3 provider layout
│       │   ├── page.tsx            # Dashboard & protocol overview
│       │   ├── markets/page.tsx    # Markets & rate breakdown
│       │   ├── supply/page.tsx     # Supply & withdraw interface
│       │   ├── borrow/page.tsx     # Collateral deposit & borrowing
│       │   ├── position/page.tsx   # User position & liquidation price
│       │   ├── liquidations/page.tsx # Active liquidation opportunities
│       │   ├── activity/page.tsx   # Blockchain event feed
│       │   ├── admin/page.tsx      # Admin governance & parameter controls
│       │   └── developer/page.tsx  # Developer guide & Solidity snippets
│       ├── components/             # Reusable UI components
│       ├── hooks/                  # On-chain read & write hooks
│       ├── lib/                    # Contracts, ABIs, BotNS & formatters
│       ├── providers/              # Wagmi & TanStack Query providers
│       └── types/                  # TypeScript interface definitions
│
├── contracts/
│   ├── BotLend.sol                 # Core lending & liquidation protocol
│   ├── BotLendToken.sol            # OpenZeppelin ERC20 test token (BLBOT)
│   ├── interfaces/
│   │   └── IBotOracle.sol          # BotOracle standard feed interface
│   └── mocks/
│       └── MockBotOracle.sol       # Controllable mock oracle for testing
│
├── scripts/
│   ├── deploy.ts                   # Protocol deployment script
│   └── configure.ts                # Verification & parameter inspection script
│
├── test/
│   └── BotLend.test.ts             # Comprehensive 37-test Hardhat suite
│
├── deployments/
│   └── README.md                   # Network registry and address documentation
│
├── hardhat.config.ts               # Hardhat configuration (Chain ID 677)
├── package.json                    # Root workspace package.json
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment variable template
└── README.md                       # Complete documentation
```

---

## 4. Smart Contract Architecture

### `BotLend.sol`
- **Inherits**: `AccessControl`, `ReentrancyGuard`, `Pausable`
- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Reserve withdrawals and role management.
  - `RISK_MANAGER_ROLE`: Adjustment of LTV, thresholds, bonuses, and interest models.
  - `ORACLE_MANAGER_ROLE`: Oracle address, feed ID, and max age configuration.
  - `PAUSER_ROLE`: Emergency pause/unpause.
- **Safety Mechanisms**:
  - `nonReentrant` on all state-mutating external functions.
  - Checks-Effects-Interactions pattern.
  - Collateral cannot be withdrawn if health factor would fall below threshold.
  - Repayment remains enabled even during an emergency pause to protect borrowers.
  - Oracle staleness rejection (`block.timestamp - updatedAt <= maxOracleAge`).

### `BotLendToken.sol`
- ERC20 test token (`BotLend BOT`, symbol: `BLBOT`) with 18 decimals.
- Built-in public `faucet()` providing 1,000 BLBOT per request for testing.
- *Notice*: The protocol can be configured to any standard ERC20 on Botchain.

### `IBotOracle.sol` & `MockBotOracle.sol`
- Feed interface querying `getLatestAnswer(feedId)`.
- Rejects non-positive prices, future timestamps, and stale updates.

---

## 5. BOT Chain Mainnet Configuration

| Property | Value |
| :--- | :--- |
| **Network Name** | BOT Chain Mainnet |
| **Chain ID** | `677` |
| **RPC Endpoint** | `https://rpc.botchain.ai` |
| **Block Explorer** | `https://scan.botchain.ai` |
| **Native Gas Token** | BOT |

---

## 6. Installation & Quickstart

### Prerequisites
- Node.js &ge; 18.0.0
- npm &ge; 9.0.0

### Step 1: Install Dependencies
```bash
# Install root Hardhat dependencies
npm install

# Install frontend dependencies
npm run frontend:install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your deployer private key and deployed contract addresses:
```env
NEXT_PUBLIC_BOTCHAIN_CHAIN_ID=677
NEXT_PUBLIC_BOTCHAIN_RPC_URL=https://rpc.botchain.ai
NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL=https://scan.botchain.ai
NEXT_PUBLIC_BOTLEND_CONTRACT_ADDRESS=0x7D097D3C1C56Fb555F76f7C57E84543CAeB6674a
NEXT_PUBLIC_BOT_TOKEN_ADDRESS=0xD5452816194a3784dBa983426cCe7c122F4abd30
NEXT_PUBLIC_BOTORACLE_CONTRACT_ADDRESS=0xb7Ca90c5d60B86CF08B4BE94c973EcCCa4D2f844
NEXT_PUBLIC_BOTORACLE_FEED_ID=1
BOTCHAIN_RPC_URL=https://rpc.botchain.ai
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### Step 3: Compile Smart Contracts
```bash
npx hardhat compile
```

### Step 4: Run Test Suite
```bash
npx hardhat test
```
*Result*: 37 passing unit & integration tests covering deployment, supply, withdrawal limits, collateral insolvency protection, borrowing, partial and full repayments, interest accrual, liquidations, oracle stale/invalid guards, access control, and emergency pause.

### Step 5: Deploy Smart Contracts

**Local Deployment:**
```bash
npm run deploy:local
```

**BOT Chain Mainnet Deployment:**
```bash
npm run deploy:mainnet
```

### Step 6: Launch Frontend dApp
```bash
npm run frontend:dev
```
Open [http://localhost:3000](http://localhost:3000) to interact with the BotLend dApp.

### Step 7: Build for Production
```bash
npm run frontend:build
```

---

## 7. Frontend Pages Overview

1. **Dashboard (`/`)**: Aggregated protocol metrics, user account solvency, dynamic pool utilization visualizer, and recent on-chain events.
2. **Markets (`/markets`)**: Overview of active assets, supply/borrow APYs, utilization rates, and risk parameters.
3. **Supply Liquidity (`/supply`)**: Deposit BOT to earn interest, one-click token approval, and liquidity withdrawal.
4. **Borrow & Collateral (`/borrow`)**: Collateral management (deposit/withdraw), borrow execution within LTV limits, and loan repayment with `repayAll`.
5. **Position (`/position`)**: User position dashboard with status badges (**Healthy**, **Warning**, **Liquidatable**), liquidation price, and borrow capacity.
6. **Liquidations (`/liquidations`)**: Scans on-chain loan positions and presents liquidatable borrowers with a 1-click liquidation execution modal.
7. **Activity (`/activity`)**: Blockchain event indexer filtering `Supply`, `Borrow`, `Repay`, `CollateralDeposited`, and `Liquidation` logs with BotScan explorer links.
8. **Admin Governance (`/admin`)**: Role-guarded dashboard allowing authorized administrators to adjust LTV, thresholds, interest models, oracle feeds, and emergency pause status.
9. **Developer Integration (`/developer`)**: Solidity interfaces, contract address registry, code snippets, and BotOracle ecosystem documentation.

---

## 8. Important Limitations & Risk Disclosures

> [!WARNING]
> - **MVP Implementation**: BotLend is an MVP demonstration protocol designed for testing and development.
> - **Not Audited**: These contracts have not undergone a formal third-party security audit. Do not deploy to production with real capital without an independent audit.
> - **Overcollateralized Nature**: The protocol requires borrowers to maintain collateral exceeding their loan value. Severe market volatility or oracle latency may trigger automated liquidations.
> - **Oracle Dependency**: The protocol relies on BotOracle feeds. If oracle prices become stale or unavailable, price-sensitive operations (`borrow`, `withdrawCollateral`, `liquidate`) are automatically rejected to protect the protocol.
> - **No Guaranteed Yields**: Displayed APYs are variable estimates derived from current pool utilization, not guaranteed returns.

---

## 9. Future Roadmap

- [ ] Multi-asset collateral support (allowing diverse Botchain tokens as collateral).
- [ ] Integration with BotNS (`resolveIdentity`) for human-readable `.bot` domains.
- [ ] Flash loan functionality for arbitrageurs and liquidators.
- [ ] Advanced kinked interest rate model (jump rate at high utilization).
- [ ] Formal verification and third-party security audit.
