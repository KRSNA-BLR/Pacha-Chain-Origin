// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================
//  OpenZeppelin Imports
// ============================================================
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155URIStorage} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

// ============================================================
//  Local Imports
// ============================================================
import {IPachaChainOrigin} from "./interfaces/IPachaChainOrigin.sol";
import {BatchIdGenerator} from "./libraries/BatchIdGenerator.sol";

/**
 * @title PachaChainOrigin
 * @author Pacha-Chain-Origin Team
 * @notice Sistema de trazabilidad Farm-to-Table para cacao y café de Ecuador
 * @dev Implementa una máquina de estados on-chain con roles permisionados,
 *      basada en el estándar GS1 Global Traceability Standard v2.
 *
 *      == Herencia ==
 *      - ERC1155:           Token multi-estándar. Cada batchId = 1 token (supply = 1).
 *      - ERC1155Supply:     Tracking de supply por token. Permite verificar existencia con totalSupply(id) > 0.
 *      - ERC1155Burnable:   Permite quemar lotes cancelados o consumidos.
 *      - ERC1155URIStorage: URI individual por token para metadata IPFS (Fase 2).
 *      - AccessControl:     Roles granulares. Más flexible que Ownable (un solo owner).
 *      - Pausable:          Interruptor de emergencia ante vulnerabilidades.
 *
 *      == Roles ==
 *      - DEFAULT_ADMIN_ROLE: Administrador. Gestiona roles y puede pausar.
 *      - FARMER_ROLE:        Productor. Crea lotes (estado Harvested).
 *      - PROCESSOR_ROLE:     Centro de Acopio. Transiciona a Fermented y Dried.
 *      - EXPORTER_ROLE:      Exportador. Transiciona a Packed y Shipped.
 *      - BUYER_ROLE:         Comprador. Confirma Delivered.
 *
 *      == Máquina de Estados ==
 *      Harvested → Fermented → Dried → Packed → Shipped → Delivered
 *      - Unidireccional: solo avanza
 *      - Secuencial: no salta estados
 *      - Permisionada: cada transición requiere un rol específico
 *
 *      == Estándar GS1 ==
 *      - KDE WHO:   farmer address (criptograficamente verificado via msg.sender)
 *      - KDE WHAT:  productType + variety + weightKg
 *      - KDE WHERE: originHash (keccak256 de coordenadas GPS) + region
 *      - KDE WHEN:  harvestDate + lastUpdate (block.timestamp)
 *      - KDE WHY:   currentState (el Critical Tracking Event que ocurrió)
 *      - CTE:       Cada transición de estado = un Event emitido (audit trail)
 */
