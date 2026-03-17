// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./IUserOperation.sol";

/// @title IAgentAccount
/// @notice Interface for AgentAccount ERC-4337 smart accounts
interface IAgentAccount {
    event AgentExecuted(address indexed target, uint256 value, bytes data, bool success);
    event AgentBlocked(address indexed target, string reason);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    function initialize(
        address _owner,
        address _aiSigner,
        address _guardian,
        string calldata _strategy
    ) external;

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    function execute(address target, uint256 value, bytes calldata data) external;

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external;

    function updateAISigner(address newSigner) external;
    function deactivate() external;
    function addDeposit() external payable;
    function withdrawDeposit(address payable to, uint256 amount) external;
}
