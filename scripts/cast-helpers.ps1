#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Pacha-Chain-Origin: Cast convenience scripts for interacting with deployed contract
.DESCRIPTION
    PowerShell helper functions for common cast operations.
    Source this file: . .\scripts\cast-helpers.ps1
.NOTES
    Requires: foundry (cast), .env with PRIVATE_KEY and CONTRACT_ADDRESS
#>

# ============================================================
#  CONFIGURACIÓN
# ============================================================

# Asegurar foundry en PATH
$env:Path = "$env:USERPROFILE\.foundry\bin;$env:Path"
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"

# Defaults - override via .env o variables de entorno
if (-not $env:RPC_URL)           { $env:RPC_URL = "http://127.0.0.1:8545" }
if (-not $env:CONTRACT_ADDRESS)  { Write-Warning "CONTRACT_ADDRESS not set" }
if (-not $env:PRIVATE_KEY)       { Write-Warning "PRIVATE_KEY not set" }

$CONTRACT = $env:CONTRACT_ADDRESS
$RPC = $env:RPC_URL
$KEY = $env:PRIVATE_KEY

# ============================================================
#  LECTURA (cast call - no gas)
# ============================================================

function Get-TotalBatches {
    <# .SYNOPSIS Get total number of batches created #>
    cast call $CONTRACT "totalBatches()(uint256)" --rpc-url $RPC 2>$null
}

function Get-BatchInfo {
    <# .SYNOPSIS Get batch info by batchId #>
    param([Parameter(Mandatory)][string]$BatchId)
    cast call $CONTRACT "getBatchInfo(uint256)((address,uint8,string,uint256,bytes32,string,uint256,string,uint8))" $BatchId --rpc-url $RPC 2>$null
}

function Get-BatchState {
    <# .SYNOPSIS Get current state of a batch (0=Harvested...5=Delivered) #>
    param([Parameter(Mandatory)][string]$BatchId)
    cast call $CONTRACT "getBatchState(uint256)(uint8)" $BatchId --rpc-url $RPC 2>$null
}

function Get-BatchURI {
    <# .SYNOPSIS Get IPFS URI of a batch #>
    param([Parameter(Mandatory)][string]$BatchId)
    cast call $CONTRACT "uri(uint256)(string)" $BatchId --rpc-url $RPC 2>$null
}

function Get-BatchExists {
    <# .SYNOPSIS Check if a batch exists #>
    param([Parameter(Mandatory)][string]$BatchId)
    cast call $CONTRACT "batchExists(uint256)(bool)" $BatchId --rpc-url $RPC 2>$null
}

function Get-HasRole {
    <# .SYNOPSIS Check if address has a specific role #>
    param(
        [Parameter(Mandatory)][string]$RoleHash,
        [Parameter(Mandatory)][string]$Address
    )
    cast call $CONTRACT "hasRole(bytes32,address)(bool)" $RoleHash $Address --rpc-url $RPC 2>$null
}

function Get-IsPaused {
    <# .SYNOPSIS Check if contract is paused #>
    cast call $CONTRACT "paused()(bool)" --rpc-url $RPC 2>$null
}

function Get-RoleHashes {
    <# .SYNOPSIS Get all role hashes #>
    $farmer    = cast call $CONTRACT "FARMER_ROLE()(bytes32)" --rpc-url $RPC 2>$null
    $processor = cast call $CONTRACT "PROCESSOR_ROLE()(bytes32)" --rpc-url $RPC 2>$null
    $exporter  = cast call $CONTRACT "EXPORTER_ROLE()(bytes32)" --rpc-url $RPC 2>$null
    $buyer     = cast call $CONTRACT "BUYER_ROLE()(bytes32)" --rpc-url $RPC 2>$null
    $admin     = cast call $CONTRACT "DEFAULT_ADMIN_ROLE()(bytes32)" --rpc-url $RPC 2>$null

    Write-Host "ADMIN_ROLE:     $admin"
    Write-Host "FARMER_ROLE:    $farmer"
    Write-Host "PROCESSOR_ROLE: $processor"
    Write-Host "EXPORTER_ROLE:  $exporter"
    Write-Host "BUYER_ROLE:     $buyer"
}

