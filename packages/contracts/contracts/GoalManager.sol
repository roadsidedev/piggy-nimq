// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "./utils/ReentrancyGuardUpgradeable.sol";

import {IGoalManager} from "./interfaces/IGoalManager.sol";

/// @title PiggyGoalManager
/// @notice Tracks savings goals as a pure accounting overlay on PiggyVault idle balances.
///         Goals earmark part of a user's idle balance — no funds are ever moved or
///         custodied here. The vault queries this contract to determine how much of a
///         user's balance is encumbered and thus non-withdrawable.
///
/// @dev DESIGN DECISIONS:
///      1. ACCOUNTING ONLY — No funds held, no token approvals, no reentrancy risk.
///      2. VAULT-AUTHORIZED MUTATION — Only registered vault contracts (VAULT_ROLE) or
///         the user themselves can allocate/deallocate goal funds. This ensures the vault
///         always stays in sync with goal state.
///      3. GOALS ARE IDLE-ONLY — Yield-enabled balances cannot be goal-allocated. This
///         keeps the accounting simple and avoids compounding the pooled-collateral risk
///         described in PiggyVault's NatSpec.
///      4. name IS EVENT-ONLY — Like the original design, goal names are emitted in
///         events for off-chain indexing and never stored on-chain.
contract PiggyGoalManager is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    IGoalManager
{
    // ---------------------------------------------------------------------
    // Roles
    // ---------------------------------------------------------------------

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    mapping(address => mapping(uint256 => GoalInfo)) private _goals;
    mapping(address => uint256) private _nextGoalId;
    mapping(address => uint256) private _totalAllocatedByUser;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event GoalCreated(address indexed user, uint256 goalId, uint256 targetAmount, uint64 targetDate, string name);
    event GoalAllocated(address indexed user, uint256 goalId, uint256 amount);
    event GoalDeallocated(address indexed user, uint256 goalId, uint256 amount);
    event GoalClosed(address indexed user, uint256 goalId);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error ZeroAmount();
    error ZeroTarget();
    error GoalNotActive();
    error GoalHasAllocation();
    error InsufficientGoalAllocation();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) external initializer {
        if (admin == address(0)) revert ZeroAddress();
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    /// @dev Useless but present so the hardhat-upgrades plugin sees ReentrancyGuard as upgradeable-aware.
    function __ReentrancyGuard_init() internal onlyInitializing {}

    modifier onlyUserOrVault(address user) {
        if (msg.sender != user && !hasRole(VAULT_ROLE, msg.sender)) {
            revert AccessControlBadConfirmation();
        }
        _;
    }

    // ---------------------------------------------------------------------
    // Goal lifecycle
    // ---------------------------------------------------------------------

    /// @inheritdoc IGoalManager
    function createGoal(address user, uint256 targetAmount, uint64 targetDate, string calldata name)
        external
        onlyUserOrVault(user)
        returns (uint256 goalId)
    {
        if (targetAmount == 0) revert ZeroTarget();
        goalId = _nextGoalId[user]++;
        _goals[user][goalId] = GoalInfo({targetAmount: targetAmount, targetDate: targetDate, allocated: 0, active: true});
        emit GoalCreated(user, goalId, targetAmount, targetDate, name);
    }

    /// @inheritdoc IGoalManager
    function allocateToGoal(address user, uint256 goalId, uint256 amount)
        external
        onlyUserOrVault(user)
    {
        if (amount == 0) revert ZeroAmount();
        GoalInfo storage g = _goals[user][goalId];
        if (!g.active) revert GoalNotActive();

        g.allocated += amount;
        _totalAllocatedByUser[user] += amount;

        emit GoalAllocated(user, goalId, amount);
    }

    /// @inheritdoc IGoalManager
    function deallocateFromGoal(address user, uint256 goalId, uint256 amount)
        external
        onlyUserOrVault(user)
    {
        if (amount == 0) revert ZeroAmount();
        GoalInfo storage g = _goals[user][goalId];
        if (amount > g.allocated) revert InsufficientGoalAllocation();

        g.allocated -= amount;
        _totalAllocatedByUser[user] -= amount;

        emit GoalDeallocated(user, goalId, amount);
    }

    /// @inheritdoc IGoalManager
    function closeGoal(address user, uint256 goalId)
        external
        onlyUserOrVault(user)
    {
        GoalInfo storage g = _goals[user][goalId];
        if (!g.active) revert GoalNotActive();
        if (g.allocated != 0) revert GoalHasAllocation();
        g.active = false;
        emit GoalClosed(user, goalId);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @inheritdoc IGoalManager
    function getGoal(address user, uint256 goalId) external view returns (GoalInfo memory) {
        return _goals[user][goalId];
    }

    /// @inheritdoc IGoalManager
    function totalAllocated(address user) external view returns (uint256) {
        return _totalAllocatedByUser[user];
    }

    /// @inheritdoc IGoalManager
    function nextGoalId(address user) external view returns (uint256) {
        return _nextGoalId[user];
    }

    /// @inheritdoc IGoalManager
    function isVault(address addr) external view returns (bool) {
        return hasRole(VAULT_ROLE, addr);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setVault(address vaultAddress, bool authorized) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (vaultAddress == address(0)) revert ZeroAddress();
        if (authorized) {
            _grantRole(VAULT_ROLE, vaultAddress);
        } else {
            _revokeRole(VAULT_ROLE, vaultAddress);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
