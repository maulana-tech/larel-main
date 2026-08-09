// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LarelPool.sol";
import "../src/HonkVerifier.sol";

contract MockPoseidon is IPoseidon {
    function hash(uint256[2] memory inputs) external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(inputs[0], inputs[1])));
    }
}

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Poseidon
        MockPoseidon poseidon = new MockPoseidon();
        console.log("MockPoseidon deployed at:", address(poseidon));

        // 2. Deploy Verifier
        WithdrawVerifier verifier = new WithdrawVerifier();
        console.log("WithdrawVerifier deployed at:", address(verifier));

        // 3. Deploy LarelPool
        LarelPool pool = new LarelPool(address(poseidon), address(verifier));
        console.log("LarelPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
