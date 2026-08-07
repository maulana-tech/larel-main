# CONTEXT.md — Flare Summer Signal · Bounty 2: Confidential Compute Apps

## 1. Track Overview

Build private applications using **Flare Confidential Compute (FCC)**. Focus is on applications that use **Trusted Execution Environments (TEEs)** to run sensitive logic offchain while connecting the result back to onchain workflows.

Goal: explore products where privacy, secure execution, or verifiable offchain computation creates a better user or developer experience.

**Eligible product directions:**
- Confidential orderbooks
- Private auctions / sealed-bid markets
- Secure matching engines
- Private strategy execution
- TEE-secured agents
- Confidential AI workflows
- Private scoring or ranking systems
- Applications where sensitive inputs must stay private, but output still needs to be usable by smart contracts / onchain systems

**What judges want to see:** an explanation of what runs privately inside the TEE, what is verified or consumed onchain, what trust assumptions exist, and why the product benefits from confidential compute rather than normal smart contract execution.

---

## 2. Submission Requirements (this track)

- [ ] Project name
- [ ] Bounty selected: Bounty 2 — Confidential Compute Apps
- [ ] Short product description
- [ ] Target user
- [ ] Demo link / video / working app link
- [ ] GitHub repo or technical materials
- [ ] Explanation of how the project uses Flare (specifically FCC/TEE integration)
- [ ] Explanation of what was newly built / ported / integrated / improved during the program
- [ ] Smart contract addresses or deployment details (if applicable)
- [ ] Short roadmap / next steps

Encouraged extras: deployment network (Coston2 / Songbird / Flare Mainnet), user acquisition/testing/feedback progress, early traction signals (pilot users, community interest, partner conversations).

If bringing an existing project (e.g. porting existing TEE work to Flare), clearly separate: what existed before, what's newly built during the hackathon, what's ported/integrated/improved on Flare specifically, and why the new work matters for users/devs/ecosystem.

---

## 3. Judging Criteria (this track)

| Criterion | Question |
|---|---|
| Product usefulness | Does it solve a real user/developer/ecosystem/infra problem? |
| Flare integration quality | Is FCC/TEE used meaningfully — genuinely needed for privacy/verifiability — or superficial? |
| Technical execution | Does the demo work? Is the TEE architecture credible and understandable? |
| Evidence of new work | Is it clear what was newly built/ported/integrated/improved? |
| Clarity & future potential | Can the team clearly explain the private computation, trust model, onchain consumption, and next steps? |

---

## 4. Core Concepts to Understand

- **Flare Confidential Compute (FCC)** — <cite index="5-1">confidential extensions running inside a Trusted Execution Environment (GCP Confidential Space / AMD SEV), wired to Flare contracts, currently one of Flare's core protocol pillars alongside FTSO and FDC.</cite> Positioned by Flare as <cite index="7-1">upcoming verifiable compute with TEEs, unlocking cross-chain execution.</cite>
- **On-chain building blocks:**
  - <cite index="5-1">TeeExtensionRegistry and TeeMachineRegistry — on-chain registries for TEE extensions and machines.</cite>
  - <cite index="5-1">The InstructionSender contract pattern — the only address allowed to submit instructions to the TEE extension.</cite>
  - <cite index="5-1">A routing model using OPType/OPCommand bytes32 pairs, matched consistently across Solidity contracts, Go configuration, and the Go router.</cite>
- **Extension code structure:** <cite index="5-1">a POST /action handler following a 4-step pattern, a TEE signing port, and a types server exposing a /decode endpoint.</cite>
- **Attestation & trust model:** <cite index="5-1">code-hash whitelisting, a distinction between MODE=0 (real attested execution) and simulated mode, reproducible builds via SOURCE_DATE_EPOCH, and a defined deploy lifecycle across Coston/Coston2 testnets.</cite>
- **Underlying TEE technology (general background):** <cite index="1-1">Google Cloud Confidential Space is a secure enclave built on Trusted Execution Environments that provides hardware-enforced confidentiality while generating cryptographic attestations, which can then be verified on-chain to prove computations executed correctly without external interference.</cite> <cite index="1-1">Prior Flare TEE hackathon projects ran on Confidential Space instances using AMD SEV with vTPM attestation as cryptographic proof of an isolated, tamper-proof execution environment.</cite>
- **Why FDC/FTSO matter here too:** <cite index="1-1">Flare's enshrined data protocols (FTSO and FDC) are positioned as uniquely suited to ensure data provenance and integrity verification for AI/TEE outputs consumed on-chain</cite> — relevant if your app needs to prove the freshness/correctness of data fed into the TEE, or attest the TEE's output back on-chain.
- **Design questions to answer for the submission:**
  1. What sensitive input/logic runs inside the TEE (and why can't it run in a public smart contract)?
  2. What attestation proves the TEE executed the expected code untampered?
  3. What minimal output is surfaced on-chain, and how do smart contracts consume/verify it?
  4. What are the residual trust assumptions (hardware vendor, cloud provider, code publisher)?

---

## 5. Resources & Docs

### Getting started
- Flare Developer Hub (main docs): https://dev.flare.network/
- Network overview (Mainnet, Coston2 testnet, Songbird, Coston): https://dev.flare.network/network/overview
- Any doc page available as agent-ready Markdown by appending `.md` to the URL
- Full machine-readable docs index: `llms.txt` at dev.flare.network
- Flare AI Skills repo (agent skill packs covering FCC — TEE extensions, TeeExtensionRegistry/TeeMachineRegistry, InstructionSender, OPType/OPCommand routing, attestation, reproducible builds): https://github.com/flare-foundation/flare-ai-skills

### FCC / TEE — reference repos
- **fce-extension-scaffold** — "Hello World" starter scaffold for building a Flare Confidential Compute extension
- **fce-sign** — reference example demonstrating TEE-based signing
- Flare Foundation GitHub org (all official repos, starters, periphery packages): https://github.com/flare-foundation

### Background reading on TEE + verifiable compute on Flare
- Flare x Google Cloud Confidential Space hackathon writeup (context on how TEE attestations get verified on Flare, and prior project patterns like DeFAI, verifiable AI): https://flare.network/news/flare-hackathon-winners
- Flare AI Kit — framework bridging Confidential Space TEE + AI + Flare blockchain for verifiable AI applications (relevant if building confidential AI/agent workflows)

### Data protocols to pair with FCC
- Flare Data Connector (FDC) — for attesting external data/events feeding into or validating TEE computation
- Flare Time Series Oracle (FTSO) — for price/data feeds if the private computation involves market data (e.g. confidential orderbooks, private strategy execution)

### General TEE / confidential computing background (non-Flare-specific, useful for architecture design)
- AMD SEV-SNP and Intel TDX — the two dominant hardware-based confidential VM technologies; useful vocabulary when explaining trust assumptions in a submission
- Concepts worth referencing in submissions: hardware root of trust, remote attestation, encrypted memory isolation from host/hypervisor

### Testnet resources
- Coston2 — recommended testnet for dApp development and FCC extension deployment/testing per the attestation lifecycle described in Flare AI Skills docs

### Community / support
- Flare Hackathon Telegram: https://t.me/+5Vn6ZKhr6KI3NjIx

---


*This file is a working reference for internal planning — not an official hackathon document.*