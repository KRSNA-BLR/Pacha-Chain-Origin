// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PachaChainOrigin} from "../src/PachaChainOrigin.sol";

/**
 * @title DeployPachaChainOrigin
 * @notice Script de deployment para Polygon Amoy Testnet
 * @dev Uso:
 *
 *      1. Configurar .env:
 *         PRIVATE_KEY=<tu_private_key_sin_0x>
 *         POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
 *
 *      2. Deploy a Amoy:
 *         forge script script/Deploy.s.sol:DeployPachaChainOrigin \
 *           --rpc-url $POLYGON_AMOY_RPC_URL \
 *           --broadcast \
 *           --verify \
 *           -vvvv
 *
 *      3. Deploy local (anvil):
 *         anvil &
 *         forge script script/Deploy.s.sol:DeployPachaChainOrigin \
 *           --rpc-url http://127.0.0.1:8545 \
 *           --broadcast \
 *           -vvvv
 */
contract DeployPachaChainOrigin is Script {
    function run() external {
        // Cargar private key desde variable de entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("============================================");
        console2.log("  Pacha-Chain-Origin Deployment");
        console2.log("============================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contrato - el deployer recibe DEFAULT_ADMIN_ROLE
        PachaChainOrigin pacha = new PachaChainOrigin(deployer);

        console2.log("--------------------------------------------");
        console2.log("PachaChainOrigin deployed at:", address(pacha));
        console2.log("Admin:", deployer);
        console2.log("--------------------------------------------");

        vm.stopBroadcast();

        // Verificar deployment
        require(pacha.hasRole(pacha.DEFAULT_ADMIN_ROLE(), deployer), "Admin role not set");
        require(pacha.totalBatches() == 0, "Should start with 0 batches");

        console2.log("");
        console2.log("Deployment verified successfully!");
        console2.log("");
        console2.log("Next steps:");
        console2.log("  1. Grant roles: cast send <address> 'grantRole(bytes32,address)' <role> <wallet>");
        console2.log("  2. Verify on PolygonScan Amoy");
        console2.log("  3. Update .env with deployed address");
    }
}
