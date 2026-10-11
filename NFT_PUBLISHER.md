# Pazos NFT Publisher v0.1

Panel CEP ligero para Illustrator 2023.

## Objetivo

Preparar una obra para un NFT ERC-721 sin guardar claves privadas ni seed phrases.

## Modos

### Preparación local
- exporta la selección como SVG o PNG;
- genera `metadata.json`;
- valida URIs `ipfs://`;
- genera `mint-request.json`.

### Sepolia testnet
Preset:
- red: Sepolia;
- chain ID: `11155111`;
- método esperado: `mint(address,string)`.

La firma NO ocurre en Illustrator. Debe realizarse con una wallet externa.

## Seguridad

El panel:
- no solicita claves privadas;
- no solicita seed phrases;
- no guarda secretos;
- tiene `connect-src 'none'`;
- no ejecuta transacciones automáticamente;
- no despliega contratos automáticamente.

## Contrato de ejemplo

Ver:

`nft-contract/contracts/PazosNFT.sol`

Está diseñado para pruebas ERC-721 con OpenZeppelin y propietario único.

## Flujo recomendado

1. Exporta `artwork.svg` o `artwork.png`.
2. Sube el activo a un almacenamiento apropiado para NFT (por ejemplo IPFS).
3. Actualiza el campo `image` de metadata.
4. Guarda `metadata.json` y súbelo a IPFS.
5. Copia el URI `ipfs://...` al campo Token URI.
6. Usa una wallet externa para firmar el mint en Sepolia.

Los tokens y ETH de Sepolia son de prueba y no tienen valor económico real.
