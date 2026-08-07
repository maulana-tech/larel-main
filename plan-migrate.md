# plan-migrate.md — Larel: Stellar/Soroban → Flare Confidential Compute

Rencana migrasi untuk **Flare Summer Signal · Track 2: Flare Confidential Compute (FCC)**.

> **Perubahan arah.** Versi pertama dokumen ini menargetkan Bounty 1 (Interoperable Asset
> Products, FXRP/FAssets) sesuai `CONTEXT.md`. Arah sekarang **Track 2 — FCC/TEE**:
> *"Build private applications using Flare Confidential Compute (FCC). Focus is on applications
> that use Trusted Execution Environments (TEEs) to run sensitive logic offchain while
> connecting the result back to onchain workflows."*
>
> Ini pergeseran yang menguntungkan. Untuk Bounty 1, "privacy" bahkan tidak ada di daftar
> eligible directions — Larel eligible tapi tidak di pusat sasaran. Track 2 seluruhnya tentang
> privasi, dan itu persis alasan Larel ada.

**Legenda:** `[V]` terverifikasi dari docs Flare / dicek langsung di repo & toolchain lokal ·
`[A]` asumsi, wajib dikonfirmasi.

---

## 1. Apa itu FCC, secara konkret

`[V]` Semua di bawah ini dari `dev.flare.network/fcc/*`.

- **Flare Compute Extension (FCE)** = *"an isolated set of functionalities running on TEE
  machines, extending the concept of smart contracts into TEE environments."* Didefinisikan oleh
  hash Docker image (reproducible) + mesin TEE yang teregistrasi dengan bukti attestation.
- **Bahasa: Go.** Extension adalah HTTP server di dalam TEE yang melayani `POST /action` dan
  `GET /state`. Scaffold resmi: `github.com/flare-foundation/fce-extension-scaffold`.
- **Tiga service Docker:** `extension-tee` (TEE node + kode Go kita), `ext-proxy` (memantau
  Coston2, meneruskan instruksi ke TEE), `redis` (queue + state).
- **Pemicu on-chain:** kontrak `InstructionSender` memanggil
  `TeeExtensionRegistry.sendInstructions()` dengan `TeeInstructionParams{opType, opCommand,
  message, cosigners, cosignersThreshold, claimBackAddress}`, dan
  `TeeMachineRegistry.getRandomTeeIds(extensionId, n)` untuk memilih mesin.
- **Hasil kembali on-chain:** identitas mesin TEE diverifikasi on-chain saat registrasi, jadi
  *"their signatures serve as proof of data provider consensus usable within smart contracts."*
- **Handler** mengembalikan `ActionResult` dengan status `0` = error, `1` = success, `≥2` = pending.
- **Input rahasia masuk lewat ECIES.** Di guide sign-extension: *"A user sends an ECIES encrypted
  private key on-chain via the `InstructionSender` contract."* TEE mendekripsi lewat endpoint
  `/decrypt` bawaannya; public key TEE diambil dari `/info` di proxy.
- `[V]` **`SIMULATED_TEE=true`** memungkinkan pengembangan tanpa hardware confidential VM.
  Bedakan dengan **`MODE=0`** = eksekusi ter-attest sungguhan. Klaim privasi hanya berlaku di `MODE=0`.
- `[V]` **Hardware & attestation:** GCP **Confidential Space** di atas **AMD SEV**, dengan
  **vTPM attestation** sebagai bukti kriptografis lingkungan eksekusi terisolasi. Kepercayaan
  ditegakkan lewat **code-hash whitelisting** dan **reproducible build** (`SOURCE_DATE_EPOCH`).
- `[V]` `InstructionSender` adalah **satu-satunya alamat** yang boleh mengirim instruksi ke extension.
- `[V]` Struktur extension: handler `POST /action` berpola 4 langkah, sebuah TEE signing port,
  dan types server dengan endpoint `/decode`.
