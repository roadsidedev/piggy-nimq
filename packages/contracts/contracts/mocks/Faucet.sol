// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockERC20} from "./MockERC20.sol";

contract Faucet {
    MockERC20 public token;
    uint256 public dripAmount = 1000 * 10 ** 6; // 1000 USDT (6 decimals)
    uint256 public cooldown = 24 hours;

    mapping(address => uint256) public lastDrip;

    event Dripped(address indexed to, uint256 amount);
    event DripAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    constructor(address _token) {
        token = MockERC20(_token);
    }

    function drip(address to) external {
        if (block.timestamp < lastDrip[to] + cooldown) {
            revert("Faucet: cooldown not elapsed");
        }
        lastDrip[to] = block.timestamp;
        token.mint(to, dripAmount);
        emit Dripped(to, dripAmount);
    }

    function setDripAmount(uint256 newAmount) external {
        dripAmount = newAmount;
        emit DripAmountUpdated(dripAmount, newAmount);
    }

    function setCooldown(uint256 newCooldown) external {
        cooldown = newCooldown;
        emit CooldownUpdated(cooldown, newCooldown);
    }
}
