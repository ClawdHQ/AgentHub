// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./IUserOperation.sol";

/// @title IEntryPoint
/// @notice Minimal interface for ERC-4337 EntryPoint contract
interface IEntryPoint {
    function depositTo(address account) external payable;
    function getNonce(address sender, uint192 key) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
}
