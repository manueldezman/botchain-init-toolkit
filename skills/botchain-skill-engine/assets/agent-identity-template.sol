// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BOT Chain Agent Identity (TOOLKIT CONVENTION — NOT A NATIVE FEATURE)
/// @notice This is a proposed application-level pattern from
///         @botchain/init-toolkit, not a documented BOT Chain network
///         primitive. BOT Chain's official docs describe a standard
///         BNB-Smart-Chain-fork EVM with no native agent-identity registry.
///         Deploying this contract creates an ordinary application contract
///         that happens to implement this pattern — it is not recognized
///         or enforced by the chain itself. See references/boundary-rules.md.
/// @dev See references/boundary-rules.md for the schema this implements.
///      Fill in maxPerTxValue / maxDailyValue / allowedSelectors before
///      deploying — do not deploy with placeholder zero values.
contract AgentIdentity {
    struct BoundaryPolicy {
        uint256 maxPerTxValue;
        uint256 maxDailyValue;
        bytes4[] allowedSelectors;
    }

    address public immutable agentWalletHandle;
    bytes32 public immutable blueprintCodeHash;
    BoundaryPolicy private policy;

    event IdentityRegistered(address indexed wallet, bytes32 codeHash);

    constructor(
        address _agentWalletHandle,
        bytes32 _blueprintCodeHash,
        uint256 _maxPerTxValue,
        uint256 _maxDailyValue,
        bytes4[] memory _allowedSelectors
    ) {
        require(_agentWalletHandle != address(0), "wallet required");
        agentWalletHandle = _agentWalletHandle;
        blueprintCodeHash = _blueprintCodeHash;
        policy = BoundaryPolicy(_maxPerTxValue, _maxDailyValue, _allowedSelectors);
        emit IdentityRegistered(_agentWalletHandle, _blueprintCodeHash);
    }

    function getPolicy() external view returns (uint256 maxPerTxValue, uint256 maxDailyValue, bytes4[] memory allowedSelectors) {
        BoundaryPolicy memory p = policy;
        return (p.maxPerTxValue, p.maxDailyValue, p.allowedSelectors);
    }
}
