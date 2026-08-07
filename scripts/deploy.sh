#!/usr/bin/env bash
# Deploy Larel to Stellar testnet: 5 UltraHonk verifiers (one per circuit VK) + the pool.
# Prereqs: `source ./env.sh`; a funded testnet identity (default: larel-deployer).
set -euo pipefail
export SSL_CERT_FILE="${SSL_CERT_FILE:-/etc/ssl/cert.pem}"
cd "$(dirname "$0")/.."

IDENT="${IDENT:-larel-deployer}"
NET="${NET:-testnet-alt2}"
VERIFIER_WASM="vendor/rs-soroban-ultrahonk/target/wasm32v1-none/release/rs_soroban_ultrahonk.wasm"
POOL_WASM="contracts/target/wasm32v1-none/release/larel_pool.wasm"

stellar keys address "$IDENT" >/dev/null 2>&1 || stellar keys generate "$IDENT" --network "$NET" --fund
stellar keys fund "$IDENT" --network "$NET" || true

echo "==> Building wasms (stellar build needs rust 1.92.0)"
( cd vendor/rs-soroban-ultrahonk && RUSTUP_TOOLCHAIN=1.92.0 stellar contract build )
( cd contracts && RUSTUP_TOOLCHAIN=1.92.0 stellar contract build )

# One verifier per circuit VK. Plain vars (no `declare -A`) so this runs on the
# macOS system bash 3.2 as well as bash 4+.
deploy_vf() {
  stellar contract deploy --wasm "$VERIFIER_WASM" --source "$IDENT" --network "$NET" \
    -- --vk_bytes-file-path "circuits/artifacts/$1/vk" | tail -1
}
echo "==> Deploying verifier: withdraw";     VF_WITHDRAW=$(deploy_vf withdraw);     echo "    $VF_WITHDRAW"
echo "==> Deploying verifier: transfer";     VF_TRANSFER=$(deploy_vf transfer);     echo "    $VF_TRANSFER"
echo "==> Deploying verifier: place_order";  VF_PLACE=$(deploy_vf place_order);     echo "    $VF_PLACE"
echo "==> Deploying verifier: match_orders"; VF_MATCH=$(deploy_vf match_orders);    echo "    $VF_MATCH"
echo "==> Deploying verifier: cancel_order"; VF_CANCEL=$(deploy_vf cancel_order);   echo "    $VF_CANCEL"

# Native-XLM SAC address — the pool maps it to the canonical native asset_id 0
# (SHARED §4) when binding `withdraw`'s `asset` arg to the proof's public `asset_id`.
NATIVE=$(stellar contract id asset --asset native --network "$NET")

FAUCET_WASM="contracts/target/wasm32v1-none/release/faucet_token.wasm"
echo "==> Deploying faucet-token (USDC)"
USDC=$(stellar contract deploy --wasm "$FAUCET_WASM" --source "$IDENT" --network "$NET" -- \
  --decimals 7 --name "Test USD Coin" --symbol "USDC" | tail -1)
echo "    USDC=$USDC"

echo "==> Deploying larel-pool"
POOL=$(stellar contract deploy --wasm "$POOL_WASM" --source "$IDENT" --network "$NET" -- \
  --transfer_vf  "$VF_TRANSFER" \
  --order_vf     "$VF_PLACE" \
  --match_vf     "$VF_MATCH" \
  --withdraw_vf  "$VF_WITHDRAW" \
  --cancel_vf    "$VF_CANCEL" \
  --native_asset "$NATIVE" | tail -1)
echo "    POOL=$POOL"

SWAP_ROUTER_WASM="contracts/target/wasm32v1-none/release/larel_swap_router.wasm"
echo "==> Deploying larel-swap-router"
SWAP_ROUTER=$(stellar contract deploy --wasm "$SWAP_ROUTER_WASM" --source "$IDENT" --network "$NET" | tail -1)
echo "    SWAP_ROUTER=$SWAP_ROUTER"

# Merge the fresh Larel contract ids into the existing deployments.json
# (preserving bridge / faucet / e2e / history) rather than clobbering it.
DEPLOYER_ADDR="$(stellar keys address "$IDENT")"
DEPLOY_DATE="$(date +%Y-%m-%d)"

POOL="$POOL" SWAP_ROUTER="$SWAP_ROUTER" NATIVE="$NATIVE" USDC="$USDC" DEPLOYER_ADDR="$DEPLOYER_ADDR" DEPLOY_DATE="$DEPLOY_DATE" \
VF_WITHDRAW="$VF_WITHDRAW" VF_TRANSFER="$VF_TRANSFER" VF_PLACE="$VF_PLACE" \
VF_MATCH="$VF_MATCH" VF_CANCEL="$VF_CANCEL" \
python3 - "$@" <<'PY'
import json, os, pathlib
p = pathlib.Path("deployments.json")
d = json.loads(p.read_text()) if p.exists() else {}
env = os.environ
d["network"] = env.get("NET", d.get("network", "testnet"))
d["deployer"] = env["DEPLOYER_ADDR"]
d["deployedAt"] = env["DEPLOY_DATE"]
c = d.setdefault("contracts", {})
# Fresh Larel pool (rebranded redeploy) — this is what the frontend targets.
c["laxStellPoolMatchMemo"] = {
    "note": f"Larel rebranded redeploy ({env['DEPLOY_DATE']}): pool + 5 verifiers rebuilt "
            "from larel source (LarelPool/LarelError symbols). Reuses existing faucet SACs.",
    "contract": env["POOL"],
    "deployer": env["DEPLOYER_ADDR"],
}
c["laxStellSwapRouter"] = {
    "note": "zStellar private AMM swap router supporting shielded deposits, withdraws, and Soroswap integration.",
    "contract": env["SWAP_ROUTER"],
    "deployer": env["DEPLOYER_ADDR"],
}
c["verifiers"] = {
    "withdraw": env["VF_WITHDRAW"], "transfer": env["VF_TRANSFER"],
    "place_order": env["VF_PLACE"], "match_orders": env["VF_MATCH"],
    "cancel_order": env["VF_CANCEL"],
}
assets = c.setdefault("assets", {})
assets["native"] = env["NATIVE"]
assets["usdc"] = env["USDC"]
p.write_text(json.dumps(d, indent=2) + "\n")
print(f"==> Merged fresh ids into deployments.json (pool={env['POOL']}, swap_router={env['SWAP_ROUTER']}, usdc={env['USDC']})")
PY
