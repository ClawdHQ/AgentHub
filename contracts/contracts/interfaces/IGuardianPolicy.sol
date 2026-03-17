// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IGuardianPolicy
/// @notice Interface for the GuardianPolicy contract that enforces AI agent risk policies
interface IGuardianPolicy {
    enum RiskTier { CONSERVATIVE, MODERATE, AGGRESSIVE }

    struct Policy {
        RiskTier tier;
        uint256 maxSingleTxValue;
        uint256 maxDailyVolume;
        address[] allowedProtocols;
        bytes4[] allowedSelectors;
        bool xcmEnabled;
        uint256 createdAt;
        uint256 updatedAt;
    }

    event PolicyCreated(address indexed agent, RiskTier tier);
    event PolicyViolation(address indexed agent, address target, bytes4 selector, string reason);
    event PolicyUpdated(address indexed agent, RiskTier newTier);

    function validateOperation(
        address agent,
        address target,
        bytes calldata callData,
        uint256 value
    ) external returns (bool valid, string memory reason);

    function getPolicy(address agent) external view returns (Policy memory);
    function setPolicy(address agent, Policy calldata policy) external;
    function getRiskTier(address agent) external view returns (RiskTier);
}
