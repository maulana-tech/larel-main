# Migrasi & Rename: Lax-Stell → Larel

## Ringkasan

Seluruh kodebase akan di-rename dari `Lax-Stell` / `@lax-stell/*` ke `Larel` / `@larel/*`. Termasuk semua varian: `lax-stell`, `LaxStell`, `LAX_STELL`, `lax_stell`, `Lax-Stell`.

---

## Varian Naming

| Sebelum | Sesudah | Contoh |
|---------|---------|--------|
| `lax-stell` | `larel` | `@lax-stell/sdk` → `@larel/sdk` |
| `LaxStell` | `Larel` | `LaxStellContract` → `LarelContract` |
| `LAX_STELL` | `LAREL` | `VITE_LAX_STELL_POOL` → `VITE_LAREL_POOL` |
| `Lax-Stell` | `Larel` | Display text di UI & docs |
| `lax_stell` | `larel` | `lax_stell_lib` → `larel_lib` |
| `lax-stell-deployer` | `larel-deployer` | Stellar identity |

---

## Tahap 1: Package & Monorepo Config

### 1.1 Root package.json
- `name`: `lax-stell` → `larel`

### 1.2 Workspace package.json
| File | `name` Field |
|------|-------------|
| `sdk/package.json` | `@lax-stell/sdk` → `@larel/sdk` |
| `matcher/package.json` | `@lax-stell/matcher` → `@larel/matcher` |
| `bridge/relayer/package.json` | `@lax-stell/relayer` → `@larel/relayer` |
| `bridge/relayer/package.json` | bin: `lax-stell-relayer` → `larel-relayer` |

### 1.3 Dependency references (`workspace:*`)
- `frontend/package.json`: `@lax-stell/sdk` → `@larel/sdk`
- `matcher/package.json`: `@lax-stell/sdk` → `@larel/sdk`

### 1.4 Regenerate lockfiles
```bash
rm pnpm-lock.yaml package-lock.json
pnpm install
```

---

## Tahap 2: Contracts (Rust/Soroban)

### 2.1 Directory renames
```
contracts/lax-stell-pool/        → contracts/larel-pool/
contracts/lax-stell-bridge/      → contracts/larel-bridge/
contracts/lax-stell-swap-router/ → contracts/larel-swap-router/
```

### 2.2 Cargo.toml updates
| File | Change |
|------|--------|
| `contracts/Cargo.toml` | Workspace members: `lax-stell-pool` → `larel-pool`, `lax-stell-bridge` → `larel-bridge`, `lax-stell-swap-router` → `larel-swap-router` |
| `contracts/larel-pool/Cargo.toml` | `name = "larel-pool"` |
| `contracts/larel-bridge/Cargo.toml` | `name = "larel-bridge"` |
| `contracts/larel-swap-router/Cargo.toml` | `name = "larel-swap-router"` |

### 2.3 Rust source files
- `contracts/larel-bridge/src/lib.rs`: comment `LaxStellBridge` → `LarelBridge`, path ref `../lax_stell_pool` → `../larel_pool`
- `contracts/bridge-mpt/src/lib.rs`: `LaxStellBridge` → `LarelBridge`
- `contracts/eth-signal-client/src/lib.rs`: `LaxStellBridge` → `LarelBridge`
- `contracts/eth-signal-client/src/types.rs`: `LaxStellBridge` → `LarelBridge`

### 2.4 Cargo.lock
Akan di-regenerate otomatis setelah rename.

---

## Tahap 3: Noir Circuits

### 3.1 Directory rename
```
circuits/noir/lax_stell_lib/ → circuits/noir/larel_lib/
```

