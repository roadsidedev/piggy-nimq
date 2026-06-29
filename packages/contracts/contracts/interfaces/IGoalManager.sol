// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGoalManager
/// @notice Interface for the Piggy GoalManager — tracks savings goals as an accounting
///         overlay on top of PiggyVault idle balances. No funds are ever held here.
interface IGoalManager {
    struct GoalInfo {
        uint256 targetAmount;
        uint64 targetDate;
        uint256 allocated;
        bool active;
    }

    function createGoal(address user, uint256 targetAmount, uint64 targetDate, string calldata name) external returns (uint256 goalId);
    function allocateToGoal(address user, uint256 goalId, uint256 amount) external;
    function deallocateFromGoal(address user, uint256 goalId, uint256 amount) external;
    function closeGoal(address user, uint256 goalId) external;

    function getGoal(address user, uint256 goalId) external view returns (GoalInfo memory);
    function totalAllocated(address user) external view returns (uint256);
    function nextGoalId(address user) external view returns (uint256);
    function isVault(address) external view returns (bool);
}
