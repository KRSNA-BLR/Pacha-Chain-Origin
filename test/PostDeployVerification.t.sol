// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {PachaChainOrigin} from "../src/PachaChainOrigin.sol";
import {IPachaChainOrigin} from "../src/interfaces/IPachaChainOrigin.sol";

/**
 * @title PostDeployVerification
 * @notice Fork test que verifica un contrato desplegado contra Anvil o testnet
 * @dev Ejecutar con:
 *
 *      CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
 *      forge test --match-contract PostDeployVerification \
 *        --fork-url http://127.0.0.1:8545 -vvv
 *
 *      Para Polygon Amoy:
 *      CONTRACT_ADDRESS=0x... \
 *      forge test --match-contract PostDeployVerification \
 *        --fork-url $POLYGON_AMOY_RPC_URL -vvv
 */
contract PostDeployVerification is Test {
    PachaChainOrigin pacha;
    address admin;
    uint256 adminKey;

    // Anvil default key #0
    uint256 constant ANVIL_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function setUp() public {
        address contractAddr = vm.envAddress("CONTRACT_ADDRESS");
        pacha = PachaChainOrigin(contractAddr);

        // Intentar leer PRIVATE_KEY del entorno, fallback a Anvil key
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            adminKey = key;
        } catch {
            adminKey = ANVIL_KEY;
        }
        admin = vm.addr(adminKey);

        console2.log("============================================");
        console2.log("  Post-Deploy Verification (Fork Test)");
        console2.log("============================================");
        console2.log("Contract:", contractAddr);
        console2.log("Admin:", admin);
        console2.log("Chain ID:", block.chainid);
    }

    // ================================================================
    //  PDV-01: Verificar deployment básico
    // ================================================================
    function test_PDV01_DeploymentIntegrity() public view {
        assertTrue(pacha.hasRole(pacha.DEFAULT_ADMIN_ROLE(), admin), "Admin role not set");

        // Verificar que las constantes de rol existen
        bytes32 farmerRole = pacha.FARMER_ROLE();
        bytes32 processorRole = pacha.PROCESSOR_ROLE();
        bytes32 exporterRole = pacha.EXPORTER_ROLE();
        bytes32 buyerRole = pacha.BUYER_ROLE();

        assertTrue(farmerRole != bytes32(0), "Farmer role is zero");
        assertTrue(processorRole != bytes32(0), "Processor role is zero");
        assertTrue(exporterRole != bytes32(0), "Exporter role is zero");
        assertTrue(buyerRole != bytes32(0), "Buyer role is zero");

        // Roles son únicos
        assertTrue(farmerRole != processorRole, "Farmer == Processor");
        assertTrue(farmerRole != exporterRole, "Farmer == Exporter");
        assertTrue(farmerRole != buyerRole, "Farmer == Buyer");
        assertTrue(processorRole != exporterRole, "Processor == Exporter");
        assertTrue(processorRole != buyerRole, "Processor == Buyer");
        assertTrue(exporterRole != buyerRole, "Exporter == Buyer");

        console2.log("[PDV-01] Deployment integrity: PASS");
    }

    // ================================================================
    //  PDV-02: Flujo Farm-to-Table completo (Cacao)
    // ================================================================
    function test_PDV02_FullCacaoJourney() public {
        // Grant all roles to admin
        _grantAllRoles(admin);

        // Crear lote de cacao
        vm.startPrank(admin);

        uint256 batchId = pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "Nacional Fino de Aroma",
            15050,
            keccak256(abi.encodePacked("0.9681", "-79.6534", "Finca La Aurora")),
            "Esmeraldas, Ecuador",
            block.timestamp,
            "QmCacaoInitialHash"
        );

        console2.log("[PDV-02] BatchId:", batchId);
        assertTrue(pacha.batchExists(batchId), "Batch should exist");

        // Verificar estado inicial
        assertEq(
            uint8(pacha.getBatchState(batchId)),
            uint8(IPachaChainOrigin.BatchState.Harvested),
            "Should start at Harvested"
        );
        assertEq(pacha.uri(batchId), "ipfs://QmCacaoInitialHash", "Initial URI");
        assertEq(pacha.totalSupply(batchId), 1, "Supply should be 1");

        // Avanzar por todos los estados
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "Fermentacion 6 dias");
        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Fermented));

        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Dried, "Secado solar 8 dias");
        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Dried));

        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Packed, "Sacos yute 69kg");
        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Packed));

        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Shipped, "Container SSCC-061414");
        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Shipped));

        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Delivered, "Antwerp, Belgica");
        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Delivered));

        // Actualizar metadata final
        pacha.updateMetadata(batchId, "QmFinalCacaoCertificated");
        assertEq(pacha.uri(batchId), "ipfs://QmFinalCacaoCertificated", "Final URI");

        vm.stopPrank();

        // Verificar datos completos
        IPachaChainOrigin.BatchInfo memory info = pacha.getBatchInfo(batchId);
        assertEq(info.farmer, admin, "Farmer mismatch");
        assertEq(uint8(info.productType), uint8(IPachaChainOrigin.ProductType.Cacao));
        assertEq(info.weightKg, 15050);
        assertEq(info.variety, "Nacional Fino de Aroma");
        assertEq(info.region, "Esmeraldas, Ecuador");
        assertEq(uint8(info.currentState), uint8(IPachaChainOrigin.BatchState.Delivered));

        console2.log("[PDV-02] Full cacao journey: PASS");
    }

    // ================================================================
    //  PDV-03: Flujo Farm-to-Table completo (Cafe)
    // ================================================================
    function test_PDV03_FullCoffeeJourney() public {
        _grantAllRoles(admin);

        vm.startPrank(admin);

        uint256 batchId = pacha.createBatch(
            IPachaChainOrigin.ProductType.Coffee,
            "Arabica Sidra Loja",
            8000,
            keccak256(abi.encodePacked("-3.9931", "-79.2043", "Finca Vilcabamba")),
            "Loja, Ecuador",
            block.timestamp,
            "QmCoffeeInitialHash"
        );

        assertTrue(pacha.batchExists(batchId));

        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "Honey process 72h");
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Dried, "African beds 14 dias");
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Packed, "GrainPro 30kg");
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Shipped, "Air cargo BOG-HAM");
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Delivered, "Hamburg roastery");

        pacha.updateMetadata(batchId, "QmFinalCoffeeSCA92");

        vm.stopPrank();

        IPachaChainOrigin.BatchInfo memory info = pacha.getBatchInfo(batchId);
        assertEq(uint8(info.currentState), uint8(IPachaChainOrigin.BatchState.Delivered));
        assertEq(uint8(info.productType), uint8(IPachaChainOrigin.ProductType.Coffee));
        assertEq(pacha.uri(batchId), "ipfs://QmFinalCoffeeSCA92");

        console2.log("[PDV-03] Full coffee journey: PASS");
    }

    // ================================================================
    //  PDV-04: Multi-actor flow with separate wallets
    // ================================================================
    function test_PDV04_MultiActorFlow() public {
        address farmer    = address(0xFAA1);
        address processor = address(0xFAA2);
        address exporter  = address(0xFAA3);
        address buyer     = address(0xFAA4);

        vm.deal(farmer, 1 ether);
        vm.deal(processor, 1 ether);
        vm.deal(exporter, 1 ether);
        vm.deal(buyer, 1 ether);

        // Admin grants roles
        vm.startPrank(admin);
        pacha.grantRole(pacha.FARMER_ROLE(), farmer);
        pacha.grantRole(pacha.PROCESSOR_ROLE(), processor);
        pacha.grantRole(pacha.EXPORTER_ROLE(), exporter);
        pacha.grantRole(pacha.BUYER_ROLE(), buyer);
        vm.stopPrank();

        // Farmer creates batch
        vm.prank(farmer);
        uint256 batchId = pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "CCN-51 Guayas",
            25000,
            keccak256(abi.encodePacked("-2.2", "-79.9", "Finca Milagro")),
            "Guayas, Ecuador",
            block.timestamp,
            "QmMultiActorInit"
        );

        // Processor advances
        vm.prank(processor);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "Industrial fermentation");

        vm.prank(processor);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Dried, "Machine dried");

        // Exporter advances
        vm.prank(exporter);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Packed, "Packed containers");

        vm.prank(exporter);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Shipped, "Vessel MSC-2026");

        // Buyer receives
        vm.prank(buyer);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Delivered, "Rotterdam port");

        // Farmer updates metadata
        vm.prank(farmer);
        pacha.updateMetadata(batchId, "QmMultiActorFinal");

        IPachaChainOrigin.BatchInfo memory info = pacha.getBatchInfo(batchId);
        assertEq(uint8(info.currentState), uint8(IPachaChainOrigin.BatchState.Delivered));
        assertEq(info.farmer, farmer);

        console2.log("[PDV-04] Multi-actor flow: PASS");
    }

    // ================================================================
    //  PDV-05: Pause/unpause on deployed contract
    // ================================================================
    function test_PDV05_PauseUnpause() public {
        _grantAllRoles(admin);

        // Pause
        vm.prank(admin);
        pacha.pause();
        assertTrue(pacha.paused(), "Should be paused");

        // Creates should revert when paused
        vm.expectRevert();
        vm.prank(admin);
        pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "test",
            100,
            bytes32(0),
            "test",
            block.timestamp,
            "test"
        );

        // Unpause
        vm.prank(admin);
        pacha.unpause();
        assertFalse(pacha.paused(), "Should be unpaused");

        // Now create should work
        vm.prank(admin);
        uint256 batchId = pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "Post-pause test",
            500,
            keccak256("post-pause"),
            "Test",
            block.timestamp,
            "QmPause"
        );
        assertTrue(pacha.batchExists(batchId), "Batch should exist after unpause");

        console2.log("[PDV-05] Pause/unpause: PASS");
    }

    // ================================================================
    //  PDV-06: Event emission verification
    // ================================================================
    function test_PDV06_EventsEmitted() public {
        _grantAllRoles(admin);

        vm.startPrank(admin);

        // Expect BatchCreated event: check topic2 (farmer) and data, skip topic1 (batchId)
        vm.expectEmit(false, true, false, true, address(pacha));
        emit IPachaChainOrigin.BatchCreated(
            0, // batchId (skip - indexed but unpredictable)
            admin,
            IPachaChainOrigin.ProductType.Cacao,
            12000,
            block.timestamp
        );

        pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "Event test",
            12000,
            keccak256("event-test"),
            "Manabi, Ecuador",
            block.timestamp,
            "QmEventTest"
        );

        vm.stopPrank();

        console2.log("[PDV-06] Events: PASS");
    }

    // ================================================================
    //  PDV-07: Batch count consistency
    // ================================================================
    function test_PDV07_BatchCountConsistency() public {
        _grantAllRoles(admin);

        uint256 before = pacha.totalBatches();

        vm.startPrank(admin);

        pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "Count test 1",
            100,
            keccak256("count1"),
            "Test",
            block.timestamp,
            "Qm1"
        );

        vm.warp(block.timestamp + 1);

        pacha.createBatch(
            IPachaChainOrigin.ProductType.Coffee,
            "Count test 2",
            200,
            keccak256("count2"),
            "Test",
            block.timestamp,
            "Qm2"
        );

        vm.warp(block.timestamp + 1);

        pacha.createBatch(
            IPachaChainOrigin.ProductType.Cacao,
            "Count test 3",
            300,
            keccak256("count3"),
            "Test",
            block.timestamp,
            "Qm3"
        );

        vm.stopPrank();

        assertEq(pacha.totalBatches(), before + 3, "Should have 3 more batches");

        console2.log("[PDV-07] Batch count consistency: PASS");
    }

    // ================================================================
    //  PDV-08: ERC-1155 compliance on deployed contract
    // ================================================================
    function test_PDV08_ERC1155Compliance() public {
        // Check supportsInterface
        assertTrue(pacha.supportsInterface(0xd9b67a26), "ERC-1155 interface");
        assertTrue(pacha.supportsInterface(0x0e89341c), "ERC-1155 Metadata URI");
        assertTrue(pacha.supportsInterface(0x01ffc9a7), "ERC-165");

        console2.log("[PDV-08] ERC-1155 compliance: PASS");
    }

    // ================================================================
    //  HELPERS
    // ================================================================

    function _grantAllRoles(address target) internal {
        vm.startPrank(admin);
        if (!pacha.hasRole(pacha.FARMER_ROLE(), target))    pacha.grantRole(pacha.FARMER_ROLE(), target);
        if (!pacha.hasRole(pacha.PROCESSOR_ROLE(), target))  pacha.grantRole(pacha.PROCESSOR_ROLE(), target);
        if (!pacha.hasRole(pacha.EXPORTER_ROLE(), target))   pacha.grantRole(pacha.EXPORTER_ROLE(), target);
        if (!pacha.hasRole(pacha.BUYER_ROLE(), target))      pacha.grantRole(pacha.BUYER_ROLE(), target);
        vm.stopPrank();
    }
}