### 3.2 Nargo.toml updates
| File | Change |
|------|--------|
| `circuits/noir/larel_lib/Nargo.toml` | `name = "larel_lib"`, `authors = ["Larel"]` |
| `circuits/noir/withdraw/Nargo.toml` | dep: `lax_stell_lib` → `larel_lib`, authors → `"Larel"` |
| `circuits/noir/transfer/Nargo.toml` | dep: `lax_stell_lib` → `larel_lib` |
| `circuits/noir/place_order/Nargo.toml` | dep: `lax_stell_lib` → `larel_lib` |
| `circuits/noir/match_orders/Nargo.toml` | dep: `lax_stell_lib` → `larel_lib` |
| `circuits/noir/cancel_order/Nargo.toml` | dep: `lax_stell_lib` → `larel_lib`, authors → `"Larel"` |

### 3.3 Noir source files (`use dep::` statements)
Semua file `src/main.nr` di 5 circuits:
```noir
use dep::lax_stell_lib as w;  →  use dep::larel_lib as w;
```

### 3.4 Noir library source
- `circuits/noir/larel_lib/src/lib.nr`: comment → `Larel shared circuit library`

### 3.5 Noir circuit comments
- `withdraw/src/main.nr`: `LaxStell` → `Larel`
- `cancel_order/src/main.nr`: `LaxStell` → `Larel`

### 3.6 Golden gen
- `sdk/test/golden-gen/src/main.nr`: `LaxStell` → `Larel`

---

## Tahap 4: SDK

### 4.1 Source files — class/interface renames
| File | Identifier | New Name |
|------|-----------|----------|
| `sdk/src/index.ts` | `LaxStellSdk` | `LarelSdk` |
| `sdk/src/index.ts` | `LaxStellConfig` | `LarelConfig` |
| `sdk/src/index.ts` | `LaxStell` | `Larel` |
| `sdk/src/stellar.ts` | `LaxStellContract` | `LarelContract` |
| `sdk/src/stellar.ts` | `LaxStellSwapRouterContract` | `LarelSwapRouterContract` |

### 4.2 Comment updates (all sdk/src/*.ts)
- `sdk/src/index.ts`: `@lax-stell/sdk` → `@larel/sdk`, `LaxStell` → `Larel`
- `sdk/src/constants.ts`: `LaxStell` → `Larel`
- `sdk/src/types.ts`: `LaxStell` → `Larel`
- `sdk/src/note-crypto.ts`: `LaxStell` → `Larel` (error message)
- `sdk/src/stellar.ts`: `LaxStellPool` → `LarelPool`
- `sdk/src/match.ts`: `lax_stell_lib` → `larel_lib`
- `sdk/tsup.config.ts`: comment `@lax-stell/sdk` → `@larel/sdk`

### 4.3 Test files
- `sdk/test/stellar.test.ts`: `LaxStellContract` → `LarelContract`
- `sdk/test/index.test.ts`: `LaxStell` → `Larel`
- `sdk/test/poseidon.test.ts`: `LaxStell` → `Larel`

---

## Tahap 5: Matcher

### 5.1 Source files — import paths
Semua file di `matcher/src/` dan `matcher/test/`:
```typescript
from '@lax-stell/sdk'  →  from '@larel/sdk'
```

Files affected:
- `matcher/src/memo.ts`
- `matcher/src/engine.ts`
- `matcher/src/prover.ts`
- `matcher/src/submitter.ts`
- `matcher/src/index.ts`
- `matcher/src/types.ts`
- `matcher/test/memo.test.ts`
- `matcher/test/prover.test.ts`
- `matcher/test/submitter.test.ts`
- `matcher/test/engine.test.ts`

### 5.2 Constant renames
- `matcher/src/submitter.ts`: `LAX_STELL_POOL_CONTRACT` → `LAREL_POOL_CONTRACT`, `LaxStellContract` → `LarelContract`
- `matcher/src/index.ts`: `LAX_STELL_DEPLOYMENTS` → `LAREL_DEPLOYMENTS`, `LAX_STELL_SUBMIT` → `LAREL_SUBMIT`, `LAX_STELL_MATCHER_SECRET` → `LAREL_MATCHER_SECRET`, `LAX_STELL_RPC_URL` → `LAREL_RPC_URL`