- `[V]` Coston2 RPC: `https://coston2-api.flare.network/ext/C/rpc`.
- `[V]` Tooling: `forge` (Solidity), `go`, `docker compose`, `ngrok`/`cloudflared`.
- `[V]` Referensi: `fce-extension-scaffold` (hello-world) dan **`fce-sign`** (contoh TEE signing).
- `[V]` **`flare-ai-skills`** memuat skill pack yang persis menutupi FCC: TEE extension,
  `TeeExtensionRegistry`/`TeeMachineRegistry`, `InstructionSender`, routing OPType/OPCommand,
  attestation, reproducible build. Pasang ini **sebelum** mulai koding, bukan sesudah.

**Peringatan resmi:** `[V]` FCC *"is in the final stages of development and is not yet a fully
public production system."* Ada halaman `fcc/troubleshooting` khusus. Perlakukan sebagai
platform pre-produksi — jadwalkan waktu untuk hal yang rusak di luar kendali kita.

---

## 2. Kenapa Larel cocok untuk Track 2 — dan kenapa ZK saja tidak cukup

Ini argumen inti submission, dan kebetulan secara teknis memang benar.

Larel yang sekarang punya satu komponen off-chain yang memegang data sensitif: **matcher**.
Untuk mencocokkan order di midpoint, matcher harus **melihat side, size, dan price dari dua
user sekaligus**. Selama ini itu titik terlemah dari klaim privasi kita.

Dan ini bukan sesuatu yang bisa diperbaiki dengan menambah ZK, karena:

> **Zero-knowledge proof membuktikan pernyataan milik satu prover tentang data miliknya sendiri.
> Order matching secara inheren multi-pihak — butuh melihat order dua orang berbeda secara
> bersamaan. Satu ZK proof secara struktural tidak bisa melakukannya.**

Jalan keluarnya cuma tiga: pihak terpercaya (merusak premis), MPC (mahal dan rumit), atau
**TEE**. FCC memberi opsi ketiga sebagai protokol yang jaringan Flare sendiri yang mengamankan.

Jadi pembagian perannya bersih, bukan tempelan:

| Lapisan | Mekanisme | Alasan |
|---|---|---|
| Deposit / withdraw / transfer | **ZK** (Noir + UltraHonk) | Pernyataan satu pihak: "saya punya note ini, ini nullifier-nya". ZK sempurna untuk ini |
| Order matching | **TEE** (FCE) | Komputasi multi-pihak atas data rahasia. ZK tidak bisa; TEE bisa |
| Settlement | On-chain | Signature TEE + nullifikasi note diverifikasi kontrak |

Kalimat pitch-nya: **dark pool yang mesin pencocoknya berjalan di dalam TEE — order dikirim
terenkripsi, dicocokkan tanpa pernah terlihat siapa pun termasuk operator, hasilnya
ditandatangani TEE dan diverifikasi on-chain.** Itu memenuhi ketiga kata di tujuan Track 2
sekaligus: *privacy*, *secure execution*, *verifiable offchain computation*.

`[V]` Dan ini bukan interpretasi longgar. Daftar eligible directions Track 2 dibuka dengan
**"Confidential orderbooks"** (nomor 1) dan **"Secure matching engines"** (nomor 3). Desain ini
tepat sasaran, bukan sekadar eligible.

---

## 2b. Empat pertanyaan desain yang wajib dijawab di submission

`CONTEXT.md` §4 menuntut empat jawaban eksplisit. Ini draf jawaban kita — pertajam seiring
implementasi, tapi jangan sampai ada yang kosong saat submit.

**1. Logika sensitif apa yang jalan di TEE, dan kenapa tidak bisa di smart contract biasa?**
Pencocokan order: side, size, dan limit price dari beberapa user, dicocokkan di midpoint.
Tidak bisa di smart contract publik karena semua kalkulasi kontrak dapat dibaca siapa pun —
itu justru membocorkan seluruh order book. Tidak bisa pula diselesaikan dengan ZK, karena
matching bersifat multi-pihak sedangkan satu ZK proof hanya membuktikan pernyataan satu prover
atas datanya sendiri. Sisanya — kepemilikan note, nullifier, validitas transisi state — tetap
di ZK karena memang pernyataan satu pihak.

