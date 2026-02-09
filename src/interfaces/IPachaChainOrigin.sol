// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPachaChainOrigin
 * @author Pacha-Chain-Origin Team
 * @notice Interface del sistema de trazabilidad Farm-to-Table
 * @dev Define la API pública, eventos, structs y enums del contrato principal.
 *
 * == Diseño basado en GS1 Global Traceability Standard v2 ==
 *
 * Cada enum BatchState representa un Critical Tracking Event (CTE) de GS1:
 * - Harvested  → "Beginning of life" CTE
 * - Fermented  → "Transformation" CTE (proceso químico)
 * - Dried      → "Transformation" CTE (proceso físico)
 * - Packed     → "Transformation" CTE (empacado para exportación)
 * - Shipped    → "Shipping" CTE
 * - Delivered  → "Receiving" CTE
 *
 * Cada campo de BatchInfo mapea a un Key Data Element (KDE) de GS1:
 * - WHO  → farmer (address, criptográficamente verificado)
 * - WHAT → productType + variety + weightKg
 * - WHERE → originHash + region
 * - WHEN → harvestDate + lastUpdate (block.timestamp)
 * - WHY  → currentState (el evento de negocio que ocurrió)
 */
interface IPachaChainOrigin {
    // ============================================================
    //                          ENUMS
    // ============================================================

    /**
     * @notice Tipo de producto rastreable
     * @dev Ecuador es líder mundial en cacao fino de aroma (63% del mercado)
     *      y tiene café de especialidad en crecimiento.
     */
    enum ProductType {
        Cacao, // 0
        Coffee // 1
    }

    /**
     * @notice Estados del lote en la cadena de suministro
     * @dev Máquina de estados unidireccional y secuencial.
     *      Cada estado solo puede avanzar al siguiente (nunca retroceder).
     *
     *      Harvested(0) → Fermented(1) → Dried(2) → Packed(3) → Shipped(4) → Delivered(5)
     *
     *      Las transiciones son ejecutadas por el rol autorizado:
     *      - Harvested:  FARMER_ROLE     (productor cosecha)
     *      - Fermented:  PROCESSOR_ROLE  (centro de acopio fermenta)
     *      - Dried:      PROCESSOR_ROLE  (centro de acopio seca)
     *      - Packed:     EXPORTER_ROLE   (exportador empaca)
     *      - Shipped:    EXPORTER_ROLE   (exportador envía)
     *      - Delivered:  BUYER_ROLE      (comprador confirma recepción)
     */
    enum BatchState {
        Harvested, // 0
        Fermented, // 1
        Dried, // 2
        Packed, // 3
        Shipped, // 4
        Delivered // 5
    }

    // ============================================================
    //                         STRUCTS
    // ============================================================

    /**
     * @notice Información completa de un lote de producto
     * @dev Almacenada on-chain. Mapea a GS1 Key Data Elements (KDE).
     *
     *      Decisiones de diseño:
     *      - `weightKg` usa uint256 multiplicado x100 para 2 decimales
     *        (ej: 150.50kg = 15050). Evita floating point.
     *      - `originHash` usa bytes32 = keccak256(lat, lon, farmName).
     *        Ahorra gas vs string y protege privacidad del productor.
     *      - `variety` y `region` como string por flexibilidad.
     *        No se acceden en lógica de negocio, solo storage.
     *
     * @param farmer       GS1 WHO: Address del productor original
     * @param productType  GS1 WHAT: Cacao o Café
     * @param variety      GS1 WHAT: Variedad específica ("Nacional", "CCN-51", "Arábica")
     * @param weightKg     GS1 WHAT: Peso en kg x100 (15050 = 150.50 kg)
     * @param originHash   GS1 WHERE: Hash de ubicación keccak256(lat, lon, farm)
     * @param region       GS1 WHERE: Provincia/Cantón de Ecuador
     * @param harvestDate  GS1 WHEN: Timestamp Unix de la cosecha
     * @param lastUpdate   GS1 WHEN: Timestamp de la última transición de estado
     * @param currentState GS1 WHY: Estado actual en la máquina de estados
     * @param ipfsHash     Metadata extendida off-chain (fotos, certificados, etc.)
     */
    struct BatchInfo {
        address farmer;
        ProductType productType;
        string variety;
        uint256 weightKg;
        bytes32 originHash;
        string region;
        uint256 harvestDate;
        uint256 lastUpdate;
        BatchState currentState;
        string ipfsHash;
    }

    // ============================================================
    //                         EVENTS
    // ============================================================

    /**
     * @notice Emitido cuando se crea un nuevo lote (CTE: Beginning of Life)
     * @dev Indexado por batchId y farmer para búsqueda eficiente en logs.
     *      El frontend escucha este evento para actualizar la UI.
     *
     * @param batchId      Token ID del lote (ERC-1155)
     * @param farmer       Address del productor que creó el lote
     * @param productType  Tipo de producto (Cacao/Coffee)
     * @param weightKg     Peso del lote en kg x100
     * @param timestamp    Timestamp del bloque
     */
    event BatchCreated(
        uint256 indexed batchId,
        address indexed farmer,
        ProductType productType,
        uint256 weightKg,
        uint256 timestamp
    );

