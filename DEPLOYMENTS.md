# Larel Deployments

This document tracks the deployed smart contract addresses for the Larel protocol on various networks.

## Flare Coston2 (Testnet)
**Chain ID:** 114

| Contract | Address | Description |
|---|---|---|
| **LarelPool** | `0x72a86479837B87cc2aA73daBd7B54CB4DBf0AB84` | Core L1 pool handling deposits, withdrawals, and state transitions. |
| **WithdrawVerifier** | `0xA0c9791e4FE34734D06fDD2ded0C0e0cd5b7F0f6` | ZK SNARK Verifier (Noir UltraHonk) for private withdrawals. |
| **MockPoseidon** | `0x3152B6f625F25B6a2Aa0Adb57017eB74acA65ecB` | Mock BN254 Poseidon2 hasher (to be replaced with real precompile/contract). |
| **MockUSDC** | `0x450FB6d0f985F23c1E0F03a0c5848B7dc7Fec187` | Test USD Coin (7 decimals, permissionless mint). |
| **MockETH** | `0xc5D56f02c1DaE4f13b2A6a00C2ef3C8E63f4B6F6` | Test Ethereum (7 decimals, permissionless mint). |
| **MockBTC** | `0xE67A87b2eCBbE03B90cac2cA3C494a3e1be5f615` | Test Bitcoin (7 decimals, permissionless mint). |
| **MockXRP** | `0xaCB12755134900196F8eE4Ae5223e6955B8Aa7Af` | Test XRP (7 decimals, permissionless mint). |

*Deployed on: August 14, 2026*
