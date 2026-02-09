// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {PachaChainOrigin} from "../src/PachaChainOrigin.sol";
import {IPachaChainOrigin} from "../src/interfaces/IPachaChainOrigin.sol";

/**
 * @title PachaChainOriginTest
 * @notice Suite completa de tests unitarios para PachaChainOrigin
 * @dev Estructura de tests:
 *
 *      1. DEPLOYMENT     - Constructor, roles iniciales
 *      2. CREATE BATCH   - Creación de lotes, validaciones
 *      3. STATE MACHINE  - Transiciones válidas e inválidas
 *      4. ROLES          - Permisos, acceso no autorizado
 *      5. METADATA       - Actualización de IPFS
 *      6. PAUSABILITY    - Pausa y reanudación
 *      7. INTEGRATION    - Flujo completo Farm-to-Table
 *
 *      Convenciones de nombres:
 *      - test_functionName_shouldBehavior_whenCondition
 *      - testRevert_functionName_shouldRevert_whenCondition
 *      - testFuzz_functionName_withRandomInput
 */
contract PachaChainOriginTest is Test {
    // ============================================================
    //                     TEST FIXTURES
    // ============================================================

    PachaChainOrigin public pacha;

    // Actores del sistema (direcciones de test)
    address public admin = makeAddr("admin");
    address public farmer = makeAddr("farmer");
    address public farmer2 = makeAddr("farmer2");
    address public processor = makeAddr("processor");
    address public exporter = makeAddr("exporter");
    address public buyer = makeAddr("buyer");
    address public unauthorized = makeAddr("unauthorized");

    // Datos de lote de prueba
    IPachaChainOrigin.ProductType constant CACAO = IPachaChainOrigin.ProductType.Cacao;
    IPachaChainOrigin.ProductType constant COFFEE = IPachaChainOrigin.ProductType.Coffee;
    string constant VARIETY = "Nacional Fino de Aroma";
    uint256 constant WEIGHT_KG = 15050; // 150.50 kg
    bytes32 constant ORIGIN_HASH = keccak256(abi.encodePacked("0.3167", "-79.4500", "Finca La Aurora"));
    string constant REGION = "Esmeraldas";
    uint256 constant HARVEST_DATE = 1738368000; // 2025-02-01
    string constant IPFS_HASH = "QmTest123456789abcdef";

    // ============================================================
    //                       SETUP
    // ============================================================

    /**
     * @notice Configura el entorno de test antes de cada test
     * @dev Despliega el contrato y asigna roles a los actores.
     *      Cada test comienza con un estado limpio (Foundry fork).
     */
    function setUp() public {
        // Deploy contrato con admin
        vm.prank(admin);
        pacha = new PachaChainOrigin(admin);

        // Asignar roles (admin tiene DEFAULT_ADMIN_ROLE, puede asignar otros)
        vm.startPrank(admin);
        pacha.grantRole(pacha.FARMER_ROLE(), farmer);
        pacha.grantRole(pacha.FARMER_ROLE(), farmer2);
        pacha.grantRole(pacha.PROCESSOR_ROLE(), processor);
        pacha.grantRole(pacha.EXPORTER_ROLE(), exporter);
        pacha.grantRole(pacha.BUYER_ROLE(), buyer);
        vm.stopPrank();
    }

    // ============================================================
    //            HELPER: Crear un lote para tests que lo necesitan
    // ============================================================

    /**
     * @notice Helper que crea un lote y retorna su ID
     * @dev Usado por tests que necesitan un lote existente como precondición.
     */
    function _createTestBatch() internal returns (uint256 batchId) {
        vm.prank(farmer);
        batchId = pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, IPFS_HASH);
    }

    /**
     * @notice Helper que crea un lote y lo avanza hasta un estado dado
     */
    function _createAndAdvanceTo(IPachaChainOrigin.BatchState targetState)
        internal
        returns (uint256 batchId)
    {
        batchId = _createTestBatch();

        if (uint8(targetState) >= 1) {
            vm.prank(processor);
            pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "Fermentation 6 days");
        }
        if (uint8(targetState) >= 2) {
            vm.prank(processor);
            pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Dried, "Solar drying 8 days");
        }
        if (uint8(targetState) >= 3) {
            vm.prank(exporter);
            pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Packed, "Export grade packing");
        }
        if (uint8(targetState) >= 4) {
            vm.prank(exporter);
            pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Shipped, "Container SSCC-0001");
        }
        if (uint8(targetState) >= 5) {
            vm.prank(buyer);
            pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Delivered, "Received in warehouse");
        }
    }

    // ============================================================
    //                  1. DEPLOYMENT TESTS
    // ============================================================

    function test_deployment_shouldSetAdmin() public view {
        assertTrue(pacha.hasRole(pacha.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_deployment_shouldAssignRoles() public view {
        assertTrue(pacha.hasRole(pacha.FARMER_ROLE(), farmer));
        assertTrue(pacha.hasRole(pacha.PROCESSOR_ROLE(), processor));
        assertTrue(pacha.hasRole(pacha.EXPORTER_ROLE(), exporter));
        assertTrue(pacha.hasRole(pacha.BUYER_ROLE(), buyer));
    }

    function test_deployment_shouldStartWithZeroBatches() public view {
        assertEq(pacha.totalBatches(), 0);
    }

    function test_deployment_shouldNotBePaused() public view {
        assertFalse(pacha.paused());
    }

    function testRevert_deployment_shouldRevert_whenAdminIsZero() public {
        vm.expectRevert(IPachaChainOrigin.InvalidAddress.selector);
        new PachaChainOrigin(address(0));
    }

    // ============================================================
    //                  2. CREATE BATCH TESTS
    // ============================================================

    function test_createBatch_shouldCreateBatch() public {
        uint256 batchId = _createTestBatch();

        assertTrue(pacha.batchExists(batchId));
        assertEq(pacha.totalBatches(), 1);
    }

    function test_createBatch_shouldStoreCorrectData() public {
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, IPFS_HASH);

        IPachaChainOrigin.BatchInfo memory info = pacha.getBatchInfo(batchId);

        assertEq(info.farmer, farmer);
        assertEq(uint8(info.productType), uint8(CACAO));
        assertEq(info.variety, VARIETY);
        assertEq(info.weightKg, WEIGHT_KG);
        assertEq(info.originHash, ORIGIN_HASH);
        assertEq(info.region, REGION);
        assertEq(info.harvestDate, HARVEST_DATE);
        assertEq(uint8(info.currentState), uint8(IPachaChainOrigin.BatchState.Harvested));
        assertEq(info.ipfsHash, IPFS_HASH);
    }

    function test_createBatch_shouldMintTokenToFarmer() public {
        uint256 batchId = _createTestBatch();

        assertEq(pacha.balanceOf(farmer, batchId), 1);
        assertEq(pacha.totalSupply(batchId), 1);
    }

    function test_createBatch_shouldEmitBatchCreatedEvent() public {
        vm.prank(farmer);

        // No podemos predecir el batchId exacto, así que verificamos los campos indexados
        vm.expectEmit(false, true, false, false);
        emit IPachaChainOrigin.BatchCreated(0, farmer, CACAO, WEIGHT_KG, block.timestamp);

        pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, IPFS_HASH);
    }

    function test_createBatch_shouldCreateMultipleBatches() public {
        vm.startPrank(farmer);
        uint256 batchId1 =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "");
        uint256 batchId2 =
            pacha.createBatch(COFFEE, "Arabica", 5000, ORIGIN_HASH, "Loja", HARVEST_DATE, "");
        vm.stopPrank();

        assertTrue(batchId1 != batchId2, "Batch IDs should be unique");
        assertEq(pacha.totalBatches(), 2);
    }

    function test_createBatch_shouldAllowDifferentFarmers() public {
        vm.prank(farmer);
        uint256 batchId1 =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "");

        vm.prank(farmer2);
        uint256 batchId2 =
            pacha.createBatch(COFFEE, "Arabica", 5000, ORIGIN_HASH, "Loja", HARVEST_DATE, "");

        assertEq(pacha.getBatchInfo(batchId1).farmer, farmer);
        assertEq(pacha.getBatchInfo(batchId2).farmer, farmer2);
    }

    function test_createBatch_shouldAllowEmptyIpfsHash() public {
        vm.prank(farmer);
        uint256 batchId = pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "");

        assertEq(pacha.getBatchInfo(batchId).ipfsHash, "");
    }

    function testRevert_createBatch_shouldRevert_whenCallerNotFarmer() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "");
    }

    function testRevert_createBatch_shouldRevert_whenWeightIsZero() public {
        vm.prank(farmer);
        vm.expectRevert(abi.encodeWithSelector(IPachaChainOrigin.InvalidWeight.selector, 0));
        pacha.createBatch(CACAO, VARIETY, 0, ORIGIN_HASH, REGION, HARVEST_DATE, "");
    }

    function testRevert_createBatch_shouldRevert_whenOriginHashIsZero() public {
        vm.prank(farmer);
        vm.expectRevert(IPachaChainOrigin.InvalidOriginHash.selector);
        pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, bytes32(0), REGION, HARVEST_DATE, "");
    }

    // ============================================================
    //                 3. STATE MACHINE TESTS
    // ============================================================

    function test_advanceState_shouldTransitionToFermented() public {
        uint256 batchId = _createTestBatch();

        vm.prank(processor);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "6 days wood box");

        assertEq(
            uint8(pacha.getBatchState(batchId)),
            uint8(IPachaChainOrigin.BatchState.Fermented)
        );
    }

    function test_advanceState_shouldTransitionThroughAllStates() public {
        uint256 batchId = _createAndAdvanceTo(IPachaChainOrigin.BatchState.Delivered);

        assertEq(
            uint8(pacha.getBatchState(batchId)),
            uint8(IPachaChainOrigin.BatchState.Delivered)
        );
    }

    function test_advanceState_shouldEmitStateChangedEvent() public {
        uint256 batchId = _createTestBatch();

        vm.prank(processor);

        vm.expectEmit(true, true, true, false);
        emit IPachaChainOrigin.BatchStateChanged(
            batchId,
            IPachaChainOrigin.BatchState.Harvested,
            IPachaChainOrigin.BatchState.Fermented,
            processor,
            block.timestamp,
            "notes"
        );

        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "notes");
    }

    function test_advanceState_shouldUpdateLastTimestamp() public {
        // Warp to harvest date first so the batch is created at a realistic time
        vm.warp(HARVEST_DATE);
        uint256 batchId = _createTestBatch();

        // Avanzar el tiempo 1 día después de la cosecha
        vm.warp(HARVEST_DATE + 1 days);

        vm.prank(processor);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "");

        IPachaChainOrigin.BatchInfo memory info = pacha.getBatchInfo(batchId);
        assertGt(info.lastUpdate, HARVEST_DATE);
    }

    function testRevert_advanceState_shouldRevert_whenBatchDoesNotExist() public {
        uint256 fakeBatchId = 99999;

        vm.prank(processor);
        vm.expectRevert(abi.encodeWithSelector(IPachaChainOrigin.BatchDoesNotExist.selector, fakeBatchId));
        pacha.advanceState(fakeBatchId, IPachaChainOrigin.BatchState.Fermented, "");
    }

    function testRevert_advanceState_shouldRevert_whenSkippingStates() public {
        uint256 batchId = _createTestBatch();

        // Intentar saltar de Harvested directo a Dried (saltando Fermented)
        vm.prank(processor);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPachaChainOrigin.InvalidStateTransition.selector,
                batchId,
                IPachaChainOrigin.BatchState.Harvested,
                IPachaChainOrigin.BatchState.Dried
            )
        );
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Dried, "");
    }

    function testRevert_advanceState_shouldRevert_whenGoingBackwards() public {
        uint256 batchId = _createAndAdvanceTo(IPachaChainOrigin.BatchState.Fermented);

        // Intentar volver a Harvested desde Fermented
        vm.prank(farmer);
        vm.expectRevert();
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Harvested, "");
    }

    function testRevert_advanceState_shouldRevert_whenAlreadyDelivered() public {
        uint256 batchId = _createAndAdvanceTo(IPachaChainOrigin.BatchState.Delivered);

        // Intentar avanzar más allá de Delivered
        vm.prank(buyer);
        vm.expectRevert();
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Delivered, "");
    }

    // ============================================================
    //                    4. ROLE TESTS
    // ============================================================

    function testRevert_advanceState_shouldRevert_whenFarmerTriesToFerment() public {
        uint256 batchId = _createTestBatch();

        vm.prank(farmer); // Farmer no tiene PROCESSOR_ROLE
        vm.expectRevert(
            abi.encodeWithSelector(
                IPachaChainOrigin.UnauthorizedForTransition.selector,
                batchId,
                IPachaChainOrigin.BatchState.Fermented,
                farmer
            )
        );
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "");
    }

    function testRevert_advanceState_shouldRevert_whenProcessorTriesToPack() public {
        uint256 batchId = _createAndAdvanceTo(IPachaChainOrigin.BatchState.Dried);

        vm.prank(processor); // Processor no tiene EXPORTER_ROLE
        vm.expectRevert(
            abi.encodeWithSelector(
                IPachaChainOrigin.UnauthorizedForTransition.selector,
                batchId,
                IPachaChainOrigin.BatchState.Packed,
                processor
            )
        );
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Packed, "");
    }

    function testRevert_advanceState_shouldRevert_whenExporterTriesToDeliver() public {
        uint256 batchId = _createAndAdvanceTo(IPachaChainOrigin.BatchState.Shipped);

        vm.prank(exporter); // Exporter no tiene BUYER_ROLE
        vm.expectRevert(
            abi.encodeWithSelector(
                IPachaChainOrigin.UnauthorizedForTransition.selector,
                batchId,
                IPachaChainOrigin.BatchState.Delivered,
                exporter
            )
        );
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Delivered, "");
    }

    function testRevert_advanceState_shouldRevert_whenUnauthorizedUser() public {
        uint256 batchId = _createTestBatch();

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPachaChainOrigin.UnauthorizedForTransition.selector,
                batchId,
                IPachaChainOrigin.BatchState.Fermented,
                unauthorized
            )
        );
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "");
    }

    function test_roles_shouldAllowAdminToGrantRoles() public {
        address newFarmer = makeAddr("newFarmer");
        bytes32 farmerRole = pacha.FARMER_ROLE();

        vm.prank(admin);
        pacha.grantRole(farmerRole, newFarmer);

        assertTrue(pacha.hasRole(farmerRole, newFarmer));
    }

    function test_roles_shouldAllowAdminToRevokeRoles() public {
        bytes32 farmerRole = pacha.FARMER_ROLE();

        vm.prank(admin);
        pacha.revokeRole(farmerRole, farmer);

        assertFalse(pacha.hasRole(farmerRole, farmer));
    }

    // ============================================================
    //                   5. METADATA TESTS
    // ============================================================

    function test_updateMetadata_shouldUpdateIpfsHash() public {
        uint256 batchId = _createTestBatch();
        string memory newHash = "QmNewHash987654321";

        vm.prank(farmer);
        pacha.updateMetadata(batchId, newHash);

        assertEq(pacha.getBatchInfo(batchId).ipfsHash, newHash);
    }

    function test_updateMetadata_shouldAllowAdmin() public {
        uint256 batchId = _createTestBatch();
        string memory newHash = "QmAdminUpdate";

        vm.prank(admin);
        pacha.updateMetadata(batchId, newHash);

        assertEq(pacha.getBatchInfo(batchId).ipfsHash, newHash);
    }

    function test_updateMetadata_shouldEmitEvent() public {
        uint256 batchId = _createTestBatch();
        string memory newHash = "QmEventTest";

        vm.prank(farmer);

        vm.expectEmit(true, false, false, true);
        emit IPachaChainOrigin.BatchMetadataUpdated(batchId, newHash);

        pacha.updateMetadata(batchId, newHash);
    }

    function testRevert_updateMetadata_shouldRevert_whenNotFarmerOrAdmin() public {
        uint256 batchId = _createTestBatch();

        vm.prank(processor);
        vm.expectRevert();
        pacha.updateMetadata(batchId, "QmUnauthorized");
    }

    function testRevert_updateMetadata_shouldRevert_whenBatchDoesNotExist() public {
        vm.prank(farmer);
        vm.expectRevert(abi.encodeWithSelector(IPachaChainOrigin.BatchDoesNotExist.selector, 99999));
        pacha.updateMetadata(99999, "QmNonExistent");
    }

    // ============================================================
    //                  6. PAUSABILITY TESTS
    // ============================================================

    function test_pause_shouldPauseContract() public {
        vm.prank(admin);
        pacha.pause();

        assertTrue(pacha.paused());
    }

    function test_unpause_shouldUnpauseContract() public {
        vm.prank(admin);
        pacha.pause();

        vm.prank(admin);
        pacha.unpause();

        assertFalse(pacha.paused());
    }

    function testRevert_createBatch_shouldRevert_whenPaused() public {
        vm.prank(admin);
        pacha.pause();

        vm.prank(farmer);
        vm.expectRevert();
        pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "");
    }

    function testRevert_advanceState_shouldRevert_whenPaused() public {
        uint256 batchId = _createTestBatch();

        vm.prank(admin);
        pacha.pause();

        vm.prank(processor);
        vm.expectRevert();
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "");
    }

    function test_readFunctions_shouldWorkWhenPaused() public {
        uint256 batchId = _createTestBatch();

        vm.prank(admin);
        pacha.pause();

        // Lectura debe funcionar incluso pausado
        assertTrue(pacha.batchExists(batchId));
        pacha.getBatchInfo(batchId);
        pacha.getBatchState(batchId);
        pacha.totalBatches();
    }

    function testRevert_pause_shouldRevert_whenNotAdmin() public {
        vm.prank(farmer);
        vm.expectRevert();
        pacha.pause();
    }

    // ============================================================
    //              7. INTEGRATION TEST: Full Flow
    // ============================================================

    /**
     * @notice Test de integración: Flujo completo Farm-to-Table
     * @dev Simula el viaje real de un lote de cacao:
     *      1. Farmer cosecha en Esmeraldas
     *      2. Centro de Acopio fermenta (6 días)
     *      3. Centro de Acopio seca al sol (8 días)
     *      4. Exportador empaca en sacos de yute
     *      5. Exportador envía vía marítima
     *      6. Comprador en Europa confirma recepción
     */
    function test_integration_fullFarmToTableFlow() public {
        // === PASO 1: Farmer cosecha cacao ===
        vm.warp(1738368000); // 2025-02-01

        vm.prank(farmer);
        uint256 batchId = pacha.createBatch(
            CACAO,
            "Nacional Fino de Aroma",
            15050, // 150.50 kg
            keccak256(abi.encodePacked("0.3167", "-79.4500", "Finca La Aurora")),
            "Esmeraldas - Quininde",
            block.timestamp,
            "QmHarvestMetadata"
        );

        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Harvested));
        assertEq(pacha.balanceOf(farmer, batchId), 1);

        // === PASO 2: Centro de Acopio fermenta ===
        vm.warp(block.timestamp + 6 days);

        vm.prank(processor);
        pacha.advanceState(
            batchId,
            IPachaChainOrigin.BatchState.Fermented,
            unicode"Fermentación 6 días, cajón de madera de laurel, 48°C máx"
        );

        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Fermented));

        // === PASO 3: Secado al sol ===
        vm.warp(block.timestamp + 8 days);

        vm.prank(processor);
        pacha.advanceState(
            batchId,
            IPachaChainOrigin.BatchState.Dried,
            "Secado solar 8 dias, camas elevadas, humedad final 7%"
        );

        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Dried));

        // === PASO 4: Empacado para exportación ===
        vm.warp(block.timestamp + 2 days);

        vm.prank(exporter);
        pacha.advanceState(
            batchId,
            IPachaChainOrigin.BatchState.Packed,
            "Sacos de yute 69kg, grado exportacion ASS"
        );

        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Packed));

        // === PASO 5: Envío marítimo ===
        vm.warp(block.timestamp + 1 days);

        vm.prank(exporter);
        pacha.advanceState(
            batchId,
            IPachaChainOrigin.BatchState.Shipped,
            "Container MSKU123456, Puerto Guayaquil -> Rotterdam"
        );

        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Shipped));

        // === PASO 6: Recepción en Europa ===
        vm.warp(block.timestamp + 21 days);

        vm.prank(buyer);
        pacha.advanceState(
            batchId,
            IPachaChainOrigin.BatchState.Delivered,
            "Recibido en warehouse Rotterdam, peso verificado 150.30 kg"
        );

        assertEq(uint8(pacha.getBatchState(batchId)), uint8(IPachaChainOrigin.BatchState.Delivered));

        // === VERIFICACIÓN FINAL ===
        IPachaChainOrigin.BatchInfo memory finalInfo = pacha.getBatchInfo(batchId);
        assertEq(finalInfo.farmer, farmer);
        assertEq(uint8(finalInfo.productType), uint8(CACAO));
        assertEq(finalInfo.weightKg, 15050);
        assertEq(uint8(finalInfo.currentState), uint8(IPachaChainOrigin.BatchState.Delivered));

        // El token sigue existiendo y pertenece al farmer
        assertEq(pacha.totalSupply(batchId), 1);
        assertEq(pacha.totalBatches(), 1);

        console2.log("=== FLUJO COMPLETO FARM-TO-TABLE EXITOSO ===");
        console2.log("Batch ID:", batchId);
        console2.log("Farmer:", finalInfo.farmer);
        console2.log("Estado Final: Delivered");
        console2.log("Peso:", finalInfo.weightKg, "kg x100");
    }

    // ============================================================
    //                   8. EDGE CASES
    // ============================================================

    function test_createBatch_withCoffeeType() public {
        vm.prank(farmer);
        uint256 batchId = pacha.createBatch(COFFEE, "Arabica Typica", 3000, ORIGIN_HASH, "Loja", HARVEST_DATE, "");

        IPachaChainOrigin.BatchInfo memory info = pacha.getBatchInfo(batchId);
        assertEq(uint8(info.productType), uint8(COFFEE));
        assertEq(info.variety, "Arabica Typica");
    }

    function test_multipleBatches_shouldBeIndependent() public {
        // Crear dos lotes
        uint256 batch1 = _createTestBatch();
        vm.prank(farmer);
        uint256 batch2 = pacha.createBatch(COFFEE, "Arabica", 5000, ORIGIN_HASH, "Loja", HARVEST_DATE, "");

        // Avanzar solo batch1
        vm.prank(processor);
        pacha.advanceState(batch1, IPachaChainOrigin.BatchState.Fermented, "");

        // batch1 debe estar en Fermented, batch2 en Harvested
        assertEq(uint8(pacha.getBatchState(batch1)), uint8(IPachaChainOrigin.BatchState.Fermented));
        assertEq(uint8(pacha.getBatchState(batch2)), uint8(IPachaChainOrigin.BatchState.Harvested));
    }

    function test_supportsInterface_shouldSupportERC1155() public view {
        // ERC1155 interface ID
        assertTrue(pacha.supportsInterface(0xd9b67a26));
    }

    function test_supportsInterface_shouldSupportAccessControl() public view {
        // AccessControl interface ID
        assertTrue(pacha.supportsInterface(0x7965db0b));
    }

    // ============================================================
    //                   9. FUZZ TESTS
    // ============================================================

    /**
     * @notice Fuzz test: createBatch con pesos aleatorios válidos
     * @dev Foundry genera valores aleatorios para weightKg.
     *      vm.assume filtra valores inválidos (0).
     */
    function testFuzz_createBatch_withRandomWeight(uint256 weightKg) public {
        vm.assume(weightKg > 0);
        vm.assume(weightKg < type(uint128).max); // Límite razonable

        vm.prank(farmer);
        uint256 batchId = pacha.createBatch(CACAO, VARIETY, weightKg, ORIGIN_HASH, REGION, HARVEST_DATE, "");

        assertEq(pacha.getBatchInfo(batchId).weightKg, weightKg);
    }

    /**
     * @notice Fuzz test: createBatch con origin hashes aleatorios válidos
     */
    function testFuzz_createBatch_withRandomOriginHash(bytes32 originHash) public {
        vm.assume(originHash != bytes32(0));

        vm.prank(farmer);
        uint256 batchId = pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, originHash, REGION, HARVEST_DATE, "");

        assertEq(pacha.getBatchInfo(batchId).originHash, originHash);
    }

    // ============================================================
    //          10. PHASE 2: URI STORAGE & METADATA TESTS
    // ============================================================

    function test_uri_shouldReturnIpfsUriWhenSet() public {
        // Cuando se crea un lote con ipfsHash, uri() debe retornar "ipfs://<hash>"
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "QmTest123");

        string memory tokenUri = pacha.uri(batchId);
        // ERC1155URIStorage concatena baseURI ("ipfs://") + tokenURI ("QmTest123")
        assertEq(tokenUri, "ipfs://QmTest123");
    }

    function test_uri_shouldReturnEmptyWhenNoIpfsHash() public {
        // Cuando se crea un lote sin ipfsHash, uri() retorna la URI base vacía
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "");

        string memory tokenUri = pacha.uri(batchId);
        // Sin tokenURI específico, retorna fallback (URI base del constructor = "")
        assertEq(tokenUri, "");
    }

    function test_getBatchURI_shouldReturnCorrectUri() public {
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "QmBatchUri456");

        string memory batchUri = pacha.getBatchURI(batchId);
        assertEq(batchUri, "ipfs://QmBatchUri456");
    }

    function testRevert_getBatchURI_shouldRevert_whenBatchDoesNotExist() public {
        vm.expectRevert(abi.encodeWithSelector(IPachaChainOrigin.BatchDoesNotExist.selector, 99999));
        pacha.getBatchURI(99999);
    }

    function test_updateMetadata_shouldUpdateTokenUri() public {
        // Crear lote con hash inicial
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "QmInitial");

        assertEq(pacha.uri(batchId), "ipfs://QmInitial");

        // Actualizar metadata - debe cambiar también la URI del token
        vm.prank(farmer);
        pacha.updateMetadata(batchId, "QmUpdated999");

        assertEq(pacha.uri(batchId), "ipfs://QmUpdated999");
        assertEq(pacha.getBatchInfo(batchId).ipfsHash, "QmUpdated999");
    }

    function test_updateMetadata_adminShouldUpdateTokenUri() public {
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "QmOrig");

        vm.prank(admin);
        pacha.updateMetadata(batchId, "QmAdminFixed");

        assertEq(pacha.uri(batchId), "ipfs://QmAdminFixed");
    }

    function test_uri_shouldWorkAfterStateTransitions() public {
        // La URI debe persistir a través de transiciones de estado
        vm.prank(farmer);
        uint256 batchId =
            pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "QmPersist");

        // Avanzar por varios estados
        vm.prank(processor);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Fermented, "");

        vm.prank(processor);
        pacha.advanceState(batchId, IPachaChainOrigin.BatchState.Dried, "");

        // La URI debe seguir intacta
        assertEq(pacha.uri(batchId), "ipfs://QmPersist");
    }

    function test_multipleBatches_shouldHaveIndependentUris() public {
        vm.startPrank(farmer);
        uint256 batch1 = pacha.createBatch(CACAO, VARIETY, WEIGHT_KG, ORIGIN_HASH, REGION, HARVEST_DATE, "QmBatch1");
        uint256 batch2 = pacha.createBatch(COFFEE, "Arabica", 5000, ORIGIN_HASH, "Loja", HARVEST_DATE, "QmBatch2");
        vm.stopPrank();

        // Cada lote tiene su propia URI independiente
        assertEq(pacha.uri(batch1), "ipfs://QmBatch1");
        assertEq(pacha.uri(batch2), "ipfs://QmBatch2");

        // Actualizar uno no afecta al otro
        vm.prank(farmer);
        pacha.updateMetadata(batch1, "QmBatch1Updated");

        assertEq(pacha.uri(batch1), "ipfs://QmBatch1Updated");
        assertEq(pacha.uri(batch2), "ipfs://QmBatch2");
    }
}
