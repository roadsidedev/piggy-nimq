// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "./utils/ReentrancyGuardUpgradeable.sol";

import {IChallengeManager} from "./interfaces/IChallengeManager.sol";

/// @title PiggyChallengeManager
/// @notice Tracks group savings challenges, member progress, streaks, and leaderboards.
///         Actual funds are held in PiggyVault — this contract is a pure accounting layer.
///
/// @dev LEADERBOARD DESIGN:
///      {getLeaderboard} returns members in insertion order (no on-chain sort).
///      See IChallengeManager for the rationale. Use an off-chain indexer
///      (Graph protocol, backend API, etc.) for ranked display with composite scoring.
///
///      STREAK TRACKING: A streak advances when {recordProgress} is called within
///      the frequency window (plus a 50% grace period) since the member's last activity.
///      If the gap exceeds the grace period, the streak resets to 1.
contract PiggyChallengeManager is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    IChallengeManager
{
    // ---------------------------------------------------------------------
    // Roles
    // ---------------------------------------------------------------------

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    uint256 public constant STREAK_GRACE_BPS = 5_000;
    uint256 public constant MAX_MEMBERS_PER_CHALLENGE = 1_000;
    uint256 public constant MAX_NAME_LENGTH = 64;

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    struct ChallengeData {
        string name;
        uint256 targetAmount;
        uint256 durationDays;
        uint64 startDate;
        uint64 endDate;
        Frequency frequency;
        bool isActive;
        bool isPublic;
        uint256 maxMembers;
        address owner;
        uint256 memberCount;
    }

    mapping(uint256 => ChallengeData) private _challenges;
    mapping(uint256 => mapping(address => MemberProgress)) private _members;
    mapping(uint256 => address[]) private _memberList;
    mapping(address => uint256[]) private _userChallenges;
    uint256 private _nextChallengeId;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event ChallengeCreated(uint256 indexed challengeId, string name, address indexed owner, uint256 targetAmount, uint256 durationDays, Frequency frequency, bool isPublic);
    event MemberJoined(uint256 indexed challengeId, address indexed member);
    event MemberLeft(uint256 indexed challengeId, address indexed member);
    event MemberAdded(uint256 indexed challengeId, address indexed member, address indexed adder);
    event MemberRemoved(uint256 indexed challengeId, address indexed member, address indexed remover);
    event ProgressRecorded(uint256 indexed challengeId, address indexed user, uint256 amount, uint256 streak);
    event ChallengeEnded(uint256 indexed challengeId);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error ZeroAmount();
    error ZeroTarget();
    error NameTooLong();
    error ChallengeNotActive();
    error ChallengeNotPublic();
    error ChallengeExpired();
    error ChallengeAlreadyEnded();
    error ChallengeFull();
    error AlreadyMember();
    error NotMember();
    error MaxMembersExceeded();
    error DurationOutOfBounds();
    error NotChallengeOwner();
    error EmptyLeaderboard();
    error InvalidFrequency();
    error AmountOverflow();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) external initializer {
        if (admin == address(0)) revert ZeroAddress();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    // ---------------------------------------------------------------------
    // Challenge lifecycle
    // ---------------------------------------------------------------------

    /// @inheritdoc IChallengeManager
    function createChallenge(
        string calldata name,
        uint256 targetAmount,
        uint256 durationDays,
        Frequency frequency,
        uint256 maxMembers,
        bool isPublic
    ) external nonReentrant returns (uint256 challengeId) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) revert NameTooLong();
        if (targetAmount == 0) revert ZeroTarget();
        if (durationDays == 0 || durationDays > 365) revert DurationOutOfBounds();
        if (maxMembers == 0 || maxMembers > MAX_MEMBERS_PER_CHALLENGE) revert MaxMembersExceeded();

        uint64 startDate = uint64(block.timestamp);
        uint64 endDate = uint64(block.timestamp + durationDays * 1 days);

        challengeId = ++_nextChallengeId;
        _challenges[challengeId] = ChallengeData({
            name: name,
            targetAmount: targetAmount,
            durationDays: durationDays,
            startDate: startDate,
            endDate: endDate,
            frequency: frequency,
            isActive: true,
            isPublic: isPublic,
            maxMembers: maxMembers,
            owner: msg.sender,
            memberCount: 0
        });

        _addMember(challengeId, msg.sender);
        emit ChallengeCreated(challengeId, name, msg.sender, targetAmount, durationDays, frequency, isPublic);
    }

    /// @inheritdoc IChallengeManager
    function joinChallenge(uint256 challengeId) external nonReentrant {
        ChallengeData storage c = _challenges[challengeId];
        if (!c.isActive) {
            if (block.timestamp > c.endDate) revert ChallengeExpired();
            revert ChallengeAlreadyEnded();
        }
        if (!c.isPublic) revert ChallengeNotPublic();
        if (_members[challengeId][msg.sender].isMember) revert AlreadyMember();
        if (c.maxMembers > 0 && c.memberCount >= c.maxMembers) revert ChallengeFull();

        _addMember(challengeId, msg.sender);
        emit MemberJoined(challengeId, msg.sender);
    }

    /// @inheritdoc IChallengeManager
    function leaveChallenge(uint256 challengeId) external nonReentrant {
        if (!_members[challengeId][msg.sender].isMember) revert NotMember();
        if (_challenges[challengeId].owner == msg.sender) revert NotChallengeOwner();

        _removeMember(challengeId, msg.sender);
        emit MemberLeft(challengeId, msg.sender);
    }

    /// @inheritdoc IChallengeManager
    function addMember(uint256 challengeId, address member) external nonReentrant {
        if (member == address(0)) revert ZeroAddress();
        if (_challenges[challengeId].owner != msg.sender) revert NotChallengeOwner();
        ChallengeData storage c = _challenges[challengeId];
        if (!c.isActive) {
            if (block.timestamp > c.endDate) revert ChallengeExpired();
            revert ChallengeAlreadyEnded();
        }
        if (_members[challengeId][member].isMember) revert AlreadyMember();
        if (c.maxMembers > 0 && c.memberCount >= c.maxMembers) revert ChallengeFull();

        _addMember(challengeId, member);
        emit MemberAdded(challengeId, member, msg.sender);
    }

    /// @inheritdoc IChallengeManager
    function removeMember(uint256 challengeId, address member) external nonReentrant {
        if (!_members[challengeId][member].isMember) revert NotMember();
        if (_challenges[challengeId].owner != msg.sender) revert NotChallengeOwner();

        _removeMember(challengeId, member);
        emit MemberRemoved(challengeId, member, msg.sender);
    }

    /// @inheritdoc IChallengeManager
    function endChallenge(uint256 challengeId) external nonReentrant {
        ChallengeData storage c = _challenges[challengeId];
        if (!c.isActive) {
            if (block.timestamp > c.endDate) revert ChallengeExpired();
            revert ChallengeAlreadyEnded();
        }
        if (c.owner != msg.sender) revert NotChallengeOwner();

        c.isActive = false;
        emit ChallengeEnded(challengeId);
    }

    // ---------------------------------------------------------------------
    // Progress tracking
    // ---------------------------------------------------------------------

    /// @inheritdoc IChallengeManager
    function recordProgress(address user, uint256 challengeId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (user == address(0)) revert ZeroAddress();

        if (msg.sender != user && !hasRole(VAULT_ROLE, msg.sender)) {
            revert AccessControlBadConfirmation();
        }

        ChallengeData storage c = _challenges[challengeId];
        if (!c.isActive) {
            if (block.timestamp > c.endDate) revert ChallengeExpired();
            revert ChallengeAlreadyEnded();
        }
        if (!_members[challengeId][user].isMember) revert NotMember();

        MemberProgress storage p = _members[challengeId][user];
        uint256 newStreak = _computeStreak(p, c.frequency);
        // SAFE: validate that amount fits in uint96 before casting to prevent silent truncation
        if (uint256(uint96(amount)) != amount) revert AmountOverflow();
        p.totalSaved += uint96(amount);
        p.lastActivity = uint40(block.timestamp);
        p.currentStreak = uint16(newStreak);
        if (newStreak > p.longestStreak) {
            p.longestStreak = uint16(newStreak);
        }

        emit ProgressRecorded(challengeId, user, amount, newStreak);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @inheritdoc IChallengeManager
    function getChallenge(uint256 challengeId)
        external view returns (
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
        )
    {
        ChallengeData storage c = _challenges[challengeId];
        return (c.name, c.targetAmount, c.durationDays, c.startDate, c.endDate, c.frequency, c.isActive, c.isPublic, c.maxMembers, c.owner, c.memberCount);
    }

    /// @inheritdoc IChallengeManager
    function getMemberProgress(uint256 challengeId, address member)
        external view returns (MemberProgress memory)
    {
        return _members[challengeId][member];
    }

    /// @inheritdoc IChallengeManager
    function getLeaderboard(uint256 challengeId)
        external view returns (address[] memory members, MemberProgress[] memory progress)
    {
        address[] storage memberList = _memberList[challengeId];
        uint256 count = memberList.length;
        if (count == 0) revert EmptyLeaderboard();

        members = new address[](count);
        progress = new MemberProgress[](count);

        for (uint256 i = 0; i < count; i++) {
            address m = memberList[i];
            members[i] = m;
            progress[i] = _members[challengeId][m];
        }
    }

    /// @inheritdoc IChallengeManager
    function getUserChallenges(address user) external view returns (uint256[] memory) {
        return _userChallenges[user];
    }

    /// @inheritdoc IChallengeManager
    function challengeCount() external view returns (uint256) {
        return _nextChallengeId;
    }

    /// @inheritdoc IChallengeManager
    function isVault(address addr) external view returns (bool) {
        return hasRole(VAULT_ROLE, addr);
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _addMember(uint256 challengeId, address member) internal {
        _members[challengeId][member] = MemberProgress({isMember: true, totalSaved: 0, lastActivity: 0, currentStreak: 0, longestStreak: 0});
        _memberList[challengeId].push(member);
        _userChallenges[member].push(challengeId);
        _challenges[challengeId].memberCount++;
    }

    function _removeMember(uint256 challengeId, address member) internal {
        delete _members[challengeId][member];
        _challenges[challengeId].memberCount--;

        address[] storage memberList = _memberList[challengeId];
        uint256 len = memberList.length;
        for (uint256 i = 0; i < len; i++) {
            if (memberList[i] == member) {
                memberList[i] = memberList[len - 1];
                memberList.pop();
                break;
            }
        }

        _removeFromUserList(member, challengeId);
    }

    function _removeFromUserList(address user, uint256 challengeId) internal {
        uint256[] storage challenges = _userChallenges[user];
        uint256 len = challenges.length;
        for (uint256 i = 0; i < len; i++) {
            if (challenges[i] == challengeId) {
                challenges[i] = challenges[len - 1];
                challenges.pop();
                break;
            }
        }
    }

    function _computeStreak(MemberProgress storage p, Frequency frequency) internal view returns (uint256) {
        if (p.lastActivity == 0) return 1;

        uint256 window = _frequencyWindow(frequency);
        uint256 maxGap = window + (window * STREAK_GRACE_BPS) / 10_000;

        if (block.timestamp <= p.lastActivity + maxGap) {
            return p.currentStreak + 1;
        }
        return 1;
    }

    function _frequencyWindow(Frequency frequency) internal pure returns (uint256) {
        if (frequency == Frequency.DAILY) return 1 days;
        if (frequency == Frequency.WEEKLY) return 7 days;
        if (frequency == Frequency.MONTHLY) return 30 days;
        revert InvalidFrequency();
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setVault(address vaultAddress, bool authorized) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (vaultAddress == address(0)) revert ZeroAddress();
        if (authorized) _grantRole(VAULT_ROLE, vaultAddress);
        else _revokeRole(VAULT_ROLE, vaultAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
