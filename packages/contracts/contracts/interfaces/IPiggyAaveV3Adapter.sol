// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPiggyAaveV3Adapter
/// @notice The narrow surface PiggyVault needs from its adapter. Kept separate from the
///         adapter's full implementation so the vault's compiled interface can't drift
///         from what it actually calls.
interface IPiggyAaveV3Adapter {
    function supplyToAave(uint256 amount) external;
    function withdrawFromAave(uint256 amount) external returns (uint256 withdrawn);
    function borrowFromAave(uint256 amount) external;
    function repayToAave(uint256 amount) external returns (uint256 repaid);

    function totalSuppliedValue() external view returns (uint256);
    function totalDebtValue() external view returns (uint256);
    function getHealthFactor() external view returns (uint256 healthFactor);
}
