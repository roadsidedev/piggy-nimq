// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IChallengeManager
/// @notice Interface for the Piggy ChallengeManager — tracks group savings challenges,
///         member progress, streaks, and leaderboards. Challenges are accounting overlays
///         (no funds are ever custodied here); actual value always lives in PiggyVault.
///
/// @dev LEADERBOARD DESIGN:
///      {getLeaderboard} returns members in insertion order, NOT sorted by score.
///      On-chain sorting is unscalable for social features — use an off-chain indexer
///      (Graph protocol, backend, etc.) to compute composite scores
///      (e.g. totalSaved × (1 + 0.1 × currentStreak)) for ranked display.
///      Raw fields (totalSaved, currentStreak, longestStreak) are available via
///      {getMemberProgress} for any client-side scoring formula.
interface IChallengeManager {
    enum Frequency { DAILY, WEEKLY, MONTHLY }

    struct ChallengeConfig {
        string name;
        uint256 targetAmount;
        uint256 durationDays;
        Frequency frequency;
        uint256 maxMembers;
        bool isPublic;
    }

    struct MemberProgress {
        bool isMember;
        uint96 totalSaved;
        uint40 lastActivity;
        uint16 currentStreak;
        uint16 longestStreak;
    }

    function createChallenge(
        string calldata name,
        uint256 targetAmount,
        uint256 durationDays,
        Frequency frequency,
        uint256 maxMembers,
        bool isPublic
    ) external returns (uint256 challengeId);

    function joinChallenge(uint256 challengeId) external;
    function leaveChallenge(uint256 challengeId) external;
    function addMember(uint256 challengeId, address member) external;
    function removeMember(uint256 challengeId, address member) external;
    function recordProgress(address user, uint256 challengeId, uint256 amount) external;
    function endChallenge(uint256 challengeId) external;

    function getChallenge(uint256 challengeId) external view returns (
        string memory name,
        uint256 targetAmount,
        uint256 durationDays,
        uint64 startDate,
        uint64 endDate,
        Frequency frequency,
        bool isActive,
        bool isPublic,
        uint256 maxMembers,
        address owner,
        uint256 memberCount
    );

    function getMemberProgress(uint256 challengeId, address member)
        external view returns (MemberProgress memory);

    /// @notice Returns all members and their progress in **insertion order** (unsorted).
    ///         Use off-chain sorting for ranked display.
    function getLeaderboard(uint256 challengeId) external view
        returns (address[] memory members, MemberProgress[] memory progress);

    function getUserChallenges(address user) external view returns (uint256[] memory);
    function challengeCount() external view returns (uint256);
    function isVault(address) external view returns (bool);
}