### 5.3 Comment updates
- `matcher/src/types.ts`: `LaxStell` → `Larel`
- `matcher/src/engine.ts`: `LaxStell` → `Larel`

### 5.4 Config files
- `matcher/tsconfig.json`: `@lax-stell/sdk` → `@larel/sdk`
- `matcher/vitest.config.ts`: `@lax-stell/sdk` → `@larel/sdk`
- `matcher/tsup.config.ts`: `@lax-stell/sdk` → `@larel/sdk`

### 5.5 Test env vars
- `matcher/test/submitter.test.ts`: `LAX_STELL_POOL_CONTRACT` → `LAREL_POOL_CONTRACT`

---

## Tahap 6: Bridge Relayer

### 6.1 Import paths
- `bridge/relayer/src/config.ts`: `LAX_STELL_BRIDGE_CONTRACT` → `LAREL_BRIDGE_CONTRACT`
- `bridge/relayer/src/index.ts`: `LAX_STELL_BRIDGE_CONTRACT` → `LAREL_BRIDGE_CONTRACT`
- `bridge/relayer/src/l1.ts`: `LAX_STELL_BRIDGE_L1_ABI` → `LAREL_BRIDGE_L1_ABI`
- `bridge/relayer/test/l1.test.ts`: `LAX_STELL_BRIDGE_L1_ABI` → `LAREL_BRIDGE_L1_ABI`

### 6.2 CLI
- `bridge/relayer/src/index.ts`: `lax-stell-relayer` → `larel-relayer`, `LaxStell` → `Larel`
- `bridge/relayer/tsup.config.ts`: comment update

### 6.3 Package.json
- bin: `lax-stell-relayer` → `larel-relayer`
- description: `LaxStell` → `Larel`

### 6.4 Test fixture
- `bridge/relayer/test/inclusion.test.ts`: `lax-stell-note-1` → `larel-note-1`

---

## Tahap 7: Bridge L1 (Solidity)

### 7.1 File renames
```
bridge/l1/src/LaxStellBridgeL1.sol  → bridge/l1/src/LarelBridge.sol
bridge/l1/test/LaxStellBridgeL1.t.sol → bridge/l1/test/LarelBridge.t.sol
```

### 7.2 Contract name
- `bridge/l1/src/LarelBridge.sol`: `LaxStellBridgeL1` → `LarelBridge`

### 7.3 Test
- `bridge/l1/test/LarelBridge.t.sol`: `LaxStellBridgeL1` → `LarelBridge`, `lax-stell-note-1` → `larel-note-1`

---

## Tahap 8: Frontend

### 8.1 File renames
```
frontend/src/lib/lax-stell-sdk.ts   → frontend/src/lib/larel-sdk.ts
frontend/src/hooks/useLaxStell.tsx   → frontend/src/hooks/useLarel.tsx
frontend/src/assets/lax-stell-mark.png → frontend/src/assets/larel-mark.png
```

### 8.2 Package.json
- `frontend/package.json`: `@lax-stell/sdk` → `@larel/sdk`

### 8.3 Import path updates — SDK imports (`from '@lax-stell/sdk'`)
Files:
- `frontend/src/lib/config.ts`
- `frontend/src/lib/shielded-identity.ts`
- `frontend/src/lib/bridge.ts`
- `frontend/src/lib/real-sdk.ts`
- `frontend/src/lib/indexer-service.ts`
- `frontend/src/lib/tokens.ts`
- `frontend/src/lib/note-crypto.ts`
- `frontend/src/lib/indexer.ts`
- `frontend/src/lib/merkle-witness.ts`
- `frontend/src/lib/faucet.ts`
- `frontend/src/lib/note-store.ts`
- `frontend/src/lib/note-secrets.ts`

