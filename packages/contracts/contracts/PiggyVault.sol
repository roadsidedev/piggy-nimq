// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "./utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IPiggyAaveV3Adapter} from "./interfaces/IPiggyAaveV3Adapter.sol";
import {IGoalManager} from "./interfaces/IGoalManager.sol";
import {IChallengeManager} from "./interfaces/IChallengeManager.sol";

/// @title PiggyVault
/// @notice Custodies user stablecoin deposits, with an opt-in yield path (pooled Aave V3
///         position via PiggyAaveV3Adapter), goal-based earmarking (delegated to
///         PiggyGoalManager), recurring deposits, and borrowing against yield-enabled
///         collateral. Goals and challenges are handled by separate dedicated contracts
///         to isolate risk surfaces and scope upgrades independently.
///
/// @dev READ BEFORE DEPLOYING WITH REAL FUNDS — see the 7 design points in the previous
///      version's NatSpec (stored separately). Key changes:
///      - Goals are now in PiggyGoalManager (pure accounting, no custody)
///      - Challenges are in PiggyChallengeManager (pure accounting, no custody)
///      - Both are hot-swappable via GOVERNANCE_ROLE (MUST be a timelock/multisig)
contract PiggyVault is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Roles
    // ---------------------------------------------------------------------

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_USER_LTV_BPS_HARD_CAP = 7_000;
    uint256 public constant MIN_HEALTH_FACTOR_FLOOR = 1.3e18;
    uint256 public constant MIN_RECURRING_INTERVAL = 1 days;
    /// @notice Dead shares minted to address(0) on first yield deposit to prevent
    ///         classic vault inflation attack (donation to inflate share price).
    uint256 public constant DEAD_SHARES = 10 ** 3;
    uint256 public maxTotalDeposits;

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    IERC20 public asset;
    IPiggyAaveV3Adapter public adapter;
    IGoalManager public goalManager;
    IChallengeManager public challengeManager;

    mapping(address => uint256) public idleBalance;
    mapping(address => uint256) public supplyShares;
    mapping(address => uint256) public debtShares;
    uint256 public totalSupplyShares;
    uint256 public totalDebtShares;

    struct RecurringSchedule {
        uint256 amount;
        uint256 intervalSeconds;
        uint256 lastExecuted;
        bool active;
    }
    mapping(address => RecurringSchedule) public recurringSchedules;

    uint256 public maxUserLTVBps;
    uint256 public minHealthFactorBuffer;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldEnabled(address indexed user, uint256 amount, uint256 sharesMinted);
    event YieldDisabled(address indexed user, uint256 amountRequested, uint256 sharesBurned, uint256 amountReceived);
    event Borrowed(address indexed user, uint256 amount, uint256 debtSharesMinted);
    event Repaid(address indexed user, uint256 amount, uint256 debtSharesBurned, uint256 amountRepaidOnAave);
    event RecurringScheduleSet(address indexed user, uint256 amount, uint256 intervalSeconds);
    event RecurringScheduleCancelled(address indexed user);
    event RecurringDepositExecuted(address indexed user, uint256 amount);
    event RiskParamsUpdated(uint256 maxUserLTVBps, uint256 minHealthFactorBuffer);
    event TotalDepositCapUpdated(uint256 newCap);
    event AdapterUpdated(address indexed previousAdapter, address indexed newAdapter);
    event GoalManagerUpdated(address indexed previous, address indexed current);
    event ChallengeManagerUpdated(address indexed previous, address indexed current);
    event TokenRescued(address indexed token, uint256 amount, address indexed to);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientUnallocatedBalance();
    error InsufficientShares();
    error ExceedsUserLTVCap();
    error InsufficientHealthFactorBuffer();
    error NoOutstandingDebt();
    error NoCollateral();
    error NoYieldPosition();
    error ScheduleNotActive();
    error ScheduleTooEarly();
    error IntervalTooShort();
    error InvalidRiskParam();
    error CannotRescueVaultAsset();
    error InconsistentShareState();
    error AdapterMigrationBlocked();
    error GoalManagerNotSet();
    error ChallengeManagerNotSet();
    error TVLCapReached();
    error CapExceedsCurrentBalance();
    error InsufficientFirstDeposit();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        address operator,
        address assetAddress,
        address adapterAddress,
        uint256 initialMaxUserLTVBps,
        uint256 initialMinHealthFactorBuffer
    ) external initializer {
        if (
            admin == address(0) ||
            operator == address(0) ||
            assetAddress == address(0) ||
            adapterAddress == address(0)
        ) revert ZeroAddress();
        if (initialMaxUserLTVBps == 0 || initialMaxUserLTVBps > MAX_USER_LTV_BPS_HARD_CAP) revert InvalidRiskParam();
        if (initialMinHealthFactorBuffer < MIN_HEALTH_FACTOR_FLOOR) revert InvalidRiskParam();

        __AccessControl_init();
        __Pausable_init();

        asset = IERC20(assetAddress);
        adapter = IPiggyAaveV3Adapter(adapterAddress);
        maxUserLTVBps = initialMaxUserLTVBps;
        minHealthFactorBuffer = initialMinHealthFactorBuffer;
        maxTotalDeposits = type(uint256).max;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(RISK_MANAGER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    // ---------------------------------------------------------------------
    // Core savings: deposit / withdraw
    // ---------------------------------------------------------------------

    function deposit(uint256 amount) external whenNotPaused nonReentrant {
        _deposit(amount, 0);
    }

    function deposit(uint256 amount, uint256 challengeId) external whenNotPaused nonReentrant {
        _deposit(amount, challengeId);
    }

    function _deposit(uint256 amount, uint256 challengeId) internal {
        if (amount == 0) revert ZeroAmount();
        // SAFE: checked arithmetic prevents overflow that could bypass TVL cap
        if (asset.balanceOf(address(this)) + amount > maxTotalDeposits) revert TVLCapReached();
        asset.safeTransferFrom(msg.sender, address(this), amount);
        idleBalance[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
        if (challengeId != 0) {
            _recordChallengeProgress(msg.sender, challengeId, amount);
        }
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > unallocatedIdleBalance(msg.sender)) revert InsufficientUnallocatedBalance();
        idleBalance[msg.sender] -= amount;
        asset.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Goal integration
    // ---------------------------------------------------------------------

    /// @notice Earmarks `amount` of the caller's unallocated idle balance against `goalId`.
    ///         Delegates to PiggyGoalManager for all accounting.
    function allocateToGoal(uint256 goalId, uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (amount > unallocatedIdleBalance(msg.sender)) revert InsufficientUnallocatedBalance();
        _requireGoalManager();
        goalManager.allocateToGoal(msg.sender, goalId, amount);
    }

    /// @notice Releases `amount` from `goalId` back to unallocated idle balance.
    function deallocateFromGoal(uint256 goalId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        _requireGoalManager();
        goalManager.deallocateFromGoal(msg.sender, goalId, amount);
    }

    /// @notice Combines deallocate + withdraw in one call.
    function withdrawFromGoal(uint256 goalId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _requireGoalManager();
        goalManager.deallocateFromGoal(msg.sender, goalId, amount);
        idleBalance[msg.sender] -= amount;
        asset.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function _requireGoalManager() internal view {
        if (address(goalManager) == address(0)) revert GoalManagerNotSet();
    }

    // ---------------------------------------------------------------------
    // Yield toggle
    // ---------------------------------------------------------------------

    function enableYield(uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > unallocatedIdleBalance(msg.sender)) revert InsufficientUnallocatedBalance();

        uint256 suppliedBefore = adapter.totalSuppliedValue();
        if (totalSupplyShares > 0 && suppliedBefore == 0) revert InconsistentShareState();

        idleBalance[msg.sender] -= amount;

        asset.forceApprove(address(adapter), amount);
        adapter.supplyToAave(amount);

        uint256 sharesToMint;
        if (totalSupplyShares == 0) {
            // Prevent first-deposit inflation attack (vault share donation attack):
            // Mint dead shares to address(0) so that an attacker cannot inflate
            // the share price by donating directly to the Aave adapter.
            if (amount <= DEAD_SHARES) revert InsufficientFirstDeposit();
            totalSupplyShares += DEAD_SHARES;
            supplyShares[address(0)] += DEAD_SHARES;
            sharesToMint = amount - DEAD_SHARES;
        } else {
            sharesToMint = Math.mulDiv(amount, totalSupplyShares, suppliedBefore, Math.Rounding.Floor);
        }
        if (sharesToMint == 0) revert ZeroAmount();

        supplyShares[msg.sender] += sharesToMint;
        totalSupplyShares += sharesToMint;

        emit YieldEnabled(msg.sender, amount, sharesToMint);
    }

    function disableYield(uint256 amount) external nonReentrant {
        (uint256 sharesBurned, uint256 received) = _reduceYieldShares(msg.sender, amount);
        idleBalance[msg.sender] += received;
        emit YieldDisabled(msg.sender, amount, sharesBurned, received);
    }

    function disableAllYield() external nonReentrant {
        (uint256 sharesBurned, uint256 requestedAmount, uint256 received) = _reduceAllYieldShares(msg.sender);
        idleBalance[msg.sender] += received;
        emit YieldDisabled(msg.sender, requestedAmount, sharesBurned, received);
    }

    function withdrawFromYield(uint256 amount) external nonReentrant returns (uint256 received) {
        uint256 sharesBurned;
        (sharesBurned, received) = _reduceYieldShares(msg.sender, amount);
        asset.safeTransfer(msg.sender, received);
        emit YieldDisabled(msg.sender, amount, sharesBurned, received);
        emit Withdrawn(msg.sender, received);
    }

    function withdrawAllYield() external nonReentrant returns (uint256 received) {
        uint256 sharesBurned;
        uint256 requestedAmount;
        (sharesBurned, requestedAmount, received) = _reduceAllYieldShares(msg.sender);
        asset.safeTransfer(msg.sender, received);
        emit YieldDisabled(msg.sender, requestedAmount, sharesBurned, received);
        emit Withdrawn(msg.sender, received);
    }

    function _reduceYieldShares(address user, uint256 amount)
        internal
        returns (uint256 sharesBurned, uint256 received)
    {
        if (amount == 0) revert ZeroAmount();
        if (totalSupplyShares == 0) revert NoYieldPosition();

        uint256 suppliedBefore = adapter.totalSuppliedValue();
        sharesBurned = Math.mulDiv(amount, totalSupplyShares, suppliedBefore, Math.Rounding.Ceil);
        if (sharesBurned > supplyShares[user]) revert InsufficientShares();

        supplyShares[user] -= sharesBurned;
        totalSupplyShares -= sharesBurned;

        received = adapter.withdrawFromAave(amount);

        _assertHealthFactorSafe();
    }

    function _reduceAllYieldShares(address user)
        internal
        returns (uint256 sharesBurned, uint256 requestedAmount, uint256 received)
    {
        sharesBurned = supplyShares[user];
        if (sharesBurned == 0) revert NoYieldPosition();

        uint256 suppliedBefore = adapter.totalSuppliedValue();
        requestedAmount = Math.mulDiv(sharesBurned, suppliedBefore, totalSupplyShares, Math.Rounding.Floor);

        supplyShares[user] = 0;
        totalSupplyShares -= sharesBurned;

        received = requestedAmount == 0 ? 0 : adapter.withdrawFromAave(requestedAmount);

        _assertHealthFactorSafe();
    }

    // ---------------------------------------------------------------------
    // Borrow / repay
    // ---------------------------------------------------------------------

    function borrow(uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 userCollateralValue = _supplyValueOf(msg.sender);
        if (userCollateralValue == 0) revert NoCollateral();

        uint256 debtValueBefore = adapter.totalDebtValue();
        uint256 userDebtValue = totalDebtShares == 0
            ? 0
            : Math.mulDiv(debtShares[msg.sender], debtValueBefore, totalDebtShares, Math.Rounding.Ceil);

        uint256 newUserDebtValue = userDebtValue + amount;
        if (newUserDebtValue * BPS_DENOMINATOR > userCollateralValue * maxUserLTVBps) revert ExceedsUserLTVCap();

        adapter.borrowFromAave(amount);

        uint256 sharesToMint = totalDebtShares == 0
            ? amount
            : Math.mulDiv(amount, totalDebtShares, debtValueBefore, Math.Rounding.Ceil);
        debtShares[msg.sender] += sharesToMint;
        totalDebtShares += sharesToMint;

        idleBalance[msg.sender] += amount;

        _assertHealthFactorSafe();

        emit Borrowed(msg.sender, amount, sharesToMint);
    }

    function repay(uint256 amount, bool fromIdleBalance_) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _repay(msg.sender, amount, fromIdleBalance_);
    }

    function repayAllDebt(bool fromIdleBalance_) external nonReentrant {
        uint256 debtValue = debtValueOf(msg.sender);
        if (debtValue == 0) revert NoOutstandingDebt();
        _repay(msg.sender, debtValue, fromIdleBalance_);
    }

    function _repay(address user, uint256 amount, bool fromIdleBalance_) internal {
        uint256 debtValueBefore = adapter.totalDebtValue();
        uint256 userDebtValue = totalDebtShares == 0
            ? 0
            : Math.mulDiv(debtShares[user], debtValueBefore, totalDebtShares, Math.Rounding.Ceil);
        if (userDebtValue == 0) revert NoOutstandingDebt();

        uint256 effectiveAmount = amount > userDebtValue ? userDebtValue : amount;

        if (fromIdleBalance_) {
            if (effectiveAmount > unallocatedIdleBalance(user)) revert InsufficientUnallocatedBalance();
            idleBalance[user] -= effectiveAmount;
        } else {
            asset.safeTransferFrom(user, address(this), effectiveAmount);
        }

        // Use Ceil rounding to prevent dust accumulation of debt shares.
        // Floor rounding could leave 1 wei of debt shares per repayment,
        // which compounds over time and creates irrecoverable dust.
        uint256 sharesToBurn = Math.mulDiv(effectiveAmount, totalDebtShares, debtValueBefore, Math.Rounding.Ceil);
        if (sharesToBurn > debtShares[user]) {
            sharesToBurn = debtShares[user];
        }
        debtShares[user] -= sharesToBurn;
        totalDebtShares -= sharesToBurn;

        asset.forceApprove(address(adapter), effectiveAmount);
        uint256 repaidOnAave = adapter.repayToAave(effectiveAmount);

        emit Repaid(user, effectiveAmount, sharesToBurn, repaidOnAave);
    }

    function _assertHealthFactorSafe() internal view {
        if (totalDebtShares > 0) {
            if (adapter.getHealthFactor() < minHealthFactorBuffer) revert InsufficientHealthFactorBuffer();
        }
    }

    // ---------------------------------------------------------------------
    // Recurring deposits
    // ---------------------------------------------------------------------

    function setRecurringSchedule(uint256 amount, uint256 intervalSeconds) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (intervalSeconds < MIN_RECURRING_INTERVAL) revert IntervalTooShort();
        recurringSchedules[msg.sender] = RecurringSchedule({
            amount: amount,
            intervalSeconds: intervalSeconds,
            lastExecuted: block.timestamp,
            active: true
        });
        emit RecurringScheduleSet(msg.sender, amount, intervalSeconds);
    }

    function cancelRecurringSchedule() external {
        recurringSchedules[msg.sender].active = false;
        emit RecurringScheduleCancelled(msg.sender);
    }

    function executeRecurringDeposit(address user) external onlyRole(OPERATOR_ROLE) whenNotPaused nonReentrant {
        RecurringSchedule storage s = recurringSchedules[user];
        if (!s.active) revert ScheduleNotActive();
        if (block.timestamp < s.lastExecuted + s.intervalSeconds) revert ScheduleTooEarly();

        s.lastExecuted = block.timestamp;
        uint256 amount = s.amount;

        asset.safeTransferFrom(user, address(this), amount);
        idleBalance[user] += amount;

        emit RecurringDepositExecuted(user, amount);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function unallocatedIdleBalance(address user) public view returns (uint256) {
        uint256 allocated = address(goalManager) == address(0) ? 0 : goalManager.totalAllocated(user);
        return idleBalance[user] - allocated;
    }

    function _supplyValueOf(address user) internal view returns (uint256) {
        if (totalSupplyShares == 0) return 0;
        return Math.mulDiv(supplyShares[user], adapter.totalSuppliedValue(), totalSupplyShares, Math.Rounding.Floor);
    }

    function yieldValueOf(address user) public view returns (uint256) {
        return _supplyValueOf(user);
    }

    function debtValueOf(address user) public view returns (uint256) {
        if (totalDebtShares == 0) return 0;
        return Math.mulDiv(debtShares[user], adapter.totalDebtValue(), totalDebtShares, Math.Rounding.Ceil);
    }

    function maxBorrowable(address user) external view returns (uint256) {
        uint256 collateral = _supplyValueOf(user);
        uint256 debt = debtValueOf(user);
        uint256 cap = Math.mulDiv(collateral, maxUserLTVBps, BPS_DENOMINATOR, Math.Rounding.Floor);
        return cap > debt ? cap - debt : 0;
    }

    function getUserPosition(address user)
        external
        view
        returns (
            uint256 idle,
            uint256 unallocated,
            uint256 yieldValue,
            uint256 debtValue,
            uint256 allocatedToGoals
        )
    {
        idle = idleBalance[user];
        allocatedToGoals = address(goalManager) == address(0) ? 0 : goalManager.totalAllocated(user);
        unallocated = idle - allocatedToGoals;
        yieldValue = _supplyValueOf(user);
        debtValue = debtValueOf(user);
    }

    // ---------------------------------------------------------------------
    // Challenge integration
    // ---------------------------------------------------------------------

    function _recordChallengeProgress(address user, uint256 challengeId, uint256 amount) internal {
        if (address(challengeManager) == address(0)) revert ChallengeManagerNotSet();
        challengeManager.recordProgress(user, challengeId, amount);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setRiskParams(uint256 newMaxUserLTVBps, uint256 newMinHealthFactorBuffer)
        external
        onlyRole(RISK_MANAGER_ROLE)
    {
        if (newMaxUserLTVBps == 0 || newMaxUserLTVBps > MAX_USER_LTV_BPS_HARD_CAP) revert InvalidRiskParam();
        if (newMinHealthFactorBuffer < MIN_HEALTH_FACTOR_FLOOR) revert InvalidRiskParam();
        maxUserLTVBps = newMaxUserLTVBps;
        minHealthFactorBuffer = newMinHealthFactorBuffer;
        emit RiskParamsUpdated(newMaxUserLTVBps, newMinHealthFactorBuffer);
    }

    function setAdapter(address newAdapter) external onlyRole(GOVERNANCE_ROLE) {
        if (newAdapter == address(0)) revert ZeroAddress();
        if (totalSupplyShares != 0 || totalDebtShares != 0) revert AdapterMigrationBlocked();
        address previous = address(adapter);
        adapter = IPiggyAaveV3Adapter(newAdapter);
        emit AdapterUpdated(previous, newAdapter);
    }

    function setGoalManager(address manager) external onlyRole(GOVERNANCE_ROLE) {
        if (manager == address(0)) revert ZeroAddress();
        address previous = address(goalManager);
        goalManager = IGoalManager(manager);
        emit GoalManagerUpdated(previous, manager);
    }

    function setChallengeManager(address manager) external onlyRole(GOVERNANCE_ROLE) {
        if (manager == address(0)) revert ZeroAddress();
        address previous = address(challengeManager);
        challengeManager = IChallengeManager(manager);
        emit ChallengeManagerUpdated(previous, manager);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setTotalDepositCap(uint256 newCap) external onlyRole(RISK_MANAGER_ROLE) {
        if (newCap < asset.balanceOf(address(this))) {
            revert CapExceedsCurrentBalance();
        }
        maxTotalDeposits = newCap;
        emit TotalDepositCapUpdated(newCap);
    }

    function rescueToken(address token, uint256 amount, address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(asset)) revert CannotRescueVaultAsset();
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit TokenRescued(token, amount, to);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
