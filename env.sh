#!/usr/bin/env bash
# Larel toolchain environment.
# Source this before running nargo / bb:  `source ./env.sh`
export PATH="$HOME/.nargo/bin:$HOME/.bb:$HOME/.cargo/bin:/opt/homebrew/bin:$PATH"

# Pinned toolchain — MUST match the deployed UltraHonk verifiers:
#   nargo   1.0.0-beta.9            (noirup -v 1.0.0-beta.9)
#   bb      0.87.0                  (bbup   -v 0.87.0)
#   poseidon lib  v0.2.0            (github.com/noir-lang/poseidon)
# Verified proof = 14592 bytes, vk = 1760 bytes (UltraHonk, keccak transcript).
#
# Target is Flare / Coston2 (chainId 114), so verifiers are Solidity, generated with
#   bb write_solidity_verifier --scheme ultra_honk -k <vk> -o <out>
# The keccak transcript that build_all.sh already uses is exactly what that command
# requires — do not switch oracle_hash. The stellar-cli pin was dropped along with the
# Soroban workspace; see plan-migrate.md.
