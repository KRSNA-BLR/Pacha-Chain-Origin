// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BatchIdGenerator
 * @author Pacha-Chain-Origin Team
 * @notice Librería para generar IDs únicos de lotes de producto
 * @dev Genera un batchId determinístico basado en:
 *      - Dirección del farmer (WHO en GS1)
 *      - Timestamp del bloque (WHEN en GS1)
 *      - Un nonce secuencial (unicidad garantizada)
 *
 *      Ventajas de este enfoque:
 *      1. Determinístico: Para los mismos inputs, mismo output (verificable)
 *      2. Colisión-resistente: keccak256 produce 256 bits de entropía
 *      3. Sin dependencia externa: No necesita oráculo ni servicio externo
 *      4. Gas-eficiente: Solo una operación keccak256
 *
 *      El nonce se maneja externamente (en el contrato principal)
 *      para mantener esta librería stateless y reutilizable.
 *
 *      == Mapeo GS1 ==
 *      Este ID cumple la función del GTIN + Batch/Lot Number de GS1,
 *      adaptado al contexto blockchain donde los identificadores son uint256.
 */
library BatchIdGenerator {
    /**
     * @notice Genera un batchId único para un nuevo lote
     * @dev Usa keccak256 para producir un hash de 32 bytes, luego
     *      lo convierte a uint256 para usar como tokenId ERC-1155.
     *
     *      La combinación de farmer + timestamp + nonce garantiza unicidad:
     *      - Mismo farmer, mismo bloque → nonce diferente
     *      - Mismo farmer, diferente bloque → timestamp diferente
     *      - Diferente farmer → address diferente
     *
     * @param farmer    Address del productor que crea el lote
     * @param timestamp Timestamp del bloque actual (block.timestamp)
     * @param nonce     Contador secuencial del contrato
     * @return batchId  ID único del lote (uint256)
     */
    function generate(address farmer, uint256 timestamp, uint256 nonce) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(farmer, timestamp, nonce)));
    }
}
