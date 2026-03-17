// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../interfaces/IUserOperation.sol";
import "../interfaces/IEntryPoint.sol";
import "../interfaces/IGuardianPolicy.sol";
import "../interfaces/IAgentAccount.sol";

/// @title AgentAccount
/// @notice ERC-4337 smart account for AI-controlled DeFi agents on Polkadot Hub
contract AgentAccount is Initializable, IAgentAccount {
    using ECDSA for bytes32;

    uint256 private constant SIG_VALIDATION_SUCCESS = 0;
    uint256 private constant SIG_VALIDATION_FAILED = 1;

    IEntryPoint public immutable entryPoint;

    IGuardianPolicy public guardian;
    address public owner;
    address public aiSigner;
    address public factory;
    string public strategyDescription;
    bool public active;

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "AgentAccount: caller is not EntryPoint");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentAccount: caller is not owner");
        _;
    }

    modifier onlyOwnerOrFactory() {
        require(
            msg.sender == owner || (factory != address(0) && msg.sender == factory),
            "AgentAccount: caller is not owner or factory"
        );
        _;
    }

    constructor(address _entryPoint) {
        entryPoint = IEntryPoint(_entryPoint);
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _aiSigner,
        address _guardian,
        string calldata _strategy
    ) external override initializer {
        require(_owner != address(0), "AgentAccount: zero owner address");
        require(_aiSigner != address(0), "AgentAccount: zero aiSigner address");
        require(_guardian != address(0), "AgentAccount: zero guardian address");

        owner = _owner;
        aiSigner = _aiSigner;
        guardian = IGuardianPolicy(_guardian);
        strategyDescription = _strategy;
        factory = msg.sender;
        active = true;
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedHash, userOp.signature);

        if (err != ECDSA.RecoverError.NoError || recovered != aiSigner) {
            return SIG_VALIDATION_FAILED;
        }

        if (userOp.callData.length >= 4) {
            (address target, uint256 value, bytes memory data) = _decodeExecuteCall(userOp.callData);

            (bool valid, ) = guardian.validateOperation(address(this), target, data, value);
            if (!valid) {
                return SIG_VALIDATION_FAILED;
            }
        }

        if (missingAccountFunds > 0) {
            entryPoint.depositTo{value: missingAccountFunds}(address(this));
        }

        return SIG_VALIDATION_SUCCESS;
    }

    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external override onlyEntryPoint {
        require(active, "AgentAccount: agent is deactivated");

        (bool valid, string memory reason) = guardian.validateOperation(
            address(this),
            target,
            data,
            value
        );

        if (!valid) {
            emit AgentBlocked(target, reason);
            revert(reason);
        }

        (bool success, bytes memory result) = target.call{value: value}(data);

        if (success) {
            emit AgentExecuted(target, value, data, true);
        } else {
            emit AgentBlocked(target, string(result));
            if (result.length > 0) {
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
            revert("AgentAccount: execution failed");
        }
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external override onlyEntryPoint {
        require(active, "AgentAccount: agent is deactivated");
        require(
            targets.length == values.length && targets.length == datas.length,
            "AgentAccount: array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            (bool valid, string memory reason) = guardian.validateOperation(
                address(this),
                targets[i],
                datas[i],
                values[i]
            );

            if (!valid) {
                emit AgentBlocked(targets[i], reason);
                revert(reason);
            }

            (bool success, bytes memory result) = targets[i].call{value: values[i]}(datas[i]);
            if (!success) {
                emit AgentBlocked(targets[i], string(result));
                if (result.length > 0) {
                    assembly {
                        revert(add(result, 32), mload(result))
                    }
                }
                revert("AgentAccount: batch execution failed");
            }
            emit AgentExecuted(targets[i], values[i], datas[i], true);
        }
    }

    function updateAISigner(address newSigner) external override onlyOwner {
        require(newSigner != address(0), "AgentAccount: zero address");
        address oldSigner = aiSigner;
        aiSigner = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }

    function deactivate() external override onlyOwnerOrFactory {
        active = false;
    }

    function addDeposit() external payable override {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawDeposit(address payable to, uint256 amount) external override onlyOwner {
        entryPoint.withdrawTo(to, amount);
    }

    receive() external payable {}

    function _decodeExecuteCall(bytes calldata data)
        internal
        pure
        returns (address target, uint256 value, bytes memory innerData)
    {
        if (data.length < 4) return (address(0), 0, "");
        (target, value, innerData) = abi.decode(data[4:], (address, uint256, bytes));
    }
}
