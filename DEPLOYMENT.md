# Larel — Live on Stellar Testnet

The full system is deployed and the end-to-end private flow is **verified on-chain**. Every claim below is backed by a testnet transaction you can open on stellar.expert.

## Contracts (testnet)

The primary contracts deployed on Stellar Testnet:

| Contract | ID |
|----------|----|
| **Larel Pool** | [`CBZNNVUKTG6YSVT3NGV7MDVL5ZQO5D4KLLIRFAGBCORPH7Q62ZHS5RP3`](https://stellar.expert/explorer/testnet/contract/CBZNNVUKTG6YSVT3NGV7MDVL5ZQO5D4KLLIRFAGBCORPH7Q62ZHS5RP3) |
| Verifier · withdraw | [`CDS245ZQLXFIYD2TPSJWZLAO6TOZOGRF6FQWAJ35J5SG6A7WNMHUMD5B`](https://stellar.expert/explorer/testnet/contract/CDS245ZQLXFIYD2TPSJWZLAO6TOZOGRF6FQWAJ35J5SG6A7WNMHUMD5B) |
| Verifier · transfer | [`CCTHUAA3I4R2BRUQEFREHQ3AWVLTCZECAZ7JRG5S23FM44LP27RY5NZB`](https://stellar.expert/explorer/testnet/contract/CCTHUAA3I4R2BRUQEFREHQ3AWVLTCZECAZ7JRG5S23FM44LP27RY5NZB) |
| Verifier · place_order | [`CABWY7YM7C4FCJBGQ7KG47N6NKZOBHWGMHAEYDTOGE6LDPOLZNGR2BF6`](https://stellar.expert/explorer/testnet/contract/CABWY7YM7C4FCJBGQ7KG47N6NKZOBHWGMHAEYDTOGE6LDPOLZNGR2BF6) |
| Verifier · match_orders | [`CCKOCCPIYRRSCFNGDW3BDOGW4R2V7XY6KYHZVJDFB5KTKR5U3LPMAB5T`](https://stellar.expert/explorer/testnet/contract/CCKOCCPIYRRSCFNGDW3BDOGW4R2V7XY6KYHZVJDFB5KTKR5U3LPMAB5T) |
| Verifier · cancel_order | [`CCU4JPTB4KRSG2N6YOTPT7SDXMYIC7RJOMEHUCR44FADEBRBWXQTTB2M`](https://stellar.expert/explorer/testnet/contract/CCU4JPTB4KRSG2N6YOTPT7SDXMYIC7RJOMEHUCR44FADEBRBWXQTTB2M) |

Each verifier is an instance of the `rs-soroban-ultrahonk` UltraHonk verifier, deployed with the corresponding circuit's verification key (`circuits/artifacts/<circuit>/vk`). The pool is constructed with all five verifier addresses.

## End-to-End Evidence

The deposit, transfer, order matching, and withdraw steps verified live on-chain:

| Step | Result | Transaction |
|------|--------|-------------|
| **Deposit** 1 XLM + note commitment | **success**, leaf index 0 | [`cdaa631c…`](https://stellar.expert/explorer/testnet/tx/cdaa631c68bedd73a7cf469285e21c4d8ece913100baf9ae6f626db542dca614) |
| **Withdraw** with a real ZK proof (1 XLM out) | **success**, verified on-chain; **asset/recipient bound** to the proof's public inputs | [`d2d2aca3…`](https://stellar.expert/explorer/testnet/tx/d2d2aca363087a082483b905d5e7ae11ede07d934ed9ccfd46ffcfe9c44ad313) |
| **Transfer** (Pay) — 2-in/2-out shielded, value conserved | **success**, both input nullifiers spent, 2 output commitments inserted | [`8b8eed61…`](https://stellar.expert/explorer/testnet/tx/8b8eed61eabd219c9d766f496ec19fc333549868fca2308cf7e63e00b8add90f)* |
| **Place Order** (Swap) — lock note commitment for trading | **success**, `OrderPlacedEvent` emitted (opaque commitment) | (settled below)* |
| **Match Orders** (Swap) — midpoint order-book match | **success**, fair match proven in-circuit and settled atomically | [`5bc05ebf…`](https://stellar.expert/explorer/testnet/tx/5bc05ebfa3f95849e6c6e3bff8375e6cfe09544e8c3318feb4096f81c7c4bdb3)* |
| **Cancel Order** (Swap) — release order and refund note | **success**, `OrderCancelledEvent` emitted, note refunded | [`51023894…`](https://stellar.expert/explorer/testnet/tx/51023894faf88329a2bd937c55ba05731860a5189aafe998e4964cf9881a4063)* |

*\* Note: Transfer, Place, Match, and Cancel Order transactions were verified live on the prior byte-identical pool build sharing the exact same verifier code and verification keys.*

### Invariant Cross-Checks
- **SDK ↔ contract Poseidon2 Merkle tree**: The off-chain Merkle tree calculated by the SDK and the on-chain tree maintained by the pool contract produce the *same* depth-20 root.
- **Noir/bb ↔ on-chain UltraHonk verifier**: Proofs generated client-side by `bb` (keccak transcript) are accepted, while tampered proofs or replayed nullifiers are rejected by the Soroban verifier contracts.

## Reproduce

To redeploy the verifiers and pool, and test the deposit-withdraw flow:

```bash
source ./env.sh
# 1. Deploy verifiers and pool contracts
./scripts/deploy.sh
# 2. Run the E2E deposit and ZK-withdraw check
./scripts/e2e.sh
```

The E2E test uses a deterministic note (`spending_key=12345`, `blinding=67890`, `amount=1 XLM`, `asset_id=0`), producing the reproducible commitment `0f09047227…` and nullifier `02e885ea…`.

## Soundness: Asset and Recipient Binding

Withdrawal transactions bind the SAC `asset` address and the `recipient` Address to the proof's public inputs (`asset_id` and `recipient_hash`) using a canonical `Address→Field` encoding. The contract rejects mismatched assets (`AssetMismatch`) or redirect attempts (`RecipientMismatch`), preventing proof-reuse or redirection attacks.

## Known Limitations

- **Single-Asset Demo**: Currently configured for native XLM; multi-asset note pools use the same path via separate SACs.
- **Client Prover Runtime**: Proving is run in-browser (web worker) via WASM for deposit/withdraw. Advanced matching and dark pool flows currently utilize the mock SDK wrapper on the UI dashboard.
