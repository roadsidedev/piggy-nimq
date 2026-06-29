// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "../utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IAaveV3Pool} from "../interfaces/IAaveV3Pool.sol";

/// @title PiggyAaveV3Adapter
/// @notice Isolates every direct interaction with the Aave V3 Pool behind a narrow,
///         vault-only interface. Holds ONE pooled position on Aave (aggregating all
///         Piggy users who have yield enabled) and reports its current value back to
///         the vault, which performs all per-user accounting itself.
///
/// @dev TRUST MODEL / KNOWN DESIGN TRADE-OFF (read before deploying with real funds):
///      This adapter holds a single shared Aave position on behalf of all yield-enabled
///      depositors. This is gas-efficient but means collateral and debt are POOLED:
///      the health factor returned by Aave reflects the combined effect of every user's
///      borrow, not any one user's individually. PiggyVault MUST enforce a conservative
///      per-user LTV cap and a global health-factor safety buffer well above Aave's own
///      liquidation threshold (1e18) — see PiggyVault's risk parameters. Isolating each
///      user into their own minimal-proxy position is the recommended hardening path
///      before scaling deposits materially; it is out of scope for this v1.
///
///      Risk-reducing actions (withdraw, repay) are intentionally NEVER blocked by pause,
///      even during an emergency halt — only risk-increasing actions (supply, borrow) are
///      gated. A custodial contract must never trap users in a position they can't exit.
contract PiggyAaveV3Adapter is
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

    /// @notice Granted exclusively to the PiggyVault contract. Intended to be held by
    ///         exactly one address in production.
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    /// @notice Allowed to update the vault pointer. In production this role should be
    ///         held by a timelock/multisig, not a single EOA — see {setVault}.
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    IAaveV3Pool public pool;
    IERC20 public asset; // e.g. USDC on Polygon
    IERC20 public aToken; // interest-bearing receipt token for `asset`
    IERC20 public variableDebtToken; // interest-accruing debt token for `asset`
    address public vault;

    uint16 private constant REFERRAL_CODE = 0;
    uint256 private constant VARIABLE_RATE_MODE = 2;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event SuppliedToAave(uint256 amount);
    event WithdrawnFromAave(uint256 requested, uint256 actual);
    event BorrowedFromAave(uint256 amount);
    event RepaidToAave(uint256 requested, uint256 actual);
    event VaultUpdated(address indexed previousVault, address indexed newVault);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error ZeroAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param admin Address granted DEFAULT_ADMIN_ROLE, PAUSER_ROLE, UPGRADER_ROLE, GOVERNANCE_ROLE at deploy.
    ///        In production this MUST be a multisig/timelock, never a single hot EOA.
    /// @param vaultAddress The PiggyVault contract this adapter will exclusively serve.
    /// @param aavePool Address of the deployed Aave V3 Pool proxy.
    /// @param underlyingAsset The token this adapter supplies/borrows (e.g. native USDC on Polygon).
    /// @param aTokenAddress The aToken corresponding to `underlyingAsset` on this Aave market.
    /// @param variableDebtTokenAddress The variable-debt token corresponding to `underlyingAsset`.
    /// @dev IMPORTANT: this contract does NOT verify on-chain that `aTokenAddress` and
    ///      `variableDebtTokenAddress` actually correspond to `underlyingAsset` on `aavePool` —
    ///      Aave's reserve-data struct layout varies across Pool versions and isn't worth
    ///      replicating here just for a sanity check. The deployment script MUST cross-check
    ///      this pairing against Aave's official Pool Data Provider or app.aave.com before
    ///      calling initialize(); wiring the wrong token address would make every downstream
    ///      balance/health-factor/debt read meaningless.
    function initialize(
        address admin,
        address vaultAddress,
        address aavePool,
        address underlyingAsset,
        address aTokenAddress,
        address variableDebtTokenAddress
    ) external initializer {
        if (
            admin == address(0) ||
            vaultAddress == address(0) ||
            aavePool == address(0) ||
            underlyingAsset == address(0) ||
            aTokenAddress == address(0) ||
            variableDebtTokenAddress == address(0)
        ) revert ZeroAddress();

        __AccessControl_init();
        __Pausable_init();

        pool = IAaveV3Pool(aavePool);
        asset = IERC20(underlyingAsset);
        aToken = IERC20(aTokenAddress);
        variableDebtToken = IERC20(variableDebtTokenAddress);
        vault = vaultAddress;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
        _grantRole(VAULT_ROLE, vaultAddress);
    }

    modifier onlyVault() {
        // Explicit check (rather than relying solely on AccessControl) keeps the
        // single-vault trust assumption obvious at a glance.
        _checkRole(VAULT_ROLE);
        _;
    }

    // ---------------------------------------------------------------------
    // Vault-only Aave operations
    // ---------------------------------------------------------------------

    /// @notice Pulls `amount` of `asset` from the vault and supplies it to Aave on this
    ///         adapter's own behalf, growing the shared pooled position.
    function supplyToAave(uint256 amount) external onlyVault whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();

        asset.safeTransferFrom(vault, address(this), amount);

        asset.forceApprove(address(pool), amount);
        pool.supply(address(asset), amount, address(this), REFERRAL_CODE);
        // Defensive: Aave should consume the full allowance; zero out any dust to avoid
        // leaving a stale non-zero approval sitting on the Pool.
        asset.forceApprove(address(pool), 0);

        emit SuppliedToAave(amount);
    }

    /// @notice Redeems `amount` of the pooled aToken position and sends the underlying
    ///         asset back to the vault. Pass `type(uint256).max` to withdraw everything.
    /// @dev Never paused — users must always be able to exit to idle balance.
    function withdrawFromAave(uint256 amount) external onlyVault nonReentrant returns (uint256 withdrawn) {
        if (amount == 0) revert ZeroAmount();
        withdrawn = pool.withdraw(address(asset), amount, vault);
        emit WithdrawnFromAave(amount, withdrawn);
    }

    /// @notice Borrows `amount` of `asset` against the pooled collateral and forwards it
    ///         to the vault. Debt is attributed to this adapter (pooled), not to any
    ///         individual end user — PiggyVault enforces per-user limits before calling this.
    function borrowFromAave(uint256 amount) external onlyVault whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        pool.borrow(address(asset), amount, VARIABLE_RATE_MODE, REFERRAL_CODE, address(this));
        asset.safeTransfer(vault, amount);
        emit BorrowedFromAave(amount);
    }

    /// @notice Pulls `amount` from the vault and repays pooled Aave debt.
    ///         Pass `type(uint256).max` to repay the full outstanding balance.
    /// @dev Never paused — repaying debt always reduces risk and must stay available.
    function repayToAave(uint256 amount) external onlyVault nonReentrant returns (uint256 repaid) {
        if (amount == 0) revert ZeroAmount();

        // For a max-repay, pull a generous upper bound and refund any unused amount —
        // we cannot know the exact owed amount in the same transaction without an extra
        // external call, so the vault is expected to pass a concrete, pre-quoted amount
        // in the common case and only use max-repay with an amount it is willing to have
        // partially refunded.
        asset.safeTransferFrom(vault, address(this), amount);
        asset.forceApprove(address(pool), amount);
        repaid = pool.repay(address(asset), amount, VARIABLE_RATE_MODE, address(this));
        asset.forceApprove(address(pool), 0);

        uint256 leftover = amount - repaid;
        if (leftover > 0) {
            asset.safeTransfer(vault, leftover);
        }

        emit RepaidToAave(amount, repaid);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Current value of the pooled position, in underlying-asset units.
    ///         aToken balances auto-accrue interest 1:1 with underlying, so this is
    ///         simply the live aToken balance held by this contract.
    function totalSuppliedValue() external view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /// @notice Current outstanding pooled debt, in underlying-asset units. Deliberately
    ///         read directly from the variable-debt token balance (which auto-accrues
    ///         interest 1:1 with underlying) rather than from Aave's USD-denominated
    ///         account-data fields, to avoid any dependency on price-oracle precision
    ///         for what is otherwise an exact, asset-denominated figure.
    function totalDebtValue() external view returns (uint256) {
        return variableDebtToken.balanceOf(address(this));
    }

    /// @notice Aave's reported health factor for the pooled position, scaled by 1e18.
    ///         Liquidation occurs at or below 1e18. PiggyVault should never let actions
    ///         bring this anywhere near that boundary — see its safety buffer constant.
    function getHealthFactor() external view returns (uint256 healthFactor) {
        (, , , , , healthFactor) = pool.getUserAccountData(address(this));
    }

    /// @notice Full Aave account snapshot for the pooled position.
    function getAccountData()
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        return pool.getUserAccountData(address(this));
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    /// @notice One-time-in-practice pointer update to the vault contract.
    /// @dev Extremely sensitive: the new address gains full pull/push authority over
    ///      every asset this adapter custodies. MUST be behind a timelock/multisig in
    ///      production, and should only ever be called as part of a deliberate, reviewed
    ///      vault migration — never as routine maintenance.
    function setVault(address newVault) external onlyRole(GOVERNANCE_ROLE) {
        if (newVault == address(0)) revert ZeroAddress();
        address previous = vault;
        vault = newVault;
        if (previous != address(0)) {
            _revokeRole(VAULT_ROLE, previous);
        }
        _grantRole(VAULT_ROLE, newVault);
        emit VaultUpdated(previous, newVault);
    }

    /// @notice Blocks new supply/borrow. Withdraw/repay remain available — see contract NatSpec.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
