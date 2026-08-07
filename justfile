# Larel — dev task runner.  `just` (or `just --list`) shows all recipes.
#
# Prereqs: pnpm (workspace deps). The frontend reads bridge wiring from
# frontend/.env.local (contract addresses + RPCs; no secrets).

set shell := ["bash", "-uc"]

# List available recipes.
default:
    @just --list

# --- setup -----------------------------------------------------------------

# Install all workspace dependencies.
install:
    pnpm install

# Build the TypeScript SDK — the frontend imports @larel/sdk from dist/.
sdk:
    pnpm --filter @larel/sdk build

# One-time first-run setup: install deps + build the SDK.
setup: install sdk

# --- run the app (dev mode) ------------------------------------------------

# Run the app in dev mode (build SDK, then Vite at http://localhost:5173).
dev: sdk
    pnpm --filter frontend dev

# Frontend only (assumes the SDK is already built).
frontend:
    pnpm --filter frontend dev

# Typecheck the frontend without emitting.
typecheck:
    pnpm --filter frontend typecheck

# Production build of the frontend (tsc + vite build).
build:
    pnpm --filter frontend build

# --- flare / evm contracts -------------------------------------------------
# The Soroban workspace and the Ethereum light-client relayer were removed in the
# migration to Flare: the Flare Data Connector (FdcHub → FdcVerification) does the
# cross-chain attestation natively, so there is nothing to relay. EVM contract
# recipes land here once contracts-evm/ exists — see plan-migrate.md.