contract PachaChainOrigin is
    IPachaChainOrigin,
    ERC1155,
    ERC1155Supply,
    ERC1155Burnable,
    ERC1155URIStorage,
    AccessControl,
    Pausable
{
    using BatchIdGenerator for *;

    // ============================================================
    //                        CONSTANTS
    // ============================================================

    /**
     * @notice Roles del sistema
     * @dev Generados con keccak256 del nombre del rol.
     *      Patrón recomendado por OpenZeppelin AccessControl.
     *      DEFAULT_ADMIN_ROLE = 0x00 (heredado de AccessControl).
     */
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");

    // ============================================================
    //                     STATE VARIABLES
    // ============================================================

    /**
     * @notice Mapping de batchId → información del lote
     * @dev El batchId es el tokenId de ERC-1155.
     *      Storage slot optimizado: los campos se empaquetan en slots de 32 bytes.
     */
    mapping(uint256 => BatchInfo) private _batches;

    /**
     * @notice Nonce para generación de batchIds únicos
     * @dev Se incrementa con cada lote creado. Empieza en 0.
     *      Junto con farmer address y timestamp, garantiza unicidad.
     */
    uint256 private _nonce;

    /**
     * @notice Contador total de lotes creados
     * @dev Separado del nonce por claridad semántica.
     *      nonce = input para generación de ID
     *      totalBatchCount = estadística pública
     */
    uint256 private _totalBatchCount;

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    /**
     * @notice Inicializa el contrato con roles de administrador
     * @dev El deployer recibe DEFAULT_ADMIN_ROLE, que le permite:
     *      - Asignar FARMER_ROLE, PROCESSOR_ROLE, etc. a otras wallets
     *      - Pausar/reanudar el contrato
     *      - Renunciar a su rol si se implementa DAO governance
     *
     *      URI base "ipfs://" permite que cada token tenga su CID individual.
     *      ERC1155URIStorage concatena baseURI + tokenURI por token.
     *
     * @param admin Address del administrador inicial
     */
    constructor(address admin) ERC1155("") {
        if (admin == address(0)) revert InvalidAddress();

        // Base URI para IPFS - se concatena con el CID de cada token
        _setBaseURI("ipfs://");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ============================================================
    //                    FUNCIONES PRINCIPALES
    // ============================================================

    /**
     * @notice Crea un nuevo lote de producto (CTE: Beginning of Life)
     * @dev Flujo:
     *      1. Valida que msg.sender tiene FARMER_ROLE
     *      2. Valida los parámetros de entrada
     *      3. Genera un batchId único con BatchIdGenerator
     *      4. Almacena la información del lote
     *      5. Mintea 1 token ERC-1155 al farmer
     *      6. Emite evento BatchCreated
     *
     *      Gas estimado: ~120,000 (comparable a un mint NFT)
     *
     * @inheritdoc IPachaChainOrigin
     */
    function createBatch(
        ProductType productType,
        string calldata variety,
        uint256 weightKg,
        bytes32 originHash,
        string calldata region,
        uint256 harvestDate,
        string calldata ipfsHash
    ) external override onlyRole(FARMER_ROLE) whenNotPaused returns (uint256 batchId) {
        // --- Validaciones ---
        if (weightKg == 0) revert InvalidWeight(weightKg);
        if (originHash == bytes32(0)) revert InvalidOriginHash();

        // --- Generar ID único ---
        batchId = BatchIdGenerator.generate(msg.sender, block.timestamp, _nonce);
        _nonce++;

        // --- Almacenar información del lote ---
        _batches[batchId] = BatchInfo({
            farmer: msg.sender,
            productType: productType,
            variety: variety,
            weightKg: weightKg,
            originHash: originHash,
            region: region,
            harvestDate: harvestDate,
            lastUpdate: block.timestamp,
            currentState: BatchState.Harvested,
            ipfsHash: ipfsHash
        });

        _totalBatchCount++;

        // --- Mintear token ERC-1155 ---
        // amount = 1 porque cada lote es único (como NFT pero con batch operations)
        // data = "" (no callback data necesario)
        _mint(msg.sender, batchId, 1, "");

        // --- Asignar URI IPFS al token (si se proporcionó) ---
        if (bytes(ipfsHash).length > 0) {
            _setURI(batchId, ipfsHash);
        }

        // --- Emitir evento para indexación off-chain ---
        emit BatchCreated(batchId, msg.sender, productType, weightKg, block.timestamp);

        return batchId;
    }

    /**
     * @notice Avanza el estado de un lote al siguiente estado
     * @dev Implementa la máquina de estados con doble validación:
     *
     *      1. VALIDACIÓN DE ESTADO:
     *         newState debe ser exactamente currentState + 1
     *         Esto garantiza secuencialidad (no se puede saltar estados)
     *
     *      2. VALIDACIÓN DE ROL:
     *         El msg.sender debe tener el rol autorizado para esa transición:
     *         - Fermented, Dried → PROCESSOR_ROLE
     *         - Packed, Shipped  → EXPORTER_ROLE
     *         - Delivered        → BUYER_ROLE
     *
     *      ¿Por qué dos validaciones separadas?
     *      Para dar error messages claros al usuario:
     *      - "Tu lote está en Harvested, no puedes ir directo a Shipped"
     *      - "Eres un Farmer, no puedes ejecutar la transición a Fermented"
     *
     * @inheritdoc IPachaChainOrigin
     */
    function advanceState(uint256 batchId, BatchState newState, string calldata notes)
        external
        override
        whenNotPaused
    {
        // --- Verificar existencia del lote ---
        if (!_batchExists(batchId)) revert BatchDoesNotExist(batchId);

        BatchInfo storage batch = _batches[batchId];
        BatchState currentState = batch.currentState;

        // --- Validar transición secuencial ---
        // newState debe ser exactamente currentState + 1
        if (uint8(newState) != uint8(currentState) + 1) {
            revert InvalidStateTransition(batchId, currentState, newState);
        }

        // --- Validar rol para la transición ---
        _validateTransitionRole(batchId, newState, msg.sender);

        // --- Ejecutar transición ---
        batch.currentState = newState;
        batch.lastUpdate = block.timestamp;

        // --- Emitir evento de auditoría ---
        emit BatchStateChanged(batchId, currentState, newState, msg.sender, block.timestamp, notes);
    }

    /**
     * @notice Actualiza la metadata IPFS de un lote existente
     * @dev Solo el farmer original o un admin pueden actualizar metadata.
     *      Esto protege la integridad de los datos: un procesador no puede
     *      modificar la metadata del lote de otro farmer.
     *
     * @inheritdoc IPachaChainOrigin
     */
    function updateMetadata(uint256 batchId, string calldata ipfsHash) external override whenNotPaused {
        if (!_batchExists(batchId)) revert BatchDoesNotExist(batchId);

        BatchInfo storage batch = _batches[batchId];

        // Solo el farmer original o admin pueden actualizar
        if (msg.sender != batch.farmer && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedForTransition(batchId, batch.currentState, msg.sender);
        }

        batch.ipfsHash = ipfsHash;
        batch.lastUpdate = block.timestamp;

        // Actualizar URI del token ERC-1155 para que uri(batchId) retorne la nueva metadata
        if (bytes(ipfsHash).length > 0) {
            _setURI(batchId, ipfsHash);
        }

        emit BatchMetadataUpdated(batchId, ipfsHash);
    }

    // ============================================================
    //                    FUNCIONES DE LECTURA
    // ============================================================

    /// @inheritdoc IPachaChainOrigin
    function getBatchInfo(uint256 batchId) external view override returns (BatchInfo memory) {
        if (!_batchExists(batchId)) revert BatchDoesNotExist(batchId);
        return _batches[batchId];
    }

    /// @inheritdoc IPachaChainOrigin
    function getBatchState(uint256 batchId) external view override returns (BatchState) {
        if (!_batchExists(batchId)) revert BatchDoesNotExist(batchId);
        return _batches[batchId].currentState;
    }

    /// @inheritdoc IPachaChainOrigin
    function batchExists(uint256 batchId) external view override returns (bool) {
        return _batchExists(batchId);
    }

    /// @inheritdoc IPachaChainOrigin
    function totalBatches() external view override returns (uint256) {
        return _totalBatchCount;
    }

    /// @inheritdoc IPachaChainOrigin
    function getBatchURI(uint256 batchId) external view override returns (string memory) {
        if (!_batchExists(batchId)) revert BatchDoesNotExist(batchId);
        return uri(batchId);
    }

    // ============================================================
    //                    FUNCIONES DE ADMIN
    // ============================================================

    /**
     * @notice Pausa todas las operaciones de escritura del contrato
     * @dev Solo DEFAULT_ADMIN_ROLE puede pausar.
     *      Las funciones de lectura siguen funcionando.
     *      Uso: vulnerabilidad detectada, migración, mantenimiento.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Reanuda las operaciones del contrato
     * @dev Solo DEFAULT_ADMIN_ROLE puede reanudar.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============================================================
    //                   FUNCIONES INTERNAS
    // ============================================================

    /**
     * @notice Valida que el actor tiene el rol correcto para la transición
     * @dev Mapeo de estados a roles:
     *      Fermented → PROCESSOR_ROLE  (Centro de Acopio fermenta)
     *      Dried     → PROCESSOR_ROLE  (Centro de Acopio seca)
     *      Packed    → EXPORTER_ROLE   (Exportador empaca)
     *      Shipped   → EXPORTER_ROLE   (Exportador envía)
     *      Delivered → BUYER_ROLE      (Comprador confirma)
     *
     *      Harvested no requiere validación aquí porque createBatch()
     *      ya tiene el modifier onlyRole(FARMER_ROLE).
     *
     * @param batchId     ID del lote (para mensaje de error)
     * @param targetState Estado al que se quiere transicionar
     * @param actor       Address del actor que ejecuta la transición
     */
    function _validateTransitionRole(uint256 batchId, BatchState targetState, address actor) internal view {
        bytes32 requiredRole;

        if (targetState == BatchState.Fermented || targetState == BatchState.Dried) {
            requiredRole = PROCESSOR_ROLE;
        } else if (targetState == BatchState.Packed || targetState == BatchState.Shipped) {
            requiredRole = EXPORTER_ROLE;
        } else if (targetState == BatchState.Delivered) {
            requiredRole = BUYER_ROLE;
        } else {
            // Harvested se maneja en createBatch con onlyRole(FARMER_ROLE)
            revert InvalidStateTransition(batchId, BatchState.Harvested, targetState);
        }

        if (!hasRole(requiredRole, actor)) {
            revert UnauthorizedForTransition(batchId, targetState, actor);
        }
    }

    /**
     * @notice Verifica si un lote existe usando ERC1155Supply
     * @dev Un lote existe si totalSupply(batchId) > 0.
     *      Esto es más robusto que verificar un campo del struct,
     *      porque está vinculado al token real minteado.
     *
     * @param batchId Token ID del lote
     * @return True si el lote fue creado y el token existe
     */
    function _batchExists(uint256 batchId) internal view returns (bool) {
        return totalSupply(batchId) > 0;
    }

    // ============================================================
    //                  OVERRIDES REQUERIDOS
    // ============================================================

    /**
     * @notice Override requerido por Solidity para resolver herencia múltiple
     * @dev ERC1155 y ERC1155Supply ambos implementan _update.
     *      ERC1155Supply extiende _update para trackear totalSupply.
     *      Debemos indicar explícitamente que queremos la versión de ERC1155Supply.
     */
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    /**
     * @notice Override requerido para resolver herencia entre ERC1155, ERC1155URIStorage y AccessControl
     * @dev ERC1155 y ERC1155URIStorage ambos definen uri().
     *      Preferimos la versión de ERC1155URIStorage que busca URI por token.
     */
    function uri(uint256 tokenId)
        public
        view
        override(ERC1155, ERC1155URIStorage)
        returns (string memory)
    {
        return ERC1155URIStorage.uri(tokenId);
    }

    /**
     * @notice Override requerido para resolver herencia entre ERC1155 y AccessControl
     * @dev Ambos implementan supportsInterface (ERC165).
     *      Combinamos ambas implementaciones para soportar las interfaces de ambos.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
