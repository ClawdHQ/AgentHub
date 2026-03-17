// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IGuardianPolicy.sol";

/// @title GuardianPolicy
/// @notice Trust-minimized risk enforcement layer for AgentHub AI agents on Polkadot Hub
contract GuardianPolicy is AccessControl, Pausable, ReentrancyGuard, IGuardianPolicy {

    bytes32 public constant AGENT_OWNER_ROLE = keccak256("AGENT_OWNER_ROLE");
    bytes32 public constant WATCHER_ROLE = keccak256("WATCHER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");

    uint256 public constant MAX_VIOLATIONS_BEFORE_FREEZE = 3;
    uint256 public constant DAILY_VOLUME_RESET_PERIOD = 1 days;

    bytes4 private constant SELECTOR_WITHDRAW = bytes4(keccak256("withdraw(uint256)"));
    bytes4 private constant SELECTOR_REDEEM = bytes4(keccak256("redeem(uint256,address,address)"));

    mapping(address => IGuardianPolicy.Policy) private _policies;
    mapping(address => uint256) private _dailyVolume;
    mapping(address => uint256) private _lastVolumeReset;
    mapping(address => bool) private _globalProtocolWhitelist;
    mapping(address => uint256) private _violationCount;

    bool public softPaused;

    event SoftPaused(address indexed triggeredBy);
    event ForceUnpaused(address indexed triggeredBy);
    event GlobalProtocolAdded(address indexed protocol);
    event GlobalProtocolRemoved(address indexed protocol);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, msg.sender);
        _grantRole(WATCHER_ROLE, msg.sender);
        _grantRole(PROTOCOL_ADMIN_ROLE, msg.sender);
    }

    function softPause() public onlyRole(WATCHER_ROLE) {
        softPaused = true;
        emit SoftPaused(msg.sender);
    }

    function hardPause() external onlyRole(WATCHER_ROLE) {
        _pause();
    }

    function forceUnpause() external onlyRole(GUARDIAN_ROLE) {
        softPaused = false;
        if (paused()) {
            _unpause();
        }
        emit ForceUnpaused(msg.sender);
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function validateOperation(
        address agent,
        address target,
        bytes calldata callData,
        uint256 value
    ) external nonReentrant returns (bool valid, string memory reason) {
        if (paused()) {
            return (false, "Guardian: contract is hard-paused");
        }

        bytes4 selector = _extractSelector(callData);

        if (softPaused) {
            if (selector != SELECTOR_WITHDRAW && selector != SELECTOR_REDEEM) {
                return (false, "Guardian: soft-paused, only withdrawals allowed");
            }
            return (true, "");
        }

        IGuardianPolicy.Policy storage policy = _policies[agent];

        if (!_globalProtocolWhitelist[target] && !_isAllowedProtocol(policy, target)) {
            _recordViolation(agent, target, selector, "Guardian: target protocol not whitelisted");
            return (false, "Guardian: target protocol not whitelisted");
        }

        if (!_isAllowedSelector(policy, selector)) {
            _recordViolation(agent, target, selector, "Guardian: function selector not whitelisted");
            return (false, "Guardian: function selector not whitelisted");
        }

        if (value > policy.maxSingleTxValue) {
            _recordViolation(agent, target, selector, "Guardian: value exceeds maxSingleTxValue");
            return (false, "Guardian: value exceeds maxSingleTxValue");
        }

        if (block.timestamp > _lastVolumeReset[agent] + DAILY_VOLUME_RESET_PERIOD) {
            _dailyVolume[agent] = 0;
            _lastVolumeReset[agent] = block.timestamp;
        }
        if (_dailyVolume[agent] + value > policy.maxDailyVolume) {
            _recordViolation(agent, target, selector, "Guardian: daily volume exceeded");
            return (false, "Guardian: daily volume exceeded");
        }

        _dailyVolume[agent] += value;

        return (true, "");
    }

    function setPolicy(
        address agent,
        IGuardianPolicy.Policy calldata policy
    ) external {
        require(
            hasRole(AGENT_OWNER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Guardian: caller lacks AGENT_OWNER_ROLE or DEFAULT_ADMIN_ROLE"
        );
        require(policy.allowedProtocols.length > 0, "Guardian: must allow at least one protocol");

        if (policy.tier == IGuardianPolicy.RiskTier.CONSERVATIVE) {
            require(!policy.xcmEnabled, "Guardian: CONSERVATIVE tier cannot enable XCM");
            require(
                policy.maxSingleTxValue <= 1 ether,
                "Guardian: CONSERVATIVE maxSingleTxValue must be <= 1 ether"
            );
        } else if (policy.tier == IGuardianPolicy.RiskTier.MODERATE) {
            require(
                policy.maxSingleTxValue <= 10 ether,
                "Guardian: MODERATE maxSingleTxValue must be <= 10 ether"
            );
        }

        bool isNew = _policies[agent].createdAt == 0;

        _policies[agent] = policy;
        _policies[agent].updatedAt = block.timestamp;

        if (isNew) {
            _policies[agent].createdAt = block.timestamp;
            emit PolicyCreated(agent, policy.tier);
        } else {
            emit PolicyUpdated(agent, policy.tier);
        }
    }

    function addGlobalProtocol(address protocol) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        _globalProtocolWhitelist[protocol] = true;
        emit GlobalProtocolAdded(protocol);
    }

    function removeGlobalProtocol(address protocol) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        _globalProtocolWhitelist[protocol] = false;
        emit GlobalProtocolRemoved(protocol);
    }

    function getPolicy(address agent) external view returns (IGuardianPolicy.Policy memory) {
        return _policies[agent];
    }

    function getRiskTier(address agent) external view returns (IGuardianPolicy.RiskTier) {
        return _policies[agent].tier;
    }

    function getViolationCount(address agent) external view returns (uint256) {
        return _violationCount[agent];
    }

    function isGlobalProtocol(address protocol) external view returns (bool) {
        return _globalProtocolWhitelist[protocol];
    }

    function _extractSelector(bytes calldata data) internal pure returns (bytes4 selector) {
        if (data.length < 4) return bytes4(0);
        return bytes4(data[:4]);
    }

    function _isAllowedProtocol(
        IGuardianPolicy.Policy storage policy,
        address target
    ) internal view returns (bool) {
        for (uint256 i = 0; i < policy.allowedProtocols.length; i++) {
            if (policy.allowedProtocols[i] == target) return true;
        }
        return false;
    }

    function _isAllowedSelector(
        IGuardianPolicy.Policy storage policy,
        bytes4 selector
    ) internal view returns (bool) {
        for (uint256 i = 0; i < policy.allowedSelectors.length; i++) {
            if (policy.allowedSelectors[i] == selector) return true;
        }
        return false;
    }

    function _recordViolation(
        address agent,
        address target,
        bytes4 selector,
        string memory reason
    ) internal {
        _violationCount[agent]++;
        emit PolicyViolation(agent, target, selector, reason);

        if (_violationCount[agent] >= MAX_VIOLATIONS_BEFORE_FREEZE && !softPaused) {
            softPaused = true;
            emit SoftPaused(address(this));
        }
    }
}
