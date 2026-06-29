// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAaveV3Pool
/// @notice Minimal interface onto the deployed Aave V3 Pool contract.
/// @dev Intentionally narrow: only the functions PiggyAaveV3Adapter actually calls.
///      Matches the real Aave V3 Pool ABI (https://docs.aave.com) — this is a functional
///      interface declaration against a public, already-deployed protocol, not a copy
///      of Aave's source code.
interface IAaveV3Pool {
    /// @notice Supplies `amount` of `asset` into Aave, crediting aTokens to `onBehalfOf`.
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /// @notice Withdraws `amount` of `asset`, burning the caller's aTokens, sending underlying to `to`.
    /// @dev Pass `amount = type(uint256).max` to withdraw the entire aToken balance.
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /// @notice Borrows `amount` of `asset` against the caller's collateral, debt attributed to `onBehalfOf`.
    /// @dev interestRateMode: 2 = variable rate (Aave V3 removed stable-rate borrowing on most markets).
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;

    /// @notice Repays `amount` of `asset` debt on behalf of `onBehalfOf`.
    /// @dev Pass `amount = type(uint256).max` to repay the full outstanding debt.
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);

    /// @notice Returns the caller's aggregated account data across all supplied/borrowed assets.
    /// @return totalCollateralBase Total collateral value, in the Pool's base currency units.
    /// @return totalDebtBase Total debt value, in the Pool's base currency units.
    /// @return availableBorrowsBase Remaining borrowing power, in the Pool's base currency units.
    /// @return currentLiquidationThreshold Weighted liquidation threshold, in basis points (e.g. 8500 = 85%).
    /// @return ltv Weighted loan-to-value, in basis points.
    /// @return healthFactor Health factor scaled by 1e18. Liquidation occurs at or below 1e18.
    function getUserAccountData(address user)
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );
}

/// @title IAaveV3PoolDataProvider
/// @notice Minimal interface onto Aave's Pool Data Provider, used to read the live aToken balance
///         (which auto-accrues interest) for a specific reserve held by a specific account.
interface IAaveV3PoolDataProvider {
    function getUserReserveData(address asset, address user)
        external
        view
        returns (
            uint256 currentATokenBalance,
            uint256 currentStableDebt,
            uint256 currentVariableDebt,
            uint256 principalStableDebt,
            uint256 scaledVariableDebt,
            uint256 stableBorrowRate,
            uint256 liquidityRate,
            uint40 stableRateLastUpdated,
            bool usageAsCollateralEnabled
        );
}
