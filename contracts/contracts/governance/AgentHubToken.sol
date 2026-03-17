// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentHubToken (AHT)
/// @notice Governance token for AgentHub
contract AgentHubToken is ERC20, ERC20Votes, ERC20Permit, Ownable {

    uint256 public constant MAX_SUPPLY = 100_000_000 ether;

    constructor(address initialOwner)
        ERC20("AgentHub Token", "AHT")
        ERC20Permit("AgentHub Token")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "AHT: exceeds max supply");
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address account)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(account);
    }
}
