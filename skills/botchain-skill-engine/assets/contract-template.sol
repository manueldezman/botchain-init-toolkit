// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BOT Chain Simple Storage
/// @notice Starter boilerplate copied by the botchain-skill-engine skill.
/// @dev Replace the storage logic below with the task's actual requirements.
///      Keep the constructor minimal — the deploy_contract MCP tool passes
///      no constructor args by default unless the agent is told otherwise.
contract SimpleStorage {
    uint256 private value;

    event ValueStored(address indexed setter, uint256 newValue);

    /// @notice Store a new value.
    function store(uint256 newValue) external {
        value = newValue;
        emit ValueStored(msg.sender, newValue);
    }

    /// @notice Retrieve the currently stored value.
    function retrieve() external view returns (uint256) {
        return value;
    }
}
