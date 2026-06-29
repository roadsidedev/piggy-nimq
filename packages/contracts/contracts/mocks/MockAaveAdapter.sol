// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title MockAaveAdapter
/// @notice Minimal mock of PiggyAaveV3Adapter for testing PiggyVault in isolation.
///         Tracks a simple supply balance (no interest accrual) and an optional debt
///         balance. Always reports health factor = 2e18 (safe) unless debt > supply.
contract MockAaveAdapter {
    using SafeERC20 for IERC20;

    IERC20 public asset;
    uint256 public supplied;
    uint256 public borrowed;
    address public vault;

    constructor() {}

    function setVault(address _vault) external {
        vault = _vault;
    }

    function setAsset(address _asset) external {
        asset = IERC20(_asset);
    }

    function supplyToAave(uint256 amount) external {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        supplied += amount;
    }

    function withdrawFromAave(uint256 amount) external returns (uint256) {
        uint256 actual = amount > supplied ? supplied : amount;
        supplied -= actual;
        asset.safeTransfer(msg.sender, actual);
        return actual;
    }

    function borrowFromAave(uint256 amount) external {
        borrowed += amount;
        asset.safeTransfer(msg.sender, amount);
    }

    function repayToAave(uint256 amount) external returns (uint256) {
        uint256 actual = amount > borrowed ? borrowed : amount;
        borrowed -= actual;
        asset.safeTransferFrom(msg.sender, address(this), actual);
        return actual;
    }

    function totalSuppliedValue() external view returns (uint256) {
        return supplied;
    }

    function totalDebtValue() external view returns (uint256) {
        return borrowed;
    }

    function getHealthFactor() public view returns (uint256) {
        if (borrowed == 0) return type(uint256).max;
        if (supplied == 0) return 0;
        return (supplied * 1e18) / borrowed;
    }

    function getAccountData()
        external
        view
        returns (uint256, uint256, uint256, uint256, uint256, uint256)
    {
        uint256 hf = getHealthFactor();
        return (supplied, borrowed, supplied > borrowed ? supplied - borrowed : 0, 8500, 7500, hf);
    }
}
