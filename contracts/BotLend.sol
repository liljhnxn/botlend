// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IBotOracle.sol";

/**
 * @title BotLend
 * @notice Overcollateralized decentralized lending and borrowing protocol for the Botchain ecosystem.
 * @dev Supports liquidity supply, collateralized borrowing, fixed-point interest accrual,
 *      liquidation of unhealthy positions, configurable risk/oracle parameters, and emergency controls.
 */
contract BotLend is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // --- Access Control Roles ---
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant ORACLE_MANAGER_ROLE = keccak256("ORACLE_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // --- Math & Scale Constants ---
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BPS_DIVISOR = 10000; // 10,000 = 100%
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days

    // --- Underlying Token ---
    IERC20 public immutable botToken;

    // --- Oracle Integration ---
    IBotOracle public oracle;
    uint256 public oracleFeedId;
    uint256 public maxOracleAge;

    // --- Risk Parameters (in BPS) ---
    uint256 public maxLTV; // e.g. 7000 = 70%
    uint256 public liquidationThreshold; // e.g. 7500 = 75%
    uint256 public liquidationBonus; // e.g. 500 = 5%
    uint256 public reserveFactor; // e.g. 1000 = 10%

    // --- Interest Rate Parameters (in 1e18 precision) ---
    uint256 public baseBorrowRate; // e.g. 2e16 = 2% APY
    uint256 public slopeBorrowRate; // e.g. 18e16 = 18% slope APY

    // --- Protocol Global Accounting ---
    uint256 public totalSupplied; // Total supplier principal + accrued supplier interest
    uint256 public totalSupplyShares; // Share pool for suppliers
    uint256 public totalBorrowed; // Total active debt outstanding
    uint256 public totalCollateral; // Total collateral deposited in protocol
    uint256 public totalReserves; // Total protocol fee reserves accumulated
    uint256 public borrowIndex; // Cumulative borrow interest index (starts at 1e18)
    uint256 public lastAccrualTimestamp; // Timestamp of last interest calculation

    // --- User Positions ---
    mapping(address => uint256) public userSupplyShares;
    mapping(address => uint256) public collateralBalances;
    mapping(address => uint256) public userBorrowPrincipal; // Scaled by borrowIndex at borrow time

    // --- Events ---
    event Supply(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed borrower, address indexed repayer, uint256 amount, uint256 debtRemaining);
    event InterestAccrued(uint256 interestAccrued, uint256 reserveAccrued, uint256 newBorrowIndex, uint256 timestamp);
    event Liquidation(address indexed liquidator, address indexed borrower, uint256 debtRepaid, uint256 collateralSeized);
    event OracleUpdated(address indexed oracle, uint256 feedId, uint256 maxOracleAge);
    event RiskParametersUpdated(uint256 maxLTV, uint256 liquidationThreshold, uint256 liquidationBonus);
    event InterestParametersUpdated(uint256 baseBorrowRate, uint256 slopeBorrowRate, uint256 reserveFactor);
    event ReserveWithdrawn(address indexed to, uint256 amount);

    /**
     * @notice Initializes the BotLend protocol with assets, oracle, and initial risk parameters.
     * @param _botToken Address of the lending/collateral ERC20 token
     * @param _oracle Address of the BotOracle contract
     * @param _oracleFeedId Initial feed ID
     * @param _maxOracleAge Maximum staleness tolerated for oracle prices (seconds)
     */
    constructor(
        address _botToken,
        address _oracle,
        uint256 _oracleFeedId,
        uint256 _maxOracleAge
    ) {
        require(_botToken != address(0), "Invalid token address");

        botToken = IERC20(_botToken);
        oracle = IBotOracle(_oracle);
        oracleFeedId = _oracleFeedId;
        maxOracleAge = _maxOracleAge > 0 ? _maxOracleAge : 3600; // Default 1 hour

        // Configure default roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RISK_MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_MANAGER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Initial default risk parameters
        maxLTV = 7000; // 70%
        liquidationThreshold = 7500; // 75%
        liquidationBonus = 500; // 5%
        reserveFactor = 1000; // 10%

        // Initial interest rate parameters (1e18 = 100% APY)
        baseBorrowRate = 2e16; // 2% base APY
        slopeBorrowRate = 18e16; // 18% slope APY

        borrowIndex = PRECISION;
        lastAccrualTimestamp = block.timestamp;
    }

    // =========================================================================
    // INTEREST ACCRUAL ENGINE
    // =========================================================================

    /**
     * @notice Accrues borrowing interest and updates protocol reserves and indices.
     */
    function accrueInterest() public {
        uint256 timeElapsed = block.timestamp - lastAccrualTimestamp;
        if (timeElapsed == 0) {
            return;
        }

        if (totalBorrowed > 0) {
            uint256 currentBorrowRate = getBorrowRate();
            // interestFactor = (rate * timeElapsed) / SECONDS_PER_YEAR
            uint256 interestFactor = (currentBorrowRate * timeElapsed) / SECONDS_PER_YEAR;
            uint256 interestAccrued = (totalBorrowed * interestFactor) / PRECISION;

            if (interestAccrued > 0) {
                uint256 reserveShare = (interestAccrued * reserveFactor) / BPS_DIVISOR;
                uint256 supplierShare = interestAccrued - reserveShare;

                totalReserves += reserveShare;
                totalBorrowed += interestAccrued;
                totalSupplied += supplierShare;

                borrowIndex += (borrowIndex * interestFactor) / PRECISION;

                emit InterestAccrued(interestAccrued, reserveShare, borrowIndex, block.timestamp);
            }
        }

        lastAccrualTimestamp = block.timestamp;
    }

    // =========================================================================
    // SUPPLY & WITHDRAW
    // =========================================================================

    /**
     * @notice Supplies BOT tokens into the protocol lending pool.
     * @param amount Amount of tokens to supply
     */
    function supply(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Supply amount must be > 0");
        accrueInterest();

        uint256 shares;
        if (totalSupplyShares == 0 || totalSupplied == 0) {
            shares = amount;
        } else {
            shares = (amount * totalSupplyShares) / totalSupplied;
        }

        userSupplyShares[msg.sender] += shares;
        totalSupplyShares += shares;
        totalSupplied += amount;

        botToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Supply(msg.sender, amount);
    }

    /**
     * @notice Withdraws previously supplied BOT tokens and accrued interest.
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Withdraw amount must be > 0");
        accrueInterest();

        uint256 userBalance = getSuppliedBalance(msg.sender);
        require(userBalance >= amount, "Insufficient supplied balance");
        require(getAvailableLiquidity() >= amount, "Insufficient protocol liquidity");

        uint256 sharesToBurn = (amount * totalSupplyShares + totalSupplied - 1) / totalSupplied;
        if (sharesToBurn > userSupplyShares[msg.sender]) {
            sharesToBurn = userSupplyShares[msg.sender];
        }

        userSupplyShares[msg.sender] -= sharesToBurn;
        totalSupplyShares -= sharesToBurn;
        totalSupplied -= amount;

        botToken.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    // =========================================================================
    // COLLATERAL MANAGEMENT
    // =========================================================================

    /**
     * @notice Deposits BOT tokens as borrowing collateral.
     * @param amount Amount of tokens to deposit as collateral
     */
    function depositCollateral(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Deposit amount must be > 0");
        accrueInterest();

        collateralBalances[msg.sender] += amount;
        totalCollateral += amount;

        botToken.safeTransferFrom(msg.sender, address(this), amount);
        emit CollateralDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraws collateral as long as the user's position remains strictly healthy.
     * @param amount Amount of collateral to withdraw
     */
    function withdrawCollateral(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Withdraw amount must be > 0");
        accrueInterest();

        require(collateralBalances[msg.sender] >= amount, "Insufficient collateral balance");

        // Verify oracle is valid before permitting collateral withdrawal
        _getValidOraclePrice();

        uint256 currentDebt = getDebt(msg.sender);
        uint256 remainingCollateral = collateralBalances[msg.sender] - amount;

        if (currentDebt > 0) {
            uint256 maxAllowedBorrowWithRemaining = (remainingCollateral * maxLTV) / BPS_DIVISOR;
            require(currentDebt <= maxAllowedBorrowWithRemaining, "Remaining collateral insufficient to support debt");
        }

        collateralBalances[msg.sender] = remainingCollateral;
        totalCollateral -= amount;

        botToken.safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, amount);
    }

    // =========================================================================
    // BORROW & REPAY
    // =========================================================================

    /**
     * @notice Borrows BOT tokens against deposited collateral.
     * @param amount Amount of tokens to borrow
     */
    function borrow(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Borrow amount must be > 0");
        accrueInterest();

        // Validates oracle price freshness
        _getValidOraclePrice();

        uint256 maxBorrowAllowed = getMaxBorrow(msg.sender);
        require(amount <= maxBorrowAllowed, "Borrow amount exceeds borrowing capacity");
        require(amount <= getAvailableLiquidity(), "Insufficient liquidity in pool to borrow");

        uint256 principalScaled = (amount * PRECISION) / borrowIndex;
        userBorrowPrincipal[msg.sender] += principalScaled;
        totalBorrowed += amount;

        botToken.safeTransfer(msg.sender, amount);
        emit Borrow(msg.sender, amount);
    }

    /**
     * @notice Repays part or all of the caller's outstanding debt.
     * @param amount Amount of tokens to repay (if amount >= total debt, repays full debt)
     */
    function repay(uint256 amount) public nonReentrant {
        // Repayment is permitted even during emergency pause to allow borrowers to protect collateral
        require(amount > 0, "Repay amount must be > 0");
        accrueInterest();

        uint256 currentDebt = getDebt(msg.sender);
        require(currentDebt > 0, "No outstanding debt to repay");

        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;

        uint256 principalReduction = (repayAmount * PRECISION) / borrowIndex;
        if (principalReduction >= userBorrowPrincipal[msg.sender] || repayAmount == currentDebt) {
            userBorrowPrincipal[msg.sender] = 0;
        } else {
            userBorrowPrincipal[msg.sender] -= principalReduction;
        }

        totalBorrowed = totalBorrowed >= repayAmount ? totalBorrowed - repayAmount : 0;

        botToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        emit Repay(msg.sender, msg.sender, repayAmount, getDebt(msg.sender));
    }

    /**
     * @notice Repays 100% of the caller's outstanding debt in a single transaction.
     */
    function repayAll() external {
        accrueInterest();
        uint256 fullDebt = getDebt(msg.sender);
        repay(fullDebt);
    }

    // =========================================================================
    // LIQUIDATION
    // =========================================================================

    /**
     * @notice Liquidates an undercollateralized borrower position (health factor < 1.0).
     * @param borrower Address of the unhealthy borrower
     * @param debtAmount Amount of debt the liquidator is repaying on borrower's behalf
     */
    function liquidate(address borrower, uint256 debtAmount) external nonReentrant whenNotPaused {
        require(borrower != msg.sender, "Cannot liquidate self");
        require(debtAmount > 0, "Debt amount must be > 0");
        accrueInterest();

        // Validates oracle price freshness
        _getValidOraclePrice();

        uint256 borrowerDebt = getDebt(borrower);
        require(borrowerDebt > 0, "Borrower has no debt");

        uint256 hf = getHealthFactor(borrower);
        require(hf < PRECISION, "Borrower position is healthy; cannot liquidate");

        uint256 actualDebtRepaid = debtAmount > borrowerDebt ? borrowerDebt : debtAmount;

        // Seize collateral = debtRepaid * (100% + liquidationBonus)
        uint256 collateralToSeize = (actualDebtRepaid * (BPS_DIVISOR + liquidationBonus)) / BPS_DIVISOR;
        uint256 borrowerCollateral = collateralBalances[borrower];

        if (collateralToSeize > borrowerCollateral) {
            collateralToSeize = borrowerCollateral;
        }

        // Reduce borrower's collateral
        collateralBalances[borrower] -= collateralToSeize;
        totalCollateral -= collateralToSeize;

        // Reduce borrower's debt
        uint256 principalReduction = (actualDebtRepaid * PRECISION) / borrowIndex;
        if (principalReduction >= userBorrowPrincipal[borrower] || actualDebtRepaid == borrowerDebt) {
            userBorrowPrincipal[borrower] = 0;
        } else {
            userBorrowPrincipal[borrower] -= principalReduction;
        }

        totalBorrowed = totalBorrowed >= actualDebtRepaid ? totalBorrowed - actualDebtRepaid : 0;

        // Transfer tokens
        botToken.safeTransferFrom(msg.sender, address(this), actualDebtRepaid);
        botToken.safeTransfer(msg.sender, collateralToSeize);

        emit Liquidation(msg.sender, borrower, actualDebtRepaid, collateralToSeize);
    }

    // =========================================================================
    // PROTOCOL RESERVES & ADMIN CONTROLS
    // =========================================================================

    /**
     * @notice Withdraws protocol fee reserves to a specified address.
     * @param to Recipient address
     * @param amount Amount of reserves to withdraw
     */
    function withdrawReserves(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(amount <= totalReserves, "Amount exceeds accumulated reserves");

        totalReserves -= amount;
        botToken.safeTransfer(to, amount);
        emit ReserveWithdrawn(to, amount);
    }

    /**
     * @notice Updates protocol risk parameters.
     * @param _maxLTV Max loan-to-value ratio in BPS (e.g. 7000 = 70%)
     * @param _liquidationThreshold Liquidation threshold in BPS (e.g. 7500 = 75%)
     * @param _liquidationBonus Bonus awarded to liquidators in BPS (e.g. 500 = 5%)
     */
    function setRiskParameters(
        uint256 _maxLTV,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus
    ) external onlyRole(RISK_MANAGER_ROLE) {
        require(_maxLTV > 0 && _maxLTV < _liquidationThreshold, "Invalid LTV: must be < liquidation threshold");
        require(_liquidationThreshold <= BPS_DIVISOR, "Liquidation threshold cannot exceed 100%");
        require(_liquidationBonus <= 2000, "Liquidation bonus cannot exceed 20%");

        maxLTV = _maxLTV;
        liquidationThreshold = _liquidationThreshold;
        liquidationBonus = _liquidationBonus;

        emit RiskParametersUpdated(_maxLTV, _liquidationThreshold, _liquidationBonus);
    }

    /**
     * @notice Updates utilization interest rate parameters.
     * @param _baseBorrowRate Base borrow APY scaled by 1e18
     * @param _slopeBorrowRate Slope borrow APY scaled by 1e18
     * @param _reserveFactor Protocol reserve cut in BPS (e.g. 1000 = 10%)
     */
    function setInterestParameters(
        uint256 _baseBorrowRate,
        uint256 _slopeBorrowRate,
        uint256 _reserveFactor
    ) external onlyRole(RISK_MANAGER_ROLE) {
        require(_reserveFactor <= 3000, "Reserve factor cannot exceed 30%");
        accrueInterest();

        baseBorrowRate = _baseBorrowRate;
        slopeBorrowRate = _slopeBorrowRate;
        reserveFactor = _reserveFactor;

        emit InterestParametersUpdated(_baseBorrowRate, _slopeBorrowRate, _reserveFactor);
    }

    /**
     * @notice Updates oracle address and feed parameters.
     * @param _oracle Address of new BotOracle
     * @param _feedId Feed ID
     * @param _maxOracleAge Maximum acceptable age of price updates in seconds
     */
    function setOracleConfig(
        address _oracle,
        uint256 _feedId,
        uint256 _maxOracleAge
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(_oracle != address(0), "Invalid oracle address");
        require(_maxOracleAge >= 60, "Max oracle age must be at least 60s");

        oracle = IBotOracle(_oracle);
        oracleFeedId = _feedId;
        maxOracleAge = _maxOracleAge;

        emit OracleUpdated(_oracle, _feedId, _maxOracleAge);
    }

    /**
     * @notice Emergency pause protocol operations.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause protocol operations.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Validates that oracle price is non-zero, positive, and fresh.
     */
    function _getValidOraclePrice() internal view returns (uint256, uint256) {
        require(address(oracle) != address(0), "Oracle address not configured");
        (int256 answer, uint256 updatedAt, ) = oracle.getLatestAnswer(oracleFeedId);
        require(answer > 0, "Oracle price must be positive");
        require(updatedAt <= block.timestamp, "Oracle timestamp in future");
        require(block.timestamp - updatedAt <= maxOracleAge, "Oracle price is stale");
        return (uint256(answer), updatedAt);
    }

    /**
     * @notice Returns complete account overview for a user.
     */
    function getUserAccount(address user) external view returns (
        uint256 supplied,
        uint256 collateral,
        uint256 debt,
        uint256 healthFactor,
        uint256 maxBorrow
    ) {
        supplied = getSuppliedBalance(user);
        collateral = collateralBalances[user];
        debt = getDebt(user);
        healthFactor = getHealthFactor(user);
        maxBorrow = getMaxBorrow(user);
    }

    /**
     * @notice Returns user supplied balance including accrued interest.
     */
    function getSuppliedBalance(address user) public view returns (uint256) {
        if (totalSupplyShares == 0) return 0;
        return (userSupplyShares[user] * totalSupplied) / totalSupplyShares;
    }

    /**
     * @notice Returns user collateral balance.
     */
    function getCollateralBalance(address user) external view returns (uint256) {
        return collateralBalances[user];
    }

    /**
     * @notice Returns user debt including accrued interest.
     */
    function getDebt(address user) public view returns (uint256) {
        if (userBorrowPrincipal[user] == 0) return 0;

        uint256 currentIndex = borrowIndex;
        uint256 timeElapsed = block.timestamp - lastAccrualTimestamp;
        if (timeElapsed > 0 && totalBorrowed > 0) {
            uint256 currentBorrowRate = getBorrowRate();
            uint256 interestFactor = (currentBorrowRate * timeElapsed) / SECONDS_PER_YEAR;
            currentIndex += (currentIndex * interestFactor) / PRECISION;
        }

        return (userBorrowPrincipal[user] * currentIndex) / PRECISION;
    }

    /**
     * @notice Returns pending accrued borrowing interest for a user.
     */
    function getAccruedInterest(address user) external view returns (uint256) {
        uint256 currentDebt = getDebt(user);
        uint256 principal = (userBorrowPrincipal[user] * PRECISION) / PRECISION;
        return currentDebt > principal ? currentDebt - principal : 0;
    }

    /**
     * @notice Returns user position health factor.
     * @dev If debt is 0, returns type(uint256).max.
     *      A position is healthy if healthFactor >= 1e18, warning if 1.0 <= hf < 1.2, liquidatable if < 1.0.
     */
    function getHealthFactor(address user) public view returns (uint256) {
        uint256 debt = getDebt(user);
        if (debt == 0) {
            return type(uint256).max;
        }

        // Verify oracle validity
        (uint256 price, ) = _getValidOraclePrice();
        uint256 collateral = collateralBalances[user];
        if (collateral == 0) return 0;

        uint256 collateralValueUSD = (collateral * price) / PRECISION;
        uint256 debtValueUSD = (debt * price) / PRECISION;

        return (collateralValueUSD * liquidationThreshold * PRECISION) / (debtValueUSD * BPS_DIVISOR);
    }

    /**
     * @notice Returns remaining borrowing power available to user based on max LTV.
     */
    function getMaxBorrow(address user) public view returns (uint256) {
        uint256 collateral = collateralBalances[user];
        if (collateral == 0) return 0;

        uint256 maxCapacity = (collateral * maxLTV) / BPS_DIVISOR;
        uint256 currentDebt = getDebt(user);

        if (maxCapacity <= currentDebt) {
            return 0;
        }
        return maxCapacity - currentDebt;
    }

    /**
     * @notice Returns unborrowed liquidity currently available in the lending pool.
     */
    function getAvailableLiquidity() public view returns (uint256) {
        if (totalSupplied <= totalBorrowed) {
            return 0;
        }
        return totalSupplied - totalBorrowed;
    }

    /**
     * @notice Returns pool utilization rate in 1e18 precision (1e18 = 100%).
     */
    function getUtilizationRate() public view returns (uint256) {
        if (totalSupplied == 0) {
            return 0;
        }
        return (totalBorrowed * PRECISION) / totalSupplied;
    }

    /**
     * @notice Returns annual borrow interest rate in 1e18 precision (e.g. 0.05 * 1e18 = 5%).
     */
    function getBorrowRate() public view returns (uint256) {
        uint256 utilization = getUtilizationRate();
        return baseBorrowRate + (utilization * slopeBorrowRate) / PRECISION;
    }

    /**
     * @notice Returns annual supply APY in 1e18 precision.
     */
    function getSupplyRate() public view returns (uint256) {
        uint256 utilization = getUtilizationRate();
        if (utilization == 0) return 0;

        uint256 borrowRate = getBorrowRate();
        uint256 netFactor = (BPS_DIVISOR - reserveFactor);
        return (((borrowRate * utilization) / PRECISION) * netFactor) / BPS_DIVISOR;
    }

    /**
     * @notice Returns total protocol reserves accumulated.
     */
    function getReserves() external view returns (uint256) {
        return totalReserves;
    }

    /**
     * @notice Returns aggregated protocol statistics for dashboard.
     */
    function getProtocolStats() external view returns (
        uint256 _totalSupplied,
        uint256 _totalBorrowed,
        uint256 _availableLiquidity,
        uint256 _utilizationRate,
        uint256 _supplyRate,
        uint256 _borrowRate,
        uint256 _reserves
    ) {
        _totalSupplied = totalSupplied;
        _totalBorrowed = totalBorrowed;
        _availableLiquidity = getAvailableLiquidity();
        _utilizationRate = getUtilizationRate();
        _supplyRate = getSupplyRate();
        _borrowRate = getBorrowRate();
        _reserves = totalReserves;
    }

    /**
     * @notice Returns current risk parameters.
     */
    function getRiskParameters() external view returns (
        uint256 _maxLTV,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus
    ) {
        return (maxLTV, liquidationThreshold, liquidationBonus);
    }

    /**
     * @notice Returns current interest rate parameters.
     */
    function getInterestParameters() external view returns (
        uint256 _baseBorrowRate,
        uint256 _slopeBorrowRate,
        uint256 _reserveFactor
    ) {
        return (baseBorrowRate, slopeBorrowRate, reserveFactor);
    }

    /**
     * @notice Returns current oracle configuration.
     */
    function getOracleConfig() external view returns (
        address _oracle,
        uint256 _feedId,
        uint256 _maxOracleAge
    ) {
        return (address(oracle), oracleFeedId, maxOracleAge);
    }
}