# ============================================================
#  ESCRITURA (cast send - requiere PRIVATE_KEY)
# ============================================================

function Grant-Role {
    <# .SYNOPSIS Grant a role to an address #>
    param(
        [Parameter(Mandatory)][string]$RoleHash,
        [Parameter(Mandatory)][string]$Address
    )
    cast send $CONTRACT "grantRole(bytes32,address)" $RoleHash $Address --rpc-url $RPC --private-key $KEY 2>$null
}

function New-Batch {
    <#
    .SYNOPSIS Create a new batch
    .PARAMETER ProductType 0=Cacao, 1=Coffee
    .PARAMETER Variety Product variety string
    .PARAMETER WeightKg Weight in hectograms (15050 = 150.50 kg)
    .PARAMETER GpsHash Keccak256 hash of GPS coordinates
    .PARAMETER Region Region string
    .PARAMETER HarvestDate Unix timestamp
    .PARAMETER IpfsHash IPFS CID for initial metadata
    #>
    param(
        [Parameter(Mandatory)][int]$ProductType,
        [Parameter(Mandatory)][string]$Variety,
        [Parameter(Mandatory)][int]$WeightKg,
        [Parameter(Mandatory)][string]$GpsHash,
        [Parameter(Mandatory)][string]$Region,
        [Parameter(Mandatory)][int]$HarvestDate,
        [Parameter(Mandatory)][string]$IpfsHash
    )
    cast send $CONTRACT "createBatch(uint8,string,uint256,bytes32,string,uint256,string)" `
        $ProductType $Variety $WeightKg $GpsHash $Region $HarvestDate $IpfsHash `
        --rpc-url $RPC --private-key $KEY 2>$null
}

function Set-BatchState {
    <#
    .SYNOPSIS Advance batch to next state
    .PARAMETER BatchId The batch ID
    .PARAMETER NewState 1=Fermented, 2=Dried, 3=Packed, 4=Shipped, 5=Delivered
    .PARAMETER Notes Notes for the state transition
    #>
    param(
        [Parameter(Mandatory)][string]$BatchId,
        [Parameter(Mandatory)][int]$NewState,
        [Parameter(Mandatory)][string]$Notes
    )
    cast send $CONTRACT "advanceState(uint256,uint8,string)" `
        $BatchId $NewState $Notes `
        --rpc-url $RPC --private-key $KEY 2>$null
}

function Update-BatchMetadata {
    <# .SYNOPSIS Update IPFS metadata for a batch #>
    param(
        [Parameter(Mandatory)][string]$BatchId,
        [Parameter(Mandatory)][string]$IpfsHash
    )
    cast send $CONTRACT "updateMetadata(uint256,string)" `
        $BatchId $IpfsHash `
        --rpc-url $RPC --private-key $KEY 2>$null
}

function Set-Pause {
    <# .SYNOPSIS Pause the contract (admin only) #>
    cast send $CONTRACT "pause()" --rpc-url $RPC --private-key $KEY 2>$null
}

function Set-Unpause {
    <# .SYNOPSIS Unpause the contract (admin only) #>
    cast send $CONTRACT "unpause()" --rpc-url $RPC --private-key $KEY 2>$null
}

# ============================================================
#  STATUS RÁPIDO
# ============================================================

function Show-ContractStatus {
    <# .SYNOPSIS Show quick contract status summary #>
    Write-Host "============================================"
    Write-Host "  Pacha-Chain-Origin Contract Status"
    Write-Host "============================================"
    Write-Host "Contract:      $CONTRACT"
    Write-Host "RPC:           $RPC"
    Write-Host "Chain ID:      $(cast chain-id --rpc-url $RPC 2>$null)"
    Write-Host "Paused:        $(Get-IsPaused)"
    Write-Host "Total Batches: $(Get-TotalBatches)"
    Write-Host "============================================"
}

Write-Host "Pacha-Chain-Origin cast helpers loaded."
Write-Host "Use Show-ContractStatus to see current state."
Write-Host "Use Get-RoleHashes to see role constants."
