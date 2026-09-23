import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BotLend, BotLendToken, MockBotOracle } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BotLend Protocol Tests", function () {
  let botLend: BotLend;
  let botToken: BotLendToken;
  let oracle: MockBotOracle;

  let owner: HardhatEthersSigner;
  let supplier: HardhatEthersSigner;
  let borrower: HardhatEthersSigner;
  let liquidator: HardhatEthersSigner;
  let riskManager: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  const FEED_ID = 1;
  const MAX_ORACLE_AGE = 3600; // 1 hour
  const INITIAL_PRICE = ethers.parseUnits("1.0", 18); // 1 BOT = $1.00

  // 1000 BOT
  const ONE_THOUSAND = ethers.parseUnits("1000", 18);
  const TWO_THOUSAND = ethers.parseUnits("2000", 18);
  const FIVE_THOUSAND = ethers.parseUnits("5000", 18);
  const TEN_THOUSAND = ethers.parseUnits("10000", 18);

  beforeEach(async function () {
    [owner, supplier, borrower, liquidator, riskManager, user] = await ethers.getSigners();

    // 1. Deploy test token
    const BotLendTokenFactory = await ethers.getContractFactory("BotLendToken");
    botToken = await BotLendTokenFactory.deploy();
    await botToken.waitForDeployment();

    // 2. Deploy mock oracle
    const MockBotOracleFactory = await ethers.getContractFactory("MockBotOracle");
    oracle = await MockBotOracleFactory.deploy();
    await oracle.waitForDeployment();

    // Configure initial valid oracle price
    const latestTime = await time.latest();
    await oracle.setAnswer(FEED_ID, INITIAL_PRICE, latestTime, 1);

    // 3. Deploy BotLend protocol
    const BotLendFactory = await ethers.getContractFactory("BotLend");
    botLend = await BotLendFactory.deploy(
      await botToken.getAddress(),
      await oracle.getAddress(),
      FEED_ID,
      MAX_ORACLE_AGE
    );
    await botLend.waitForDeployment();

    // Fund test accounts with tokens and approvals
    for (const account of [supplier, borrower, liquidator, user]) {
      await botToken.connect(account).faucet(); // 1,000 BLBOT
      await botToken.mint(account.address, TEN_THOUSAND); // Additional tokens for testing
      await botToken.connect(account).approve(await botLend.getAddress(), ethers.MaxUint256);
    }
  });

  describe("1. Deployment & Protocol Configuration", function () {
    it("Should correctly set token, oracle, and initial parameters", async function () {
      expect(await botLend.botToken()).to.equal(await botToken.getAddress());
      expect(await botLend.oracle()).to.equal(await oracle.getAddress());
      expect(await botLend.oracleFeedId()).to.equal(FEED_ID);
      expect(await botLend.maxOracleAge()).to.equal(MAX_ORACLE_AGE);

      const [ltv, threshold, bonus] = await botLend.getRiskParameters();
      expect(ltv).to.equal(7000n); // 70%
      expect(threshold).to.equal(7500n); // 75%
      expect(bonus).to.equal(500n); // 5%

      const [baseRate, slopeRate, reserveFactor] = await botLend.getInterestParameters();
      expect(baseRate).to.equal(ethers.parseUnits("0.02", 18));
      expect(slopeRate).to.equal(ethers.parseUnits("0.18", 18));
      expect(reserveFactor).to.equal(1000n); // 10%
    });

    it("Should grant correct initial roles to deployer", async function () {
      const DEFAULT_ADMIN = await botLend.DEFAULT_ADMIN_ROLE();
      const RISK_ROLE = await botLend.RISK_MANAGER_ROLE();
      const ORACLE_ROLE = await botLend.ORACLE_MANAGER_ROLE();
      const PAUSER_ROLE = await botLend.PAUSER_ROLE();

      expect(await botLend.hasRole(DEFAULT_ADMIN, owner.address)).to.be.true;
      expect(await botLend.hasRole(RISK_ROLE, owner.address)).to.be.true;
      expect(await botLend.hasRole(ORACLE_ROLE, owner.address)).to.be.true;
      expect(await botLend.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });

    it("Should reject deployment with zero token address", async function () {
      const BotLendFactory = await ethers.getContractFactory("BotLend");
      await expect(
        BotLendFactory.deploy(ethers.ZeroAddress, await oracle.getAddress(), FEED_ID, MAX_ORACLE_AGE)
      ).to.be.revertedWith("Invalid token address");
    });
  });

  describe("2. Supply & Withdrawal", function () {
    it("Should allow user to supply tokens and increase totalSupplied and user balance", async function () {
      await expect(botLend.connect(supplier).supply(ONE_THOUSAND))
        .to.emit(botLend, "Supply")
        .withArgs(supplier.address, ONE_THOUSAND);

      expect(await botLend.totalSupplied()).to.equal(ONE_THOUSAND);
      expect(await botLend.getSuppliedBalance(supplier.address)).to.equal(ONE_THOUSAND);
      expect(await botLend.getAvailableLiquidity()).to.equal(ONE_THOUSAND);
    });

    it("Should revert supply with 0 amount", async function () {
      await expect(botLend.connect(supplier).supply(0)).to.be.revertedWith("Supply amount must be > 0");
    });

    it("Should allow user to withdraw supplied liquidity", async function () {
      await botLend.connect(supplier).supply(ONE_THOUSAND);
      const balanceBefore = await botToken.balanceOf(supplier.address);

      await expect(botLend.connect(supplier).withdraw(ethers.parseUnits("400", 18)))
        .to.emit(botLend, "Withdraw")
        .withArgs(supplier.address, ethers.parseUnits("400", 18));

      expect(await botLend.getSuppliedBalance(supplier.address)).to.equal(ethers.parseUnits("600", 18));
      expect(await botToken.balanceOf(supplier.address)).to.equal(balanceBefore + ethers.parseUnits("400", 18));
    });

    it("Should reject withdrawal exceeding user supplied balance", async function () {
      await botLend.connect(supplier).supply(ONE_THOUSAND);
      await expect(botLend.connect(supplier).withdraw(TWO_THOUSAND)).to.be.revertedWith(
        "Insufficient supplied balance"
      );
    });

    it("Should reject withdrawal exceeding available liquidity", async function () {
      // Supplier supplies 1,000 BOT
      await botLend.connect(supplier).supply(ONE_THOUSAND);

      // Borrower deposits 2,000 BOT collateral and borrows 800 BOT
      await botLend.connect(borrower).depositCollateral(TWO_THOUSAND);
      await botLend.connect(borrower).borrow(ethers.parseUnits("800", 18));

      // Available liquidity is now 200 BOT
      expect(await botLend.getAvailableLiquidity()).to.equal(ethers.parseUnits("200", 18));

      // Supplier attempts to withdraw 500 BOT (exceeds available liquidity 200 BOT)
      await expect(botLend.connect(supplier).withdraw(ethers.parseUnits("500", 18))).to.be.revertedWith(
        "Insufficient protocol liquidity"
      );
    });
  });

  describe("3. Collateral Management", function () {
    it("Should deposit collateral correctly", async function () {
      await expect(botLend.connect(borrower).depositCollateral(ONE_THOUSAND))
        .to.emit(botLend, "CollateralDeposited")
        .withArgs(borrower.address, ONE_THOUSAND);

      expect(await botLend.getCollateralBalance(borrower.address)).to.equal(ONE_THOUSAND);
      expect(await botLend.totalCollateral()).to.equal(ONE_THOUSAND);
    });

    it("Should allow withdrawing collateral when borrower has no debt", async function () {
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
      await expect(botLend.connect(borrower).withdrawCollateral(ethers.parseUnits("500", 18)))
        .to.emit(botLend, "CollateralWithdrawn")
        .withArgs(borrower.address, ethers.parseUnits("500", 18));

      expect(await botLend.getCollateralBalance(borrower.address)).to.equal(ethers.parseUnits("500", 18));
    });

    it("Should prevent collateral withdrawal that would violate max LTV", async function () {
      // Supply pool liquidity
      await botLend.connect(supplier).supply(FIVE_THOUSAND);

      // Borrower deposits 1,000 BOT collateral
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);

      // Borrow 700 BOT (exactly max LTV of 70%)
      await botLend.connect(borrower).borrow(ethers.parseUnits("700", 18));

      // Attempting to withdraw any collateral should revert because remaining collateral cannot support debt
      await expect(
        botLend.connect(borrower).withdrawCollateral(ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Remaining collateral insufficient to support debt");
    });
  });

  describe("4. Borrowing & Limits", function () {
    beforeEach(async function () {
      await botLend.connect(supplier).supply(FIVE_THOUSAND);
    });

    it("Should calculate max borrow capacity based on collateral and 70% LTV", async function () {
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
      // 1000 BOT * 70% = 700 BOT
      expect(await botLend.getMaxBorrow(borrower.address)).to.equal(ethers.parseUnits("700", 18));
    });

    it("Should allow borrowing within capacity", async function () {
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
      const borrowAmount = ethers.parseUnits("500", 18);

      await expect(botLend.connect(borrower).borrow(borrowAmount))
        .to.emit(botLend, "Borrow")
        .withArgs(borrower.address, borrowAmount);

      expect(await botLend.getDebt(borrower.address)).to.equal(borrowAmount);
      expect(await botLend.totalBorrowed()).to.equal(borrowAmount);
      expect(await botLend.getMaxBorrow(borrower.address)).to.equal(ethers.parseUnits("200", 18));
    });

    it("Should reject borrowing beyond max LTV capacity", async function () {
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
      // Max borrow is 700 BOT. Attempting 701 BOT must fail.
      await expect(botLend.connect(borrower).borrow(ethers.parseUnits("701", 18))).to.be.revertedWith(
        "Borrow amount exceeds borrowing capacity"
      );
    });

    it("Should reject borrowing when protocol lacks sufficient liquidity", async function () {
      // Borrower has 10,000 collateral (capacity 7,000 BOT)
      await botLend.connect(borrower).depositCollateral(TEN_THOUSAND);

      // But supplier only supplied 5,000 BOT. Attempting to borrow 6,000 BOT must fail.
      await expect(botLend.connect(borrower).borrow(ethers.parseUnits("6000", 18))).to.be.revertedWith(
        "Insufficient liquidity in pool to borrow"
      );
    });
  });

  describe("5. Repayment & repayAll", function () {
    beforeEach(async function () {
      await botLend.connect(supplier).supply(FIVE_THOUSAND);
      await botLend.connect(borrower).depositCollateral(TWO_THOUSAND);
      await botLend.connect(borrower).borrow(ONE_THOUSAND);
    });

    it("Should support partial repayment", async function () {
      const repayAmount = ethers.parseUnits("400", 18);
      await expect(botLend.connect(borrower).repay(repayAmount))
        .to.emit(botLend, "Repay");

      const debtRemaining = await botLend.getDebt(borrower.address);
      expect(debtRemaining).to.be.closeTo(ethers.parseUnits("600", 18), ethers.parseUnits("0.01", 18));
    });

    it("Should support full repayment via repayAll", async function () {
      await botLend.connect(borrower).repayAll();
      expect(await botLend.getDebt(borrower.address)).to.equal(0n);
    });

    it("Should cap repayment to current debt when user overpays", async function () {
      const debtBefore = await botLend.getDebt(borrower.address);
      // Repay 5,000 BOT when debt is only ~1,000 BOT
      await botLend.connect(borrower).repay(FIVE_THOUSAND);

      expect(await botLend.getDebt(borrower.address)).to.equal(0n);
      expect(await botLend.totalBorrowed()).to.equal(0n);
    });
  });

  describe("6. Interest Accrual & Rate Modeling", function () {
    beforeEach(async function () {
      await botLend.connect(supplier).supply(TEN_THOUSAND);
      await botLend.connect(borrower).depositCollateral(TEN_THOUSAND);
      await botLend.connect(borrower).borrow(ethers.parseUnits("5000", 18)); // 50% utilization
    });

    it("Should calculate utilization and borrow rate correctly", async function () {
      // 5,000 borrowed / 10,000 supplied = 50% utilization = 0.5 * 1e18
      const utilization = await botLend.getUtilizationRate();
      expect(utilization).to.equal(ethers.parseUnits("0.5", 18));

      // Borrow rate = Base (2%) + Utilization (50%) * Slope (18%) = 2% + 9% = 11% APY
      const borrowRate = await botLend.getBorrowRate();
      expect(borrowRate).to.equal(ethers.parseUnits("0.11", 18));

      // Supply rate = borrowRate * utilization * (1 - reserveFactor 10%) = 11% * 0.5 * 0.9 = 4.95% APY
      const supplyRate = await botLend.getSupplyRate();
      expect(supplyRate).to.equal(ethers.parseUnits("0.0495", 18));
    });

    it("Should accrue interest over time and increase debt & reserves", async function () {
      const initialDebt = await botLend.getDebt(borrower.address);

      // Advance time by 180 days (~half a year)
      await time.increase(180 * 24 * 3600);

      // Trigger interest accrual via accrueInterest
      await botLend.accrueInterest();

      const newDebt = await botLend.getDebt(borrower.address);
      expect(newDebt).to.be.gt(initialDebt);

      // Protocol reserves should have accumulated 10% of accrued interest
      const reserves = await botLend.getReserves();
      expect(reserves).to.be.gt(0n);
    });
  });

  describe("7. Health Factor & Liquidation Engine", function () {
    beforeEach(async function () {
      await botLend.connect(supplier).supply(TEN_THOUSAND);
      // Collateral = 1,000 BOT
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
    });

    it("Should return max uint256 for health factor when user has 0 debt", async function () {
      expect(await botLend.getHealthFactor(borrower.address)).to.equal(ethers.MaxUint256);
    });

    it("Should calculate health factor correctly for healthy position", async function () {
      // Borrow 700 BOT against 1,000 BOT collateral (liquidation threshold 75%)
      // Health factor = (1000 * 0.75) / 700 = 750 / 700 = 1.0714 * 1e18 (> 1.0)
      await botLend.connect(borrower).borrow(ethers.parseUnits("700", 18));

      const hf = await botLend.getHealthFactor(borrower.address);
      expect(hf).to.be.gt(ethers.parseUnits("1.0", 18));
    });

    it("Should prevent liquidation of a healthy position", async function () {
      await botLend.connect(borrower).borrow(ethers.parseUnits("500", 18));

      await expect(
        botLend.connect(liquidator).liquidate(borrower.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Borrower position is healthy; cannot liquidate");
    });

    it("Should allow liquidating an unhealthy position with 5% bonus", async function () {
      // Borrower borrows 700 BOT against 1,000 BOT collateral (HF = 1.0714)
      await botLend.connect(borrower).borrow(ethers.parseUnits("700", 18));

      // Advance time by 4 years to accrue substantial debt interest so HF drops below 1.0
      await time.increase(4 * 365 * 24 * 3600);

      // Update oracle timestamp to keep oracle fresh
      const currentTime = await time.latest();
      await oracle.setAnswer(FEED_ID, INITIAL_PRICE, currentTime, 2);

      const hf = await botLend.getHealthFactor(borrower.address);
      expect(hf).to.be.lt(ethers.parseUnits("1.0", 18)); // Now liquidatable!

      const liquidatorCollateralBefore = await botToken.balanceOf(liquidator.address);
      const debtToRepay = ethers.parseUnits("200", 18);

      // Expected seized collateral = debtToRepay * 1.05 = 210 BOT
      const expectedCollateral = ethers.parseUnits("210", 18);

      await expect(botLend.connect(liquidator).liquidate(borrower.address, debtToRepay))
        .to.emit(botLend, "Liquidation")
        .withArgs(liquidator.address, borrower.address, debtToRepay, expectedCollateral);

      const liquidatorCollateralAfter = await botToken.balanceOf(liquidator.address);
      // Net change for liquidator: -200 debtRepaid + 210 collateralSeized = +10 BOT profit
      expect(liquidatorCollateralAfter - liquidatorCollateralBefore).to.equal(ethers.parseUnits("10", 18));
    });

    it("Should prevent self-liquidation", async function () {
      await botLend.connect(borrower).borrow(ethers.parseUnits("700", 18));
      await time.increase(4 * 365 * 24 * 3600);
      const currentTime = await time.latest();
      await oracle.setAnswer(FEED_ID, INITIAL_PRICE, currentTime, 2);

      await expect(
        botLend.connect(borrower).liquidate(borrower.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Cannot liquidate self");
    });
  });

  describe("8. Oracle Security & Staleness Protection", function () {
    it("Should reject borrow when oracle price is stale", async function () {
      await botLend.connect(supplier).supply(FIVE_THOUSAND);
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);

      // Advance time past maxOracleAge (3600 seconds)
      await time.increase(3601);

      await expect(botLend.connect(borrower).borrow(ethers.parseUnits("100", 18))).to.be.revertedWith(
        "Oracle price is stale"
      );
    });

    it("Should reject actions when oracle returns zero or negative price", async function () {
      await botLend.connect(supplier).supply(FIVE_THOUSAND);
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);

      const currentTime = await time.latest();
      // Set zero price
      await oracle.setAnswer(FEED_ID, 0, currentTime, 10);
      await expect(botLend.connect(borrower).borrow(ethers.parseUnits("100", 18))).to.be.revertedWith(
        "Oracle price must be positive"
      );

      // Set negative price
      await oracle.setAnswer(FEED_ID, -100, currentTime, 11);
      await expect(botLend.connect(borrower).borrow(ethers.parseUnits("100", 18))).to.be.revertedWith(
        "Oracle price must be positive"
      );
    });

    it("Should allow ORACLE_MANAGER_ROLE to update oracle settings", async function () {
      const MockBotOracleFactory = await ethers.getContractFactory("MockBotOracle");
      const newOracle = await MockBotOracleFactory.deploy();
      await newOracle.waitForDeployment();

      await expect(botLend.setOracleConfig(await newOracle.getAddress(), 2, 7200))
        .to.emit(botLend, "OracleUpdated")
        .withArgs(await newOracle.getAddress(), 2, 7200);

      const [oracleAddr, feedId, maxAge] = await botLend.getOracleConfig();
      expect(oracleAddr).to.equal(await newOracle.getAddress());
      expect(feedId).to.equal(2n);
      expect(maxAge).to.equal(7200n);
    });
  });

  describe("9. Access Control & Admin Controls", function () {
    it("Should allow RISK_MANAGER to adjust risk and interest parameters", async function () {
      await botLend.grantRole(await botLend.RISK_MANAGER_ROLE(), riskManager.address);

      await expect(
        botLend.connect(riskManager).setRiskParameters(6500, 7000, 400)
      )
        .to.emit(botLend, "RiskParametersUpdated")
        .withArgs(6500, 7000, 400);

      const [maxLTV, threshold, bonus] = await botLend.getRiskParameters();
      expect(maxLTV).to.equal(6500n);
      expect(threshold).to.equal(7000n);
      expect(bonus).to.equal(400n);
    });

    it("Should prevent unauthorized users from changing risk parameters", async function () {
      await expect(
        botLend.connect(user).setRiskParameters(6000, 7000, 300)
      ).to.be.reverted;
    });

    it("Should allow admin to withdraw protocol fee reserves", async function () {
      // Accumulate some reserves through borrowing and interest
      await botLend.connect(supplier).supply(TEN_THOUSAND);
      await botLend.connect(borrower).depositCollateral(TEN_THOUSAND);
      await botLend.connect(borrower).borrow(FIVE_THOUSAND);
      await time.increase(365 * 24 * 3600);
      await botLend.accrueInterest();

      const reserves = await botLend.getReserves();
      expect(reserves).to.be.gt(0n);

      const balanceBefore = await botToken.balanceOf(owner.address);
      await expect(botLend.withdrawReserves(owner.address, reserves))
        .to.emit(botLend, "ReserveWithdrawn")
        .withArgs(owner.address, reserves);

      expect(await botToken.balanceOf(owner.address)).to.equal(balanceBefore + reserves);
      expect(await botLend.getReserves()).to.equal(0n);
    });

    it("Should prevent non-admin from withdrawing protocol reserves", async function () {
      await expect(
        botLend.connect(user).withdrawReserves(user.address, ONE_THOUSAND)
      ).to.be.reverted;
    });
  });

  describe("10. Emergency Pause Mechanism", function () {
    it("Should prevent supply, borrow, and collateral withdrawal when paused", async function () {
      await botLend.pause();

      await expect(botLend.connect(supplier).supply(ONE_THOUSAND)).to.be.revertedWithCustomError(
        botLend,
        "EnforcedPause"
      );
      await expect(botLend.connect(borrower).borrow(ONE_THOUSAND)).to.be.revertedWithCustomError(
        botLend,
        "EnforcedPause"
      );
      await expect(
        botLend.connect(borrower).withdrawCollateral(ONE_THOUSAND)
      ).to.be.revertedWithCustomError(botLend, "EnforcedPause");
    });

    it("Should still allow debt repayment when paused to protect borrower solvency", async function () {
      await botLend.connect(supplier).supply(FIVE_THOUSAND);
      await botLend.connect(borrower).depositCollateral(TWO_THOUSAND);
      await botLend.connect(borrower).borrow(ONE_THOUSAND);

      // Trigger emergency pause
      await botLend.pause();

      // Repayment must succeed
      await expect(botLend.connect(borrower).repay(ethers.parseUnits("500", 18))).to.not.be.reverted;
    });

    it("Should allow PAUSER_ROLE to unpause and resume operations", async function () {
      await botLend.pause();
      await botLend.unpause();

      await expect(botLend.connect(supplier).supply(ONE_THOUSAND)).to.not.be.reverted;
    });
  });

  describe("11. View Functions & Aggregates", function () {
    it("Should return correct aggregated protocol stats", async function () {
      await botLend.connect(supplier).supply(TWO_THOUSAND);
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
      await botLend.connect(borrower).borrow(ethers.parseUnits("500", 18));

      const stats = await botLend.getProtocolStats();
      expect(stats._totalSupplied).to.equal(TWO_THOUSAND);
      expect(stats._totalBorrowed).to.equal(ethers.parseUnits("500", 18));
      expect(stats._availableLiquidity).to.equal(ethers.parseUnits("1500", 18));
      expect(stats._utilizationRate).to.equal(ethers.parseUnits("0.25", 18)); // 25%
    });

    it("Should return comprehensive getUserAccount overview", async function () {
      await botLend.connect(supplier).supply(FIVE_THOUSAND);
      await botLend.connect(borrower).depositCollateral(ONE_THOUSAND);
      await botLend.connect(borrower).borrow(ethers.parseUnits("400", 18));

      const account = await botLend.getUserAccount(borrower.address);
      expect(account.supplied).to.equal(0n);
      expect(account.collateral).to.equal(ONE_THOUSAND);
      expect(account.debt).to.equal(ethers.parseUnits("400", 18));
      expect(account.maxBorrow).to.equal(ethers.parseUnits("300", 18)); // 700 - 400 = 300
      expect(account.healthFactor).to.be.gt(ethers.parseUnits("1.0", 18));
    });
  });
});
