// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/proxy/Clones.sol";

/// @title CloneFactory
/// @notice Test helper: creates minimal proxy clones of a given implementation
contract CloneFactory {
    event CloneCreated(address indexed implementation, address clone);

    function clone(address implementation) external returns (address cloneAddr) {
        cloneAddr = Clones.clone(implementation);
        emit CloneCreated(implementation, cloneAddr);
    }
}