**2. Attestation apa yang membuktikan TEE menjalankan kode yang benar tanpa dimanipulasi?**
`[V]` GCP Confidential Space di atas AMD SEV, dengan vTPM attestation. Registrasi mesin
memverifikasi bahwa mesin menjalankan versi kode yang didukung (code-hash whitelisting), dan
identitas TEE diverifikasi on-chain saat registrasi. Build harus reproducible
(`SOURCE_DATE_EPOCH`) agar hash image dapat diaudit ulang oleh pihak ketiga.

**3. Output minimal apa yang muncul on-chain, dan bagaimana kontrak mengonsumsinya?**
Hanya hasil match yang ditandatangani: pasangan note yang dinullifikasi, note output baru, dan
harga eksekusi — tanpa side, tanpa size asli, tanpa limit price. `LarelPool.settle()`
memverifikasi signature TEE, lalu menulis nullifier dan menambahkan commitment ke Merkle tree.

**4. Asumsi kepercayaan yang tersisa?**
Jawab jujur, jangan diperhalus: (a) vendor hardware — AMD, untuk integritas SEV; (b) cloud
provider — Google, untuk Confidential Space dan rantai vTPM; (c) penerbit kode — kami, sampai
build reproducible diverifikasi independen; (d) ketersediaan — TEE yang mati berarti order
tidak tercocokkan (dana tetap aman, karena settlement tetap butuh signature). Bandingkan
terus terang dengan shielded pool yang berbasis ZK, yang **tidak** memikul (a) dan (b).

---

## 3. Arsitektur target

```
Browser                          Coston2 (chainId 114)              TEE (FCE, Go)
───────                          ─────────────────────              ─────────────

deposit / withdraw / transfer
  └─ Noir → UltraHonk proof ──►  LarelPool.sol
                                   └─ HonkVerifier.sol  (BN254 pairing precompile)
                                        └─ nullifier + Merkle append

place order
  └─ ECIES(order, teePubKey) ──►  LarelInstructionSender.sol
                                   └─ TeeExtensionRegistry
                                        .sendInstructions()   ──────►  /action
                                                                        ├─ /decrypt order
                                                                        ├─ match @ midpoint
                                                                        └─ sign(result)
                                   LarelPool.settle()  ◄────────────────┘
                                     └─ verifikasi signature TEE
                                     └─ nullify input notes, append output notes

onboarding aset (pendukung, bukan headline)
  XRPL ──► FDC (FdcHub.requestAttestation, XRPPayment)
        ──► AssetManager.executeDirectMinting ──► FXRP (ERC-20) ──► deposit ke pool
```

Deposit, withdraw, swap, dan bridge **semuanya tetap ada** sesuai permintaan. Yang berubah
adalah mana yang jadi bintang: swap/matching lewat TEE adalah kontribusi Track 2, sisanya
adalah fondasi yang membuatnya bermakna.

---

## 4. Inventaris repo

### 4.1 Dibawa tanpa perubahan

| Komponen | Catatan |
|---|---|
| `circuits/noir/*` (5 circuit + `larel_lib`) | Chain-agnostic |
| `sdk/` inti: `poseidon.ts`, `merkle.ts`, `note.ts`, `note-crypto.ts`, `order.ts`, `prover.ts`, `constants.ts` | Kripto murni |
| `bridge/l1/` | `[V]` Proyek Foundry + submodule `forge-std`. FCC juga pakai `forge` — langsung nyambung |
| `deploy/` (Caddyfile, VPS notes) | `[V]` FCE butuh host publik + HTTPS; ini sudah ada |

### 4.2 Ditulis ulang

