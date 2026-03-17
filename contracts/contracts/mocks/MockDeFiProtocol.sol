// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title MockDeFiProtocol
/// @notice Mock DeFi protocol for testing agent operations
contract MockDeFiProtocol {
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Swapped(address indexed user, uint256 amountIn, uint256 amountOut);

    mapping(address => uint256) public stakes;

    function stake(uint256 amount) external payable {
        stakes[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "MockDeFi: insufficient stake");
        stakes[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function swap(uint256 amountIn) external returns (uint256 amountOut) {
        amountOut = amountIn * 2;
        emit Swapped(msg.sender, amountIn, amountOut);
        return amountOut;
    }

    function redeem(uint256 amount, address receiver, address owner) external returns (uint256) {
        emit Withdrawn(owner, amount);
        return amount;
    }

    receive() external payable {}
}
