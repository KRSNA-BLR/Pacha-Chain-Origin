// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PachaChainOrigin} from "../src/PachaChainOrigin.sol";
import {IPachaChainOrigin} from "../src/interfaces/IPachaChainOrigin.sol";

/**
 * @title GrantRoles
 * @notice Otorga los 4 roles operativos al admin para pruebas locales
 * @dev Uso:
 *      PRIVATE_KEY=0x... CONTRACT_ADDRESS=0x... \
 *      forge script script/PostDeploy.s.sol:GrantRoles \
 *        --rpc-url http://127.0.0.1:8545 --broadcast --slow
 */
contract GrantRoles is Script {
    function run() external {
        uint256 adminKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(adminKey);
        address contractAddr = vm.envAddress("CONTRACT_ADDRESS");
        PachaChainOrigin pacha = PachaChainOrigin(contractAddr);

        console2.log("============================================");
        console2.log("  Grant Roles to Admin");
        console2.log("============================================");
        console2.log("Contract:", contractAddr);
        console2.log("Admin:", admin);

        require(pacha.hasRole(pacha.DEFAULT_ADMIN_ROLE(), admin), "Not admin");

        bytes32 farmerRole = pacha.FARMER_ROLE();
        bytes32 processorRole = pacha.PROCESSOR_ROLE();
        bytes32 exporterRole = pacha.EXPORTER_ROLE();
        bytes32 buyerRole = pacha.BUYER_ROLE();

        vm.startBroadcast(adminKey);

        if (!pacha.hasRole(farmerRole, admin)) {
            pacha.grantRole(farmerRole, admin);
            console2.log("[GRANT] FARMER_ROLE");
        }
        if (!pacha.hasRole(processorRole, admin)) {
            pacha.grantRole(processorRole, admin);
            console2.log("[GRANT] PROCESSOR_ROLE");
        }
        if (!pacha.hasRole(exporterRole, admin)) {
            pacha.grantRole(exporterRole, admin);
            console2.log("[GRANT] EXPORTER_ROLE");
        }
        if (!pacha.hasRole(buyerRole, admin)) {
            pacha.grantRole(buyerRole, admin);
            console2.log("[GRANT] BUYER_ROLE");
        }

        vm.stopBroadcast();

        console2.log("[OK] All 4 roles granted to admin");
    }
}

/**
 * @title CreateTestBatch
 * @notice Crea un lote de prueba de cacao ecuatoriano
 * @dev Uso:
 *      PRIVATE_KEY=0x... CONTRACT_ADDRESS=0x... \
 *      forge script script/PostDeploy.s.sol:CreateTestBatch \
 *        --rpc-url http://127.0.0.1:8545 --broadcast
 */
contract CreateTestBatch is Script {
    function run() external {
        uint256 adminKey = vm.envUint("PRIVATE_KEY");
        address contractAddr = vm.envAddress("CONTRACT_ADDRESS");
        PachaChainOrigin pacha = PachaChainOrigin(contractAddr);

        uint256 beforeCount = pacha.totalBatches();
        console2.log("Batches before:", beforeCount);

        vm.startBroadcast(adminKey);

        uint256 batchId = pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "Nacional Fino de Aroma",
            15050, // 150.50 kg
            keccak256(abi.encodePacked("0.9681", "-79.6534", "Finca La Aurora")),
            "Esmeraldas, Ecuador",
            block.timestamp,
            "QmPostDeployTest2026"
        );

        vm.stopBroadcast();

        console2.log("[CREATE] batchId:", batchId);
        console2.log("[CREATE] totalBatches:", pacha.totalBatches());
    }
}