| Dari | Ke | Catatan |
|---|---|---|
| `contracts/larel-pool` (Soroban, sudah dihapus) | `LarelPool.sol` | Referensi via `git show 65a14b4:contracts/larel-pool/src/merkle.rs` |
| Verifier Soroban | `HonkVerifier.sol` × 5 | `bb write_solidity_verifier --scheme ultra_honk` |
| `matcher/src/engine.ts` (236 baris: `pairKey`, `settleOrder`, `computeMatch`, `MatchingEngine`, priority sort) | Handler Go di dalam FCE | Inti Track 2. Porsi paling penting |
| `matcher/src/{index,submitter,prover}.ts` | Sebagian besar hilang | Digantikan `ext-proxy` + instruction flow |
| `sdk/src/stellar.ts`, `wallet.ts` | viem / wagmi | `PUBLIC_INPUT_ORDER` harus dipertahankan persis |
| 10 file frontend yang import `@stellar/stellar-sdk` | viem | Termasuk `lib/indexer*.ts`: Horizon → `eth_getLogs` |

### 4.3 Sudah dihapus (recoverable di `65a14b4`)

`contracts/` (5.879 baris Rust), `bridge/relayer/`, `bridge/deploy/`, `scripts/`,
`deployments.json`, `plan.md`, `SWAP.md`, `DEPLOYMENT.md`.

`[V]` Bridge BLS/MPT buatan sendiri dihapus karena FDC melakukannya secara enshrined
(`FdcHub.requestAttestation` → `FdcVerification`, 7 attestation type termasuk `Payment`).

---

## 5. Blocker jalur kritis — kerjakan hari pertama

Dua hal ini punya lead time di luar kendali kita. Kalau ditunda, seluruh jadwal ikut mundur.

1. **Kredensial database indexer.** `[V]` Wajib untuk mengisi
   `config/proxy/extension_proxy.coston2.docker.toml`, dan **hanya bisa didapat dengan
   menghubungi Flare support** (`flare.network/resources/technical-support` atau `@FlareDevs`).
   Tanpa ini `ext-proxy` tidak jalan sama sekali. **Ajukan sekarang, sebelum menulis kode apa pun.**
2. **Host publik + tunnel HTTPS ke port 6674.** `[V]` `ngrok http 6674` atau
   `cloudflared tunnel`. Untuk demo yang stabil, pakai VPS — `deploy/Caddyfile` sudah ada.

Sambil menunggu keduanya: kerjakan Fase 0 dan Fase 1, yang tidak bergantung pada FCC.

---

## 6. Fase

### Fase 0 — Spike kelayakan (gerbang go/no-go)

Dua spike paralel. Jangan menulis `LarelPool.sol` sebelum spike A selesai.

**Spike A — gas HonkVerifier di Coston2.**
```bash
source ./env.sh
cd circuits/noir/withdraw
nargo compile
bb write_vk --scheme ultra_honk -b target/withdraw.json -o target/vk
bb write_solidity_verifier --scheme ultra_honk -k target/vk/vk -o target/HonkVerifier.sol
```
Deploy ke Coston2, panggil `verify()` dengan proof asli, catat gas.
- `[A]` Block gas limit Coston2 **tidak disebut** di docs network overview — cek via `eth_getBlockByNumber`.
- `[A]` Ukuran bytecode vs limit EIP-170 (24 KB).
- `[V]` Proof 14.592 byte ≈ 233k gas hanya sebagai calldata. Bandingkan juga varian `--zk`.

**Spike B — scaffold FCE jalan.**
Pasang dulu skill pack-nya — `[V]` `flare-foundation/flare-ai-skills` menutupi persis area ini
(TEE extension, registry, `InstructionSender`, routing OPType/OPCommand, attestation,
reproducible build). Baca juga `fcc/troubleshooting` **sebelum** mulai, bukan setelah macet.
```bash
git clone https://github.com/flare-foundation/fce-extension-scaffold.git
cp .env.example .env      # SIMULATED_TEE=true, LOCAL_MODE=false
./scripts/full-setup.sh --chain coston2 --test
```
Buktikan alur hello-world sampai tuntas sebelum menaruh logika matching di dalamnya. Lalu baca
`fce-sign` — pola "TEE memegang kunci dan menandatangani hasil" di sana adalah persis yang
dibutuhkan settlement kita.