### 8.4 Import path updates — local imports (`from './lax-stell-sdk'`)
Files:
- `frontend/src/lib/config.ts`
- `frontend/src/lib/bridge.ts`
- `frontend/src/lib/real-sdk.ts`
- `frontend/src/lib/note-store.ts`
- `frontend/src/pages/PortfolioPage.tsx`
- `frontend/src/components/ui.tsx`
- `frontend/src/components/Pay.tsx`
- `frontend/src/hooks/useSubmit.ts`

### 8.5 Local imports (`from '../lib/lax-stell-sdk'` / `from '../hooks/useLaxStell'`)
- `frontend/src/hooks/useSubmit.ts`: `../lib/lax-stell-sdk` → `../lib/larel-sdk`

### 8.6 React hook renames
| File | Identifier | New Name |
|------|-----------|----------|
| `frontend/src/hooks/useLarel.tsx` (renamed) | `LaxStellProvider` | `LarelProvider` |
| `frontend/src/hooks/useLarel.tsx` | `useLaxStell` | `useLarel` |
| `frontend/src/hooks/useLarel.tsx` | `LaxStellContext` | `LarelContext` |
| `frontend/src/hooks/useLarel.tsx` | `LaxStellContextValue` | `LarelContextValue` |
| `frontend/src/hooks/useLarel.tsx` | `LaxStellSdk` type | `LarelSdk` |
| `frontend/src/hooks/useLarel.tsx` | `createLaxStellSdk` | `createLarelSdk` |

### 8.7 Consumer imports (`useLaxStell` → `useLarel`)
- `frontend/src/pages/PortfolioPage.tsx`
- `frontend/src/pages/ReceivePage.tsx`
- `frontend/src/pages/Hub.tsx`
- `frontend/src/components/Bridge.tsx`
- `frontend/src/components/AppLayout.tsx`
- `frontend/src/components/Pay.tsx`
- `frontend/src/components/Swap.tsx`
- `frontend/src/main.tsx`

### 8.8 Frontend SDK interface file
- `frontend/src/lib/larel-sdk.ts` (renamed):
  - `LaxStellSdk` → `LarelSdk`
  - `MockLaxStellSdk` → `MockLarelSdk`
  - `createLaxStellSdk` → `createLarelSdk`

### 8.9 Brand components
- `frontend/src/components/BrandIcons.tsx`:
  - `LaxStellMark` → `LarelMark`
  - `LaxStellSpinnerMark` → `LarelSpinnerMark`
  - endpoint key `'lax-stell'` → `'larel'`
- `frontend/src/components/ui.tsx`: re-exports updated

### 8.10 Environment variables
| Old | New |
|-----|-----|
| `VITE_LAX_STELL_POOL` | `VITE_LAREL_POOL` |
| `VITE_LAX_STELL_SWAP_ROUTER` | `VITE_LAREL_SWAP_ROUTER` |
| `VITE_LAX_STELL_BRIDGE` | `VITE_LAREL_BRIDGE` |

### 8.11 Type declarations
- `frontend/src/vite-env.d.ts`: `VITE_LAX_STELL_*` → `VITE_LAREL_*`

### 8.12 Config constant names
- `frontend/src/lib/config.ts`:
  - `LAX_STELL_BRIDGE_ID` → `LAREL_BRIDGE_ID` (if exported)
  - Comment: `LaxStell` → `Larel`

### 8.13 Bridge constants
- `frontend/src/lib/bridge.ts`:
  - `LAX_STELL_BRIDGE_ID` → `LAREL_BRIDGE_ID`
  - `LAX_STELL_BRIDGE_L1_ABI` → `LAREL_BRIDGE_L1_ABI`

