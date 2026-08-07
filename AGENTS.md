# AGENTS.md

## What this is

Larel: a confidential trading layer on **Flare**. Shielded balances behind zero-knowledge
proofs (Noir + UltraHonk over BN254), plus a dark pool whose **matching engine runs inside a
TEE** as a Flare Compute Extension. pnpm monorepo with Noir circuits outside the JS package tree.

Target: **Flare Summer Signal · Bounty 2 — Confidential Compute Apps**.

**The repo is mid-migration from Stellar/Soroban to Flare.** Read
[`plan-migrate.md`](./plan-migrate.md) before making architectural changes — it defines the
phases, and Phase 0 has two go/no-go spikes (HonkVerifier gas on Coston2, and the FCE scaffold
running end-to-end) that gate everything else.

**Division of mechanisms — do not blur these.** ZK handles single-party statements (note
ownership, nullifiers, state-transition validity). The TEE handles the one thing ZK structurally
cannot: multi-party computation over secret inputs, i.e. matching two users' orders. If you find
yourself trying to write a circuit that matches orders across users, stop — that is the TEE's job.

## Current migration state

| Area | State |
|---|---|
| `circuits/noir/` | Working. Chain-agnostic, unchanged by the migration. |
| `sdk/` core (Poseidon2, Merkle, notes, proving) | Working. Chain-agnostic. |
| `sdk/src/stellar.ts`, `sdk/src/wallet.ts` | **Stale** — to be replaced by a viem equivalent in Phase 3. |
| `frontend/` | Builds and typechecks. 10 files still import `@stellar/stellar-sdk`. |
| `matcher/` (TypeScript) | Working, but destined to become a Go handler inside the TEE extension. |
| Solidity pool + verifiers | Not written yet. |
| Flare Compute Extension (Go, TEE) | Not written yet. This is the core of the Bounty 2 submission. |
| Flare deployment | None. There are no Flare contract addresses yet — do not invent any. |

Removed in the migration (recoverable from git at `65a14b4`): the Soroban workspace
(`contracts/`), the Ethereum light-client relayer (`bridge/relayer/`, `bridge/deploy/`), the
Stellar deploy/e2e scripts (`scripts/`), and `deployments.json`.

## Monorepo structure

Three pnpm workspace packages (`pnpm-workspace.yaml`):
- `sdk/` — `@larel/sdk` — TypeScript SDK (notes, Poseidon2, Merkle, proofs, tx building). **CJS+ESM dual build via tsup.**
- `matcher/` — `@larel/matcher` — off-chain order matching service. Depends on SDK.
- `frontend/` — `frontend` — React/Vite app. Depends on SDK via `workspace:*`.

Separate workspaces (not pnpm):
- `circuits/noir/` — Noir circuits (withdraw, transfer, place_order, match_orders, cancel_order)
- `bridge/l1/` — Foundry project (`forge-std` submodule). Existing Solidity toolchain, to be
  repurposed as the Flare contract workspace.

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

### Matcher
```bash
cd matcher && pnpm build && pnpm test
```

### Noir circuits
```bash
source ./env.sh           # REQUIRED — pins nargo 1.0.0-beta.9, bb 0.87.0 to PATH
cd circuits/noir/withdraw && nargo test
./circuits/noir/build_all.sh   # compile + test + prove + VK export for all 5 circuits
```

Proof MUST be 14,592 bytes; VK MUST be 1,760 bytes. Enforced by `build_all.sh`.

### Solidity verifier generation (Flare target)
```bash
cd circuits/noir/withdraw
nargo compile
bb write_vk --scheme ultra_honk -b target/withdraw.json -o target/vk
bb write_solidity_verifier --scheme ultra_honk -k target/vk/vk -o target/HonkVerifier.sol
```

## Environment

`source ./env.sh` — adds pinned nargo/bb/rust to PATH. Required before any circuit work.
**Do not upgrade these versions without updating all components** (proof format changes break
on-chain verification).

## Key gotchas

- **Public inputs order is load-bearing.** Each circuit's `main()` signature defines the
  canonical order; `sdk/src/stellar.ts:PUBLIC_INPUT_ORDER` mirrors it. When that file is
  replaced with an EVM encoder, the order must be preserved exactly — write a test vector
  comparing old and new encodings before deploying anything.
- **Do not change `--oracle_hash keccak`** in `build_all.sh`. Solidity verifier generation
  requires the keccak transcript; bb does not implement all hash types for Solidity output.
- **Flare has no ZK infrastructure.** Its docs cover FTSOv2, FDC, FAssets, FXRP, Smart
  Accounts, Confidential Compute (TEE) and node ops — nothing about Noir, Barretenberg,
  UltraHonk or ZK verifiers. Noir/UltraHonk works here only because Flare is EVM-compatible
  through Cancun, so the BN254 pairing precompile is available. Do not look for a "Flare ZK
  stack"; there isn't one.
- **Flare docs are agent-readable.** Append `.md` to any `dev.flare.network` page URL. The
  machine-readable index is at `dev.flare.network/llms.txt`.
- **SDK externalizes heavy deps** (`@aztec/bb.js`, `@noir-lang/noir_js`, `@stellar/stellar-sdk`)
  in `tsup.config.ts`. They're loaded lazily by `prover.ts` and `stellar.ts`. Don't import them
  directly unless you need the prover.
- **Vite excludes bb.js/noir_js from optimizeDeps** (`vite.config.ts`) because WASM+workers
  break esbuild's dev pre-bundler. They must still be bundled for production.
- **FCC is pre-production.** Flare's own docs call it "not yet a fully public production
  system". Expect breakage outside our control; there is a dedicated `fcc/troubleshooting` page.
- **`SIMULATED_TEE=true` is not a privacy claim.** Only `MODE=0` is real attested execution on
  GCP Confidential Space / AMD SEV with vTPM attestation. Never describe simulated runs as
  confidential in docs or submission material.
- **The indexer DB credentials for `ext-proxy` must be requested from Flare support** — external
  lead time, and Phase 2 is fully blocked without them.
- **No automated frontend tests.** Frontend testing is manual via dev server.
- **No CI workflows** are configured in this repo.

## Crypto constants (shared across all components)

Documented in `sdk/src/constants.ts`:
- Poseidon2 over BN254 scalar field
- Merkle tree depth: 20
- Field encoding: little-endian, 32 bytes, 254-bit max
- `commitment = Poseidon2(asset_id, amount, owner_key, blinding)`
- `nullifier = Poseidon2(commitment, spending_key)`
- `owner_key = Poseidon2(spending_key)`

## Reference files

- `plan-migrate.md` — migration phases, risks, go/no-go spike
- `CONTEXT.md` — Flare Summer Signal · Bounty 2 (Confidential Compute Apps) brief, judging criteria, resource links
- `README.md` — system overview, status, prior-vs-new work breakdown
- `frontend/src/lib/config.ts` — deployment config (contract IDs, RPCs, env vars)
