// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./AgentAccount.sol";
import "./AgentRegistry.sol";
import "../interfaces/IGuardianPolicy.sol";

/// @title AgentFactory
/// @notice Factory contract for deploying AI-controlled ERC-4337 agent accounts
contract AgentFactory is AccessControl {
    using Clones for address;

    address public immutable implementation;
    address public immutable entryPoint;
    IGuardianPolicy public immutable guardian;
    AgentRegistry public immutable registry;

    uint256 public agentCount;
    mapping(address => address[]) public ownerAgents;
    mapping(address => bool) public isAgent;

    event AgentCreated(
        address indexed owner,
        address indexed agent,
        IGuardianPolicy.RiskTier tier,
        string strategyDescription
    );

    event AgentDeactivated(address indexed agent, address indexed owner);

    constructor(
        address _implementation,
        address _entryPoint,
        address _guardian,
        address _registry
    ) {
        require(_implementation != address(0), "Factory: zero implementation");
        require(_entryPoint != address(0), "Factory: zero entryPoint");
        require(_guardian != address(0), "Factory: zero guardian");
        require(_registry != address(0), "Factory: zero registry");

        implementation = _implementation;
        entryPoint = _entryPoint;
        guardian = IGuardianPolicy(_guardian);
        registry = AgentRegistry(_registry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createAgent(
        address aiSigner,
        IGuardianPolicy.RiskTier tier,
        address[] calldata allowedProtocols,
        bytes4[] calldata allowedSelectors,
        uint256 maxSingleTxValue,
        uint256 maxDailyVolume,
        bool xcmEnabled,
        string calldata strategyDescription
    ) external returns (address agent) {
        require(aiSigner != address(0), "Factory: zero aiSigner");
        require(allowedProtocols.length > 0, "Factory: no protocols specified");

        bytes32 salt = keccak256(abi.encodePacked(msg.sender, agentCount++));

        agent = implementation.cloneDeterministic(salt);

        AgentAccount(payable(agent)).initialize(
            msg.sender,
            aiSigner,
            address(guardian),
            strategyDescription
        );

        address[] memory protocols = allowedProtocols;
        bytes4[] memory selectors = allowedSelectors;

        IGuardianPolicy.Policy memory policy = IGuardianPolicy.Policy({
            tier: tier,
            maxSingleTxValue: maxSingleTxValue,
            maxDailyVolume: maxDailyVolume,
            allowedProtocols: protocols,
            allowedSelectors: selectors,
            xcmEnabled: xcmEnabled,
            createdAt: 0,
            updatedAt: 0
        });

        guardian.setPolicy(agent, policy);
        registry.registerAgent(agent, msg.sender);

        ownerAgents[msg.sender].push(agent);
        isAgent[agent] = true;

        emit AgentCreated(msg.sender, agent, tier, strategyDescription);
        return agent;
    }

    function predictAgentAddress(address agentOwner, uint256 index)
        external
        view
        returns (address)
    {
        bytes32 salt = keccak256(abi.encodePacked(agentOwner, index));
        return implementation.predictDeterministicAddress(salt);
    }

    function getOwnerAgents(address agentOwner)
        external
        view
        returns (address[] memory)
    {
        return ownerAgents[agentOwner];
    }

    function deactivateAgent(address agent) external {
        require(isAgent[agent], "Factory: not a factory agent");
        require(
            AgentAccount(payable(agent)).owner() == msg.sender,
            "Factory: caller is not agent owner"
        );
        AgentAccount(payable(agent)).deactivate();
        emit AgentDeactivated(agent, msg.sender);
    }
}