### 8.14 localStorage keys
| Old | New |
|-----|-----|
| `lax-stell.theme` | `larel.theme` |
| `lax-stell:selected-wallet-id` | `larel:selected-wallet-id` |
| `lax-stell.notes.v1` | `larel.notes.v1` |
| `lax-stell.spendingKey.v1` | `larel.spendingKey.v1` |
| `lax-stell.leaves.v1` | `larel.leaves.v1` |
| `lax-stell.indexcursor.v1` | `larel.indexcursor.v1` |
| `lax-stell.orders.v1` | `larel.orders.v1` |
| `lax-stell.scan.` | `larel.scan.` |

### 8.15 UI display strings
- `frontend/index.html`: `<title>` & meta description
- `frontend/src/components/AppLayout.tsx`: alt text, copyright
- `frontend/src/components/Receive.tsx`: alt text
- `frontend/src/components/Landing.tsx`: alt text, copyright, text
- `frontend/src/components/Bridge.tsx`: label, comments
- `frontend/src/components/Pay.tsx`: receive code label
- `frontend/src/components/BrandIcons.tsx`: comments
- `frontend/src/components/PriceChart.tsx`: comment
- `frontend/src/pages/SettingsPage.tsx`: pool label
- `frontend/src/lib/shielded-identity.ts`: wallet name string
- `frontend/src/lib/settings.tsx`: i18n strings (EN, ID, VI, TL)
- `frontend/src/lib/format.ts`: comment
- `frontend/src/lib/larel-sdk.ts`: comments
- `frontend/src/lib/config.ts`: comments

### 8.16 Vite config
- `frontend/vite.config.ts`: comment `@lax-stell/sdk` → `@larel/sdk`

---

## Tahap 9: Scripts & Deployment

### 9.1 Deploy script
- `scripts/deploy.sh`:
  - `lax-stell-deployer` → `larel-deployer`
  - `lax_stell_pool.wasm` → `larel_pool.wasm`
  - `lax_stell_swap_router.wasm` → `larel_swap_router.wasm`
  - `echo "Deploying lax-stell-pool"` → `echo "Deploying larel-pool"`
  - `echo "Deploying lax-stell-swap-router"` → `echo "Deploying larel-swap-router"`
  - `LaxStellPool` → `LarelPool` (in deployments.json merge)
  - `Lax-Stell rebranded redeploy` → `Larel rebranded redeploy`

### 9.2 E2E script
- `scripts/e2e.sh`:
  - `lax-stell-deployer` → `larel-deployer`
  - `pnpm --filter @lax-stell/sdk build` → `pnpm --filter @larel/sdk build`

### 9.3 Matcher env example
- `deploy/matcher.env.example`:
  - `LAX_STELL_MATCHER_SECRET` → `LAREL_MATCHER_SECRET`
  - `LAX_STELL_RPC_URL` → `LAREL_RPC_URL`

### 9.4 Deploy README
- `deploy/README.md`: `Lax-Stell` → `Larel`, `LAX_STELL_*` → `LAREL_*`

---

## Tahap 10: Task Runner & Build Config

