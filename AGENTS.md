# AGENTS.md

## What this is

Larel: a full-privacy platform on Stellar using zero-knowledge proofs (UltraHonk/BN254) for shielded assets, private transfers, and dark pool trading. pnpm monorepo with a Rust contracts workspace and Noir circuits outside the JS package tree.

## Monorepo structure

Four pnpm workspace packages (`pnpm-workspace.yaml`):
- `sdk/` — `@larel/sdk` — TypeScript SDK (notes, Poseidon2, Merkle, proofs, tx building). **CJS+ESM dual build via tsup.**
- `matcher/` — `@larel/matcher` — Off-chain order matching service. Depends on SDK.
- `frontend/` — `frontend` — React/Vite app. Depends on SDK via `workspace:*`.
- `bridge/relayer/` — `@larel/relayer` — Ethereum→Stellar relayer. Depends on SDK.

Separate workspaces (not pnpm):
- `contracts/` — Rust/Soroban contracts (`cargo build --target wasm32-unknown-unknown --release`)
- `circuits/noir/` — Noir circuits (withdraw, transfer, place_order, match_orders, cancel_order)

## Critical build order

The frontend imports `@larel/sdk` from `dist/`. **Always build the SDK before the frontend or running tests:**

```bash
pnpm --filter @larel/sdk build   # or: just sdk
```

Full setup: `just setup` (installs deps + builds SDK).

## Commands

### Frontend
```bash
just dev                  # build SDK + start Vite dev server (localhost:5173)
just typecheck            # tsc --noEmit (frontend only)
just build                # tsc --noEmit && vite build
pnpm --filter frontend lint   # eslint (flat config, eslint.config.js)
```

### SDK
```bash
cd sdk && pnpm build      # tsup → dist/index.{js,cjs,d.ts}
cd sdk && pnpm test       # vitest run (120s timeout)
cd sdk && pnpm typecheck  # tsc --noEmit
```

### Matcher / Relayer
```bash
cd matcher && pnpm build && pnpm test
cd bridge/relayer && pnpm build && pnpm test
# or: just relayer watch   (builds + runs relayer CLI)
# or: just relayer-test    (runs relayer tests)
```

### Contracts (Rust)
```bash
cd contracts && cargo build --target wasm32-unknown-unknown --release
cd contracts && cargo test
./scripts/deploy.sh       # deploys to Stellar testnet, writes deployments.json
```

### Noir Circuits
```bash
source ./env.sh           # REQUIRED — pins nargo 1.0.0-beta.9, bb 0.87.0 to PATH
cd circuits/noir/withdraw && nargo test
./circuits/noir/build_all.sh   # compile + test + prove + VK export for all 5 circuits
```

Proof MUST be 14,592 bytes; VK MUST be 1,760 bytes. Enforced by `build_all.sh`.

### E2E
```bash
./scripts/e2e.sh
# Prereqs: source ./env.sh, SDK built, deployments.json present, identity `larel-deployer`
```

## Environment

`source ./env.sh` — adds pinned nargo/bb/stellar/rust to PATH. Required before any circuit or contract deployment work. **Do not upgrade these versions without updating all components** (proof format changes break on-chain verification).

## Key gotchas

- **SDK externalizes heavy deps** (`@aztec/bb.js`, `@noir-lang/noir_js`, `@stellar/stellar-sdk`) in `tsup.config.ts`. They're loaded lazily by `prover.ts` and `stellar.ts`. Don't import them directly unless you need the prover.
- **Vite excludes bb.js/noir_js from optimizeDeps** (`vite.config.ts`) because WASM+workers break esbuild's dev pre-bundler. They must still be bundled for production.
- **`deployments.json` is gitignored** but is the canonical source of contract addresses. The frontend reads from `frontend/.env.local` (also gitignored) or falls back to compiled defaults in `frontend/src/lib/config.ts`.
- **Deploy script uses `testnet-alt2`** (not `testnet`) and overrides Rust to 1.92.0 for `stellar contract build`.
- **Public inputs order is load-bearing.** Each circuit's `main()` signature defines the canonical order. Reordering breaks on-chain verification.
- **Merkle tree roots must come from on-chain state** before generating proofs. Stale roots cause verification failures.
- **`vendor/` is gitignored** — contains `rs-soroban-ultrahonk` (verifier WASM). Clone separately if you need to rebuild the verifier.
- **No automated frontend tests.** Frontend testing is manual via dev server.
- **No CI workflows** are configured in this repo.

## Crypto constants (shared across all components)

Documented in `SHARED.md` (if present) or `sdk/src/constants.ts`:
- Poseidon2 over BN254 scalar field
- Merkle tree depth: 20
- Field encoding: little-endian, 32 bytes, 254-bit max
- `commitment = Poseidon2(asset_id, amount, owner_key, blinding)`
- `nullifier = Poseidon2(commitment, spending_key)`
- `owner_key = Poseidon2(spending_key)`

## Reference files

- `CLAUDE.md` — detailed architecture, patterns, and extended workflow docs
- `README.md` — system overview, contract addresses, quick start
- `SHARED.md` — cross-component cryptographic constants (if present)
- `TOOLCHAIN.md` — pinned toolchain versions
- `BRIDGE_SPEC.md` / `BRIDGE_DEPLOYMENT.md` — bridge architecture
- `frontend/src/lib/config.ts` — live deployment config (contract IDs, RPCs, env vars)
