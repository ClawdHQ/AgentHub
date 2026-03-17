// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AgentRegistry
/// @notice Registry of all deployed AgentHub agents on Polkadot Hub
contract AgentRegistry is AccessControl {

    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    struct AgentInfo {
        address owner;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => AgentInfo) private _agents;
    uint256 public totalAgents;

    event AgentRegistered(address indexed agent, address indexed owner, uint256 timestamp);
    event AgentDeactivated(address indexed agent);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAgent(address agent, address owner) external onlyRole(FACTORY_ROLE) {
        require(_agents[agent].registeredAt == 0, "Registry: agent already registered");
        _agents[agent] = AgentInfo({
            owner: owner,
            registeredAt: block.timestamp,
            active: true
        });
        totalAgents++;
        emit AgentRegistered(agent, owner, block.timestamp);
    }

    function deactivateAgent(address agent) external {
        require(
            _agents[agent].owner == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Registry: not authorized"
        );
        _agents[agent].active = false;
        emit AgentDeactivated(agent);
    }

    function getAgentInfo(address agent) external view returns (AgentInfo memory) {
        return _agents[agent];
    }

    function isActiveAgent(address agent) external view returns (bool) {
        return _agents[agent].active && _agents[agent].registeredAt > 0;
    }
}