    /**
     * @notice Emitido cuando un lote cambia de estado (CTE principal)
     * @dev Este es el evento más importante para trazabilidad.
     *      Indexado por batchId, previousState y newState para queries eficientes.
     *
     *      Ejemplo de consulta: "Dame todos los lotes que pasaron a Shipped hoy"
     *      → Filter por newState = Shipped + timestamp range
     *
     * @param batchId        Token ID del lote
     * @param previousState  Estado antes de la transición
     * @param newState       Estado después de la transición
     * @param actor          Address del actor que ejecutó la transición
     * @param timestamp      Timestamp del bloque
     * @param notes          Notas opcionales del actor (ej: "Fermentación 6 días, cajón madera")
     */
    event BatchStateChanged(
        uint256 indexed batchId,
        BatchState indexed previousState,
        BatchState indexed newState,
        address actor,
        uint256 timestamp,
        string notes
    );

    /**
     * @notice Emitido cuando se actualiza la metadata IPFS de un lote
     * @param batchId   Token ID del lote
     * @param ipfsHash  Nuevo CID de IPFS
     */
    event BatchMetadataUpdated(uint256 indexed batchId, string ipfsHash);

    // ============================================================
    //                    CUSTOM ERRORS
    // ============================================================

    /// @notice El lote no existe (nunca fue creado)
    error BatchDoesNotExist(uint256 batchId);

    /// @notice Transición de estado inválida (no es el siguiente estado secuencial)
    error InvalidStateTransition(uint256 batchId, BatchState currentState, BatchState requestedState);

    /// @notice El actor no tiene el rol requerido para esta transición
    error UnauthorizedForTransition(uint256 batchId, BatchState targetState, address actor);

    /// @notice Peso inválido (debe ser > 0)
    error InvalidWeight(uint256 weightKg);

    /// @notice Origin hash inválido (no puede ser bytes32(0))
    error InvalidOriginHash();

    /// @notice Dirección inválida (address(0))
    error InvalidAddress();

    // ============================================================
    //                    FUNCIONES PRINCIPALES
    // ============================================================

    /**
     * @notice Crea un nuevo lote de producto (CTE: Beginning of Life)
     * @dev Solo puede ser llamada por FARMER_ROLE.
     *      Mintea 1 token ERC-1155 con un nuevo batchId único.
     *      El batchId se genera usando BatchIdGenerator.
     *
     * @param productType  Tipo de producto (Cacao/Coffee)
     * @param variety      Variedad del producto
     * @param weightKg     Peso en kg x100 (ej: 15050 = 150.50 kg)
     * @param originHash   Hash de ubicación keccak256(lat, lon, farmName)
     * @param region       Provincia/Cantón de Ecuador
     * @param harvestDate  Timestamp Unix de la cosecha
     * @param ipfsHash     CID de IPFS con metadata extendida (puede ser vacío)
     * @return batchId     El ID del lote creado (tokenId ERC-1155)
     */
    function createBatch(
        ProductType productType,
        string calldata variety,
        uint256 weightKg,
        bytes32 originHash,
        string calldata region,
        uint256 harvestDate,
        string calldata ipfsHash
    ) external returns (uint256 batchId);

    /**
     * @notice Avanza el estado de un lote al siguiente estado
     * @dev Valida:
     *      1. El lote existe
     *      2. El nuevo estado es exactamente currentState + 1 (secuencial)
     *      3. El msg.sender tiene el rol requerido para esa transición
     *
     * @param batchId  Token ID del lote
     * @param newState El siguiente estado al que se quiere transicionar
     * @param notes    Notas opcionales sobre la transición
     */
    function advanceState(uint256 batchId, BatchState newState, string calldata notes) external;

    /**
     * @notice Actualiza la metadata IPFS de un lote existente
     * @dev Solo puede ser llamada por el farmer original del lote
     *      o por un ADMIN.
     *
     * @param batchId   Token ID del lote
     * @param ipfsHash  Nuevo CID de IPFS
     */
    function updateMetadata(uint256 batchId, string calldata ipfsHash) external;

    // ============================================================
    //                    FUNCIONES DE LECTURA
    // ============================================================

    /**
     * @notice Obtiene toda la información de un lote
     * @param batchId Token ID del lote
     * @return info   Struct BatchInfo completa
     */
    function getBatchInfo(uint256 batchId) external view returns (BatchInfo memory info);

    /**
     * @notice Obtiene el estado actual de un lote
     * @param batchId Token ID del lote
     * @return state  Estado actual del lote
     */
    function getBatchState(uint256 batchId) external view returns (BatchState state);

    /**
     * @notice Verifica si un lote existe
     * @param batchId Token ID del lote
     * @return exists True si el lote fue creado
     */
    function batchExists(uint256 batchId) external view returns (bool exists);

    /**
     * @notice Obtiene el contador total de lotes creados
     * @return count Número total de lotes
     */
    function totalBatches() external view returns (uint256 count);

    /**
     * @notice Obtiene la URI completa de metadata IPFS de un lote
     * @dev Retorna baseURI + tokenURI (ej: "ipfs://QmABC123...")
     *      Si no tiene metadata, retorna la URI base del contrato.
     *
     * @param batchId Token ID del lote
     * @return uri    URI completa de la metadata del lote
     */
    function getBatchURI(uint256 batchId) external view returns (string memory uri);
}