### 10.1 justfile
```just
# Semua `@lax-stell/*` → `@larel/*`
pnpm --filter @lax-stell/sdk build     → pnpm --filter @larel/sdk build
pnpm --filter @lax-stell/relayer build → pnpm --filter @larel/relayer build
pnpm --filter @lax-stell/relayer test  → pnpm --filter @larel/relayer test
```

### 10.2 env.sh
- Comment: `LaxStell toolchain environment` → `Larel toolchain environment`

---

## Tahap 11: Documentation

### 11.1 Core docs
- `README.md`: semua `Lax-Stell` → `Larel`, `lax-stell-pool` → `larel-pool`, contract addresses (update jika perlu)
- `CLAUDE.md`: `Lax-Stell` → `Larel`, `@lax-stell/*` → `@larel/*`
- `AGENTS.md`: `Lax-Stell` → `Larel`, `@lax-stell/*` → `@larel/*`
- `DEPLOYMENT.md`: `Lax-Stell` → `Larel`
- `PITCH_DECK.md`: `Lax-Stell` → `Larel`
- `SWAP.md`: `Lax-Stell` → `Larel`

### 11.2 Component READMEs
- `sdk/README.md`
- `matcher/README.md`
- `frontend/README.md`
- `bridge/relayer/README.md`
- `bridge/l1/README.md`
- `circuits/README.md`
- `contracts/eth-light-client/README.md`

---

## Tahap 12: Deck (PPTX)

### 12.1 Script
- `deck/generate_deck.js`: `LaxStell` → `Larel`, `Lax-Stell` → `Larel`, repo URL

### 12.2 Output
- `deck/LaxStell_Pitch_Deck.pptx` → `deck/Larel_Pitch_Deck.pptx`

---

## Tahap 13: Kontrak Names di deployments.json

`deployments.json` berisi nama kontrak on-chain. Perlu update:
- `LaxStellPool` → `LarelPool`
- `LaxStellError` → `LarelError` (jika ada)
- `Lax-Stell rebranded redeploy` → `Larel rebranded redeploy`
- Catatan: alamat kontrak TIDAK berubah (sudah deployed)

---

## Urutan Eksekusi

1. **Rename directories** (contracts, circuits, frontend files)
2. **Update all source files** (search-replace per varian)
3. **Update config files** (package.json, Cargo.toml, Nargo.toml, tsconfig, tsup, vitest, vite, justfile)
4. **Update scripts** (deploy.sh, e2e.sh, env.sh)
5. **Update documentation** (README, CLAUDE.md, AGENTS.md, etc.)
6. **Regenerate lockfiles** (`pnpm install`)
7. **Rebuild SDK** (`pnpm --filter @larel/sdk build`)
8. **Verify build** (`pnpm --filter frontend build`)
9. **Verify tests** (`cd sdk && pnpm test`, `cd matcher && pnpm test`)
10. **Verify contracts** (`cd contracts && cargo build --target wasm32-unknown-unknown --release`)

---

## Checklist Verifikasi

- [ ] `pnpm install` tanpa error
- [ ] `pnpm --filter @larel/sdk build` berhasil
- [ ] `pnpm --filter frontend typecheck` tanpa error
- [ ] `pnpm --filter frontend build` berhasil
- [ ] `cd sdk && pnpm test` semua pass
- [ ] `cd matcher && pnpm test` semua pass
- [ ] `cd bridge/relayer && pnpm test` semua pass
- [ ] `cd contracts && cargo build --target wasm32-unknown-unknown --release` berhasil
- [ ] `source env.sh && cd circuits/noir/withdraw && nargo test` pass
- [ ] Tidak ada string `lax-stell`, `LaxStell`, `LAX_STELL`, `lax_stell` yang tersisa (grep verify)
- [ ] `./scripts/deploy.sh` bisa run (dry-run atau testnet)
- [ ] Frontend dev server start tanpa error

---

## File yang TIDAK Di-rename

- `contracts/bridge-mpt/` — nama tidak mengandung "lax-stell"
- `contracts/eth-light-client/` — nama tidak mengandung "lax-stell"
- `contracts/eth-signal-client/` — nama tidak mengandung "lax-stell"
- `contracts/faucet-token/` — nama tidak mengandung "lax-stell"
- `circuits/noir/withdraw/`, `transfer/`, `place_order/`, `match_orders/`, `cancel_order/` — nama tidak mengandung "lax-stell"

---

## Risiko & Catatan

1. **On-chain contract names** (`LaxStellPool`, `LaxStellError`) sudah di-deploy. Rename di source code hanya untuk codebase baru. Deployments.json yang existing tetap pakai nama lama sampai redeploy.
2. **localStorage keys** berubah → user existing akan kehilangan data lokal (notes, spending key). Consider migration atau version bump.
3. **Stellar identity** `lax-stell-deployer` perlu di-generate ulang sebagai `larel-deployer` di testnet.
4. **Proof format** tidak berubah (rename only).
5. **Git history** akan menunjukkan rename di `git log --follow`.
