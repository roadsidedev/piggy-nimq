// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ReentrancyGuardUpgradeable
/// @notice Proxy-safe reentrancy guard (no constructor). Drop-in replacement for
///         OpenZeppelin's ReentrancyGuardUpgradeable (removed in OZ v5.6.1).
///         Uses storage slot to avoid constructor requirement.
/// @dev The guard is initially unlocked (slot = 0). The modifier checks
///      `slot != ENTERED` — since `0 != 2`, the first call passes without
///      any constructor-based initialization.
abstract contract ReentrancyGuardUpgradeable {
    error ReentrancyGuardReentrantCall();

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    bytes32 private constant _REENTRANCY_GUARD_SLOT =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        uint256 status;
        assembly {
            status := sload(_REENTRANCY_GUARD_SLOT)
        }
        if (status == _ENTERED) revert ReentrancyGuardReentrantCall();
        assembly {
            sstore(_REENTRANCY_GUARD_SLOT, _ENTERED)
        }
    }

    function _nonReentrantAfter() private {
        assembly {
            sstore(_REENTRANCY_GUARD_SLOT, _NOT_ENTERED)
        }
    }
}
