// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../interfaces/IEntryPoint.sol";

/// @title MockEntryPoint
/// @notice Mock EntryPoint for testing AgentAccount without a real ERC-4337 EntryPoint
contract MockEntryPoint is IEntryPoint {
    mapping(address => uint256) private _deposits;
    mapping(address => uint256) private _nonces;

    function depositTo(address account) external payable override {
        _deposits[account] += msg.value;
    }

    function getNonce(address sender, uint192 key) external view override returns (uint256) {
        return _nonces[sender];
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _deposits[account];
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external override {
        require(_deposits[msg.sender] >= withdrawAmount, "MockEntryPoint: insufficient deposit");
        _deposits[msg.sender] -= withdrawAmount;
        (bool success, ) = withdrawAddress.call{value: withdrawAmount}("");
        require(success, "MockEntryPoint: transfer failed");
    }

    receive() external payable {}
}