**Plan B kalau Spike A gagal — dan Track 2 justru menyediakannya.**
Kalau verifikasi UltraHonk on-chain terlalu mahal, **pindahkan lebih banyak ke TEE**: TEE
memverifikasi proof (atau langsung mengesahkan transisi state) dan menandatangani hasilnya,
kontrak cukup memeriksa satu signature secp256k1 alih-alih pairing BN254. Arah Track 2 mengubah
risiko #1 dari fatal menjadi sekadar keputusan arsitektur. Ini keunggulan nyata dibanding
rencana Bounty 1 sebelumnya, yang tidak punya jalan keluar sama sekali di titik ini.

### Fase 1 — Fondasi Solidity

- Jadikan `bridge/l1/` (Foundry) workspace kontrak EVM, atau pindahkan ke `contracts-evm/`.
- Generate 5 `HonkVerifier.sol`, otomatiskan di `build_all.sh`.
- Tulis `LarelPool.sol`: port `merkle.rs` + `types.rs` + nullifier set dari git history.
- **Titik paling rawan:** urutan public input. `sdk/src/stellar.ts:PUBLIC_INPUT_ORDER` mencerminkan
  signature `main()` tiap circuit. Bikin test vector lama-vs-baru **sebelum** deploy apa pun.

### Fase 2 — FCE matcher (inti Track 2)

- Port `engine.ts` → handler Go: `computeMatch`, `settleOrder`, prioritas buy/sell, validasi.
- Definisikan `OPType`/`OPCommand`. `[V]` String harus identik persis antara
  `internal/config/config.go`, `pkg/types/types.go`, `internal/extension/extension.go`,
  `pkg/types/register.go`, dan `contracts/InstructionSender.sol`; Go pakai
  `teeutils.ToHash(...)` agar cocok dengan `bytes32("...")` Solidity.
- Alur order: SDK ECIES-encrypt `{side, size, price, note refs}` ke public key TEE (dari `/info`)
  → `LarelInstructionSender.placeOrder()` → TEE `/decrypt` → match → sign → settle.
- `[A]` Pertimbangkan `cosigners`/`cosignersThreshold` di `TeeInstructionParams` supaya butuh
  kesepakatan beberapa mesin TEE, bukan satu. Nilai jual trust yang murah.
- Status `≥2` = pending: order yang belum ketemu lawan menunggu di state TEE, bukan gagal.
- **Harga referensi midpoint lewat FTSOv2.** Matcher butuh harga acuan untuk menentukan
  midpoint; sekarang itu diambil `usePriceQuote`/`lib/prices.ts` dari sumber luar. `[V]`
  CONTEXT.md §5 menyebut FTSO memang diperuntukkan bagi kasus ini — *"if the private
  computation involves market data (e.g. confidential orderbooks)"*. Memakai FTSO membuat harga
  acuan berasal dari protokol enshrined Flare, bukan API pihak ketiga yang bisa dimanipulasi
  operator. Ini menaikkan kualitas integrasi **dan** memperkuat model kepercayaan sekaligus —
  naikkan dari "opsional" menjadi bagian dari cerita utama.

### Fase 3 — SDK & frontend

- `sdk/src/stellar.ts` → `flare.ts` (viem), pertahankan signature fungsi.
- Tambah helper ECIES ke public key TEE di SDK.
- Frontend: 10 file, chain config Coston2 (114). `lib/indexer*.ts` Horizon → `eth_getLogs`
  (kemungkinan file tersulit — merekonstruksi Merkle tree lokal dari event).
- `[V]` `viem` + `wagmi` + `useEvmWallet.ts` + `lib/wagmi.ts` sudah ada, tidak dari nol.

### Fase 4 — Onboarding aset (pendukung)

FXRP lewat FDC + `AssetManager.executeDirectMinting`. Jalur cepat demo: `[V]` ambil test FXRP
langsung dari faucet Coston2 tanpa minting. Ini bukan headline di Track 2, tapi membuat
"deposit/bridge" punya isi nyata.

### Fase 5 — Submission

Item wajib yang **belum** punya alokasi kerja dan harus dijadwalkan eksplisit: **product
description**, **target user**, **demo video / working app link**, **roadmap / next steps**.
Ditambah: jaga riwayat git memisahkan "ported from Soroban" vs "newly built for Flare".

