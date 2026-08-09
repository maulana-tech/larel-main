# Larel: Confidential Trading Layer on Flare (Bounty 2)

Larel is a confidential dark pool designed for **Flare Summer Signal (Bounty 2: Confidential Compute Apps)**. It leverages Zero-Knowledge Proofs (Noir) for state validation and **Flare Compute Extension (TEE)** for off-chain private order matching.

## Architecture & Components

Larel consists of three main pillars, all of which are successfully built and tested for this hackathon submission:

1. **EVM Smart Contracts (Coston2 Testnet)**
   - `LarelPool.sol`: Core state contract managing shielded balances, deposits, withdrawals, and settlement logic.
   - `HonkVerifier.sol`: Zero-knowledge proof verifiers (UltraHonk scheme) generated from Noir circuits.
   - `MockPoseidon.sol`: EVM Poseidon hasher.

2. **TEE Matching Engine (TypeScript FCE)**
   - An off-chain node written in TypeScript, packaged into a Flare Compute Extension Docker image (`sign-extension-typescript:v0.1.0`).
   - Responsible for ingesting encrypted limit orders, finding matches in a private memory pool, and emitting EVM-compatible ABI-encoded match payloads directly to the L1 pool contract.

3. **Noir Circuits & SDK**
   - 5 Zero-Knowledge circuits (`deposit`, `withdraw`, `transfer`, `place_order`, `cancel_order`) written in Noir to ensure validity without revealing user state.
   - `@larel/sdk`: TypeScript SDK for generating Poseidon commitments and Merkle proofs on the client side.

## Deployed Addresses (Flare Coston2)
These contracts are live on Coston2 and have been verified:
- **LarelPool**: `0x787A5B643b22FDe788E33f8D6a69F9B51E60613f`
- **WithdrawVerifier**: `0xbDF2997C61053733A184cBc2878B3Fff7c81dC2f`
- **MockPoseidon**: `0xe390b395DCAa95c93c4eACd20737a44f5E3A1A60`

## Testing the System

### 1. Smart Contracts
The contracts are located in `contracts`. They have been compiled and deployed using Foundry.
```bash
cd contracts
forge build
```

### 2. TypeScript SDK & ZK Prover
The core cryptographic logic has full test coverage.
```bash
cd sdk
pnpm build
pnpm test
```

### 3. TEE Matching Engine
The matching engine logic has full test coverage and successfully builds into a Google Confidential Space compatible TEE Docker image.
```bash
cd matcher
pnpm test

# The Flare Compute Extension image has been built locally as:
# sign-extension-typescript:v0.1.0
```

### 4. Running the Frontend
The frontend connects to Coston2 using Wagmi and Viem.
```bash
pnpm install
just dev
```

## Migration Note
This repository was successfully migrated from Stellar/Soroban to Flare EVM for this hackathon. The old Stellar-specific SDK files and Soroban contracts have been removed or replaced with `viem` and `wagmi` integrations pointing to Coston2.