Sebelum submit, pastikan §2b sudah terjawab tuntas — empat pertanyaan itu memetakan langsung ke
kriteria juri *"Can the team clearly explain the private computation, trust model, onchain
consumption, and next steps?"*. Jawaban yang mengabur di pertanyaan #4 (asumsi kepercayaan)
adalah cara tercepat terbaca sebagai tidak paham TEE.

---

## 7. Risiko

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| 1 | Kredensial indexer lama didapat | **Blocking total** untuk Fase 2 | Ajukan hari pertama; kerjakan Fase 0–1 sambil menunggu |
| 2 | FCC pre-produksi, berubah/rusak | Tinggi | Pin versi scaffold; sediakan waktu buffer; `fcc/troubleshooting` |
| 3 | Gas UltraHonk > block limit | Sedang (dulu fatal) | Spike A; plan B pindah verifikasi ke TEE |
| 4 | Port `engine.ts` TS → Go menyimpan bug halus | Tinggi — salah match = salah uang | Port test dari `matcher/` juga, bandingkan output TS vs Go pada input sama |
| 5 | Urutan public input berubah diam-diam | Tinggi | Test vector sebelum deploy |
| 6 | `SIMULATED_TEE=true` tidak setara TEE asli untuk klaim privasi | Sedang | Kejar hardware CVM asli untuk demo final; kalau tidak dapat, **nyatakan terus terang di submission** |
| 7 | Bytecode HonkVerifier > 24 KB | Sedang | Ukur di Fase 0 |

---

## 8. Scope minimum yang tetap menang

Potong dari belakang:

1. **Wajib** — FCE hello-world jalan di Coston2, lalu handler matching sungguhan di dalamnya.
   Tanpa ini tidak ada submission Track 2.
2. **Wajib** — `LarelPool.sol` + verifier withdraw, deposit/withdraw shielded jalan.
3. **Wajib** — demo video + deskripsi produk + target user + roadmap.
4. **Pembeda** — order terenkripsi ECIES → match di TEE → settle on-chain, end-to-end.
5. **Pembeda** — harga acuan midpoint dari FTSOv2, dan `MODE=0` (attestation sungguhan, bukan
   simulasi). Dua-duanya langsung menaikkan nilai di kriteria "Flare integration quality".
6. **Pembeda** — multi-TEE cosigner threshold.
7. **Boleh dikorbankan** — FXRP/FDC onboarding (turunkan ke faucet saja).
8. **Boleh dikorbankan** — `transfer` circuit, SparkDEX.

---

## 9. Yang belum diketahui

Checklist submission dan kriteria juri Track 2 **sudah ada** di `CONTEXT.md` §2–§3, begitu pula
hardware TEE (GCP Confidential Space / AMD SEV / vTPM) di §4. Sisa yang masih terbuka:

- `github.com/flare-foundation/fce-extension-scaffold` — sumber kebenaran; docs hanya ringkasan
- `github.com/flare-foundation/flare-ai-skills` — pasang di Fase 0, bukan dibaca belakangan
- `fce-sign` — pola TEE signing yang paling dekat dengan kebutuhan settlement kita
- `dev.flare.network/fcc/troubleshooting` — baca sebelum Spike B
- `[A]` **Persistensi kunci & state saat TEE restart** — docs tidak membahas. Kritis, karena
  order book yang menunggu (status `≥2` = pending) hidup di dalam state TEE. Kalau restart
  menghapusnya, desain harus menaruh order pending di tempat lain (terenkripsi, on-chain atau
  di Redis) dan TEE hanya memegang kunci.
- `[A]` Batas memori, waktu eksekusi, dan biaya per instruksi — tidak terdokumentasi
- `[A]` Cara mendapatkan mesin Confidential Space sungguhan untuk `MODE=0` (kuota GCP, biaya,
  apakah panitia menyediakan) — menentukan apakah demo final bisa lebih dari simulasi
- Docs Flare agent-ready: tambahkan `.md` di akhir URL halaman mana pun
