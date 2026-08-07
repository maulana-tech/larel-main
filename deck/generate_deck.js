const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { 
  FiShield, FiLayers, FiActivity, FiKey, FiLock, FiAlertTriangle, 
  FiCheckCircle, FiSend, FiRefreshCw, FiExternalLink, FiCompass, FiGitBranch 
} = require("react-icons/fi");

// Color Palette - Warm Sepia & Dark Charcoal (matches Larel site)
const COLOR_BG_DARK = "17120B";      // Very dark charcoal/sepia
const COLOR_CARD_DARK = "211B12";    // Dark card background
const COLOR_TEXT_DARK_PRIMARY = "EFE9DC"; // Soft cream
const COLOR_TEXT_DARK_MUTED = "B3A081";   // Muted gold/bronze

const COLOR_BG_LIGHT = "EFE9DC";     // Light cream
const COLOR_CARD_LIGHT = "FFFFFF";   // White card
const COLOR_TEXT_LIGHT_PRIMARY = "211B12"; // Dark charcoal
const COLOR_TEXT_LIGHT_MUTED = "8E7A5C";   // Muted gold/bronze dark

const COLOR_ACCENT = "D97706";       // Warm amber/gold accent

// Fonts
const FONT_TITLE = "Georgia";
const FONT_BODY = "Calibri";

// Helper to generate base64 png from react-icons
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Shadow generators
const makeShadowDark = () => ({
  type: "outer",
  blur: 8,
  offset: 3,
  color: "000000",
  opacity: 0.35,
  angle: 135
});

const makeShadowLight = () => ({
  type: "outer",
  blur: 6,
  offset: 2,
  color: "1A1510",
  opacity: 0.12,
  angle: 135
});

async function main() {
  let pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Catur Setyono (Tyobot)";
  pres.title = "Larel Presentation";

  // Pre-generate icons to base64
  const icons = {
    shield: await iconToBase64Png(FiShield, "#" + COLOR_ACCENT),
    layers: await iconToBase64Png(FiLayers, "#" + COLOR_TEXT_DARK_MUTED),
    activity: await iconToBase64Png(FiActivity, "#" + COLOR_ACCENT),
    key: await iconToBase64Png(FiKey, "#" + COLOR_ACCENT),
    lock: await iconToBase64Png(FiLock, "#" + COLOR_ACCENT),
    warning: await iconToBase64Png(FiAlertTriangle, "#B85042"),
    check: await iconToBase64Png(FiCheckCircle, "#" + COLOR_ACCENT),
    send: await iconToBase64Png(FiSend, "#" + COLOR_ACCENT),
    refresh: await iconToBase64Png(FiRefreshCw, "#" + COLOR_ACCENT),
    link: await iconToBase64Png(FiExternalLink, "#" + COLOR_ACCENT),
    compass: await iconToBase64Png(FiCompass, "#" + COLOR_ACCENT),
    branch: await iconToBase64Png(FiGitBranch, "#" + COLOR_ACCENT),
    
    // Light versions of icons
    shieldLight: await iconToBase64Png(FiShield, "#" + COLOR_TEXT_LIGHT_MUTED),
    activityLight: await iconToBase64Png(FiActivity, "#" + COLOR_TEXT_LIGHT_MUTED),
    lockLight: await iconToBase64Png(FiLock, "#" + COLOR_TEXT_LIGHT_MUTED),
    checkLight: await iconToBase64Png(FiCheckCircle, "#" + COLOR_TEXT_LIGHT_MUTED)
  };

  // =========================================================================
  // SLIDE 1: Title Slide (Dark)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_DARK };

    // Decorative dark-gold border on left
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.15, h: 5.625,
      fill: { color: COLOR_ACCENT }
    });

    // Subtitle
    slide.addText("STELLAR HACKS APAC  ·  DEFI & PAYMENTS  ·  STELLAR TESTNET", {
      x: 1.0, y: 1.5, w: 8.0, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, bold: true,
      color: COLOR_TEXT_DARK_MUTED, charSpacing: 4, margin: 0
    });

    // Title
    slide.addText("Larel", {
      x: 1.0, y: 1.9, w: 8.0, h: 1.0,
      fontFace: FONT_TITLE, fontSize: 54, bold: true,
      color: COLOR_TEXT_DARK_PRIMARY, margin: 0
    });

    // Tagline
    slide.addText("Your balances, transactions, and orders stay completely private.", {
      x: 1.0, y: 3.0, w: 8.0, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, italic: true,
      color: COLOR_TEXT_DARK_MUTED, margin: 0
    });

    // Divider
    slide.addShape(pres.shapes.LINE, {
      x: 1.0, y: 3.8, w: 3.5, h: 0,
      line: { color: COLOR_ACCENT, width: 2 }
    });

    // Author/Team info
    slide.addText("Presented by Tyobot & Catur Setyono", {
      x: 1.0, y: 4.1, w: 6.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12,
      color: COLOR_TEXT_DARK_PRIMARY, margin: 0
    });
  }

  // =========================================================================
  // SLIDE 2: Meet Sarah (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("PERSONAL ANECDOTE", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("Meet Sarah: Running a Remote Studio", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Left Column: Story
    slide.addText([
      { text: "Sarah pays her global developers in USDC on Stellar.\n\n", options: { bold: true, fontSize: 18 } },
      { text: "It's fast and extremely cheap, but because the ledger is fully transparent:\n\n", options: { fontSize: 14 } },
      { text: "• Competitors see her exact developer rates and runway.\n", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "• Clients negotiate down knowing her exact financial balance.\n", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "• Employees compare salaries, creating friction.", options: { fontSize: 14, bullet: true } }
    ], {
      x: 0.8, y: 1.8, w: 4.8, h: 3.0,
      fontFace: FONT_BODY, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Right Column: The Quote Card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.0, y: 1.8, w: 3.2, h: 3.0,
      fill: { color: COLOR_CARD_LIGHT },
      shadow: makeShadowLight(),
      line: { color: COLOR_TEXT_LIGHT_MUTED, width: 1 }
    });

    // Amber Accent line inside Card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.0, y: 1.8, w: 3.2, h: 0.08,
      fill: { color: COLOR_ACCENT }
    });

    slide.addImage({
      data: icons.warning,
      x: 6.3, y: 2.2, w: 0.5, h: 0.5
    });

    slide.addText("THE SHOCKING REALITY", {
      x: 7.0, y: 2.3, w: 2.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 10, bold: true, color: COLOR_TEXT_LIGHT_MUTED, margin: 0
    });

    slide.addText([
      { text: "She didn't lose her money.\n", options: { bold: true, fontSize: 16 } },
      { text: "She lost her business leverage.", options: { bold: true, fontSize: 16, color: COLOR_ACCENT } }
    ], {
      x: 6.3, y: 3.0, w: 2.6, h: 1.2,
      fontFace: FONT_BODY, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
  }

  // =========================================================================
  // SLIDE 3: Problem Statement (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("THE PROBLEM", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("Absolute Transparency is a Liability", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // 3 Cards mapping existing options & their failures
    const cardData = [
      {
        title: "Fresh Wallets",
        desc: "Sarah could generate fresh addresses for every invoice. But funding trails link them on the public graph, deanonymizing her completely.",
        icon: icons.activityLight
      },
      {
        title: "Mixers / Custodians",
        desc: "Tornado-style mixers or centralized escrows compromise self-custody and introduce severe regulatory or asset seizure risks.",
        icon: icons.lockLight
      },
      {
        title: "Off-Chain / Sidechains",
        desc: "Moving to other networks or L2 sidechains means leaving behind Stellar's native assets, lightning-fast speed, and deep liquidity.",
        icon: icons.shieldLight
      }
    ];

    for (let i = 0; i < 3; i++) {
      const data = cardData[i];
      const xPos = 0.8 + i * 2.9;

      // Card Background
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xPos, y: 1.8, w: 2.6, h: 3.0,
        fill: { color: COLOR_CARD_LIGHT },
        shadow: makeShadowLight()
      });

      // Accent border
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xPos, y: 1.8, w: 2.6, h: 0.06,
        fill: { color: i === 1 ? COLOR_ACCENT : COLOR_TEXT_LIGHT_MUTED }
      });

      // Icon
      slide.addImage({
        data: data.icon,
        x: xPos + 0.2, y: 2.0, w: 0.4, h: 0.4
      });

      // Title
      slide.addText(data.title, {
        x: xPos + 0.2, y: 2.6, w: 2.2, h: 0.4,
        fontFace: FONT_TITLE, fontSize: 18, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });

      // Description
      slide.addText(data.desc, {
        x: xPos + 0.2, y: 3.1, w: 2.2, h: 1.5,
        fontFace: FONT_BODY, fontSize: 13, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });
    }
  }

  // =========================================================================
  // SLIDE 4: Validation / Statistics (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("MARKET DATA", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("The Massive Demand for Shielded On-Chain Value", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Stat 1
    slide.addText("75%", {
      x: 0.8, y: 1.8, w: 2.6, h: 1.0,
      fontFace: FONT_TITLE, fontSize: 72, bold: true, color: COLOR_ACCENT, margin: 0
    });
    slide.addText("Enterprise Blocker", {
      x: 0.8, y: 2.8, w: 2.6, h: 0.3,
      fontFace: FONT_BODY, fontSize: 14, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
    slide.addText("of institutional CFOs cite the public nature of raw addresses as the primary reason blocking stablecoin adoption for payroll.", {
      x: 0.8, y: 3.2, w: 2.6, h: 1.5,
      fontFace: FONT_BODY, fontSize: 13, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Stat 2
    slide.addText("$20B+", {
      x: 3.7, y: 1.8, w: 2.6, h: 1.0,
      fontFace: FONT_TITLE, fontSize: 72, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
    slide.addText("Stellar Volume", {
      x: 3.7, y: 2.8, w: 2.6, h: 0.3,
      fontFace: FONT_BODY, fontSize: 14, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
    slide.addText("is settled monthly across public Stellar assets, indicating a massive base of transactions waiting to unlock confidentiality.", {
      x: 3.7, y: 3.2, w: 2.6, h: 1.5,
      fontFace: FONT_BODY, fontSize: 13, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Stat 3
    slide.addText("100%", {
      x: 6.6, y: 1.8, w: 2.6, h: 1.0,
      fontFace: FONT_TITLE, fontSize: 72, bold: true, color: COLOR_TEXT_LIGHT_MUTED, margin: 0
    });
    slide.addText("Self-Custodial Guarantee", {
      x: 6.6, y: 2.8, w: 2.6, h: 0.3,
      fontFace: FONT_BODY, fontSize: 14, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
    slide.addText("Larel uses zero-knowledge verification so users never delegate keys or trust relayers. Confidentiality without surrender.", {
      x: 6.6, y: 3.2, w: 2.6, h: 1.5,
      fontFace: FONT_BODY, fontSize: 13, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
  }

  // =========================================================================
  // SLIDE 5: The Question (Dark)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_DARK };

    // Amber accent top border
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.1,
      fill: { color: COLOR_ACCENT }
    });

    slide.addText("THE CORE CHALLENGE", {
      x: 1.0, y: 1.6, w: 8.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_TEXT_DARK_MUTED, charSpacing: 4, align: "center"
    });

    slide.addText("How can we enable privacy-preserving transactions and trades directly on Stellar — without sacrificing self-custody?", {
      x: 1.0, y: 2.1, w: 8.0, h: 2.0,
      fontFace: FONT_TITLE, fontSize: 32, bold: true, color: COLOR_TEXT_DARK_PRIMARY, align: "center"
    });

    slide.addText("The answer: browser-generated zero-knowledge proofs settled natively on Soroban.", {
      x: 1.0, y: 4.1, w: 8.0, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, italic: true, color: COLOR_TEXT_DARK_MUTED, align: "center"
    });
  }

  // =========================================================================
  // SLIDE 6: The Solution Overview (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("THE SOLUTION", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("One Pool. Four Flows. One Bridge.", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // 4 Columns for the Flows
    const flowData = [
      { num: "01", title: "Bridge In", desc: "Locks assets on Sepolia L1 and mints a private note on Stellar via light-client verified storage proofs." },
      { num: "02", title: "Shield", desc: "Deposits public Stellar assets (XLM/USDC) into the Merkle tree, hiding them behind Poseidon2 commitments." },
      { num: "03", title: "Private Pay", desc: "Sends assets to a recipient key with completely hidden amounts and sender-receiver links." },
      { num: "04", title: "Swap & Exit", desc: "Trades on a ZK Dark Pool or withdraws back to any public Stellar address using client-side proofs." }
    ];

    for (let i = 0; i < 4; i++) {
      const flow = flowData[i];
      const xPos = 0.8 + i * 2.15;

      slide.addShape(pres.shapes.RECTANGLE, {
        x: xPos, y: 1.8, w: 1.95, h: 3.0,
        fill: { color: COLOR_CARD_LIGHT },
        shadow: makeShadowLight()
      });

      slide.addShape(pres.shapes.RECTANGLE, {
        x: xPos, y: 1.8, w: 1.95, h: 0.05,
        fill: { color: i === 2 ? COLOR_ACCENT : COLOR_TEXT_LIGHT_MUTED }
      });

      slide.addText(flow.num, {
        x: xPos + 0.15, y: 2.0, w: 1.6, h: 0.4,
        fontFace: FONT_TITLE, fontSize: 24, bold: true, color: COLOR_ACCENT, margin: 0
      });

      slide.addText(flow.title, {
        x: xPos + 0.15, y: 2.5, w: 1.6, h: 0.4,
        fontFace: FONT_TITLE, fontSize: 16, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });

      slide.addText(flow.desc, {
        x: xPos + 0.15, y: 3.0, w: 1.6, h: 1.6,
        fontFace: FONT_BODY, fontSize: 12, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });
    }
  }

  // =========================================================================
  // SLIDE 7: Live Demo Flow (Dark)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_DARK };

    // Slide Header
    slide.addText("LIVE DEMO", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_DARK_MUTED, charSpacing: 2
    });
    slide.addText("Simulating the Shielded Loop", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_DARK_PRIMARY, margin: 0
    });

    // Demo steps list with icons
    const steps = [
      { icon: icons.key, title: "1. Connect Wallet", desc: "freighter & metamask" },
      { icon: icons.lock, title: "2. Deposit / Bridge", desc: "mint shielded note" },
      { icon: icons.send, title: "3. Pay Privately", desc: "2-in/2-out transfer" },
      { icon: icons.refresh, title: "4. Swap (Dark Pool)", desc: "midpoint orders" },
      { icon: icons.shield, title: "5. Withdraw", desc: "re-enter public space" }
    ];

    for (let i = 0; i < 5; i++) {
      const step = steps[i];
      const xPos = 0.8 + i * 1.75;

      // Card
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xPos, y: 1.8, w: 1.55, h: 2.8,
        fill: { color: COLOR_CARD_DARK },
        shadow: makeShadowDark()
      });

      // Icon in amber circle
      slide.addShape(pres.shapes.OVAL, {
        x: xPos + 0.45, y: 2.1, w: 0.65, h: 0.65,
        fill: { color: COLOR_BG_DARK },
        line: { color: COLOR_ACCENT, width: 1 }
      });
      slide.addImage({
        data: step.icon,
        x: xPos + 0.575, y: 2.225, w: 0.4, h: 0.4
      });

      // Title
      slide.addText(step.title, {
        x: xPos + 0.1, y: 3.0, w: 1.35, h: 0.6,
        fontFace: FONT_TITLE, fontSize: 13, bold: true, color: COLOR_TEXT_DARK_PRIMARY, align: "center", margin: 0
      });

      // Subtitle
      slide.addText(step.desc, {
        x: xPos + 0.1, y: 3.7, w: 1.35, h: 0.6,
        fontFace: FONT_BODY, fontSize: 11, color: COLOR_TEXT_DARK_MUTED, align: "center", margin: 0
      });
    }

    slide.addText("→  ALL SECRET INPUTS GENERATED CLIENT-SIDE  ←", {
      x: 1.0, y: 4.9, w: 8.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_ACCENT, align: "center", charSpacing: 2
    });
  }

  // =========================================================================
  // SLIDE 8: Under the Hood (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("UNDER THE HOOD", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("Browser Proving & On-Chain Verification", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Left card: Client-side (Prover)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.8, w: 3.9, h: 3.2,
      fill: { color: COLOR_CARD_LIGHT },
      shadow: makeShadowLight()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.8, w: 3.9, h: 0.08,
      fill: { color: COLOR_ACCENT }
    });
    slide.addText("CLIENT-SIDE PROVER (Browser)", {
      x: 1.1, y: 2.1, w: 3.3, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_TEXT_LIGHT_MUTED
    });
    slide.addText([
      { text: "1. Key Derivation: ", options: { bold: true, fontSize: 13 } },
      { text: "Deterministically signs with Freighter to yield the spending key.\n", options: { fontSize: 13, breakLine: true } },
      { text: "2. Build Inputs: ", options: { bold: true, fontSize: 13 } },
      { text: "Computes note secret commitments, nullifier, and local Merkle path.\n", options: { fontSize: 13, breakLine: true } },
      { text: "3. Noir Proving: ", options: { bold: true, fontSize: 13 } },
      { text: "Compiles to WASM/JS. Secrets never leave the device.", options: { fontSize: 13 } }
    ], {
      x: 1.1, y: 2.6, w: 3.3, h: 2.1,
      fontFace: FONT_BODY, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Right card: On-chain (Verifier)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.8, w: 3.9, h: 3.2,
      fill: { color: COLOR_CARD_LIGHT },
      shadow: makeShadowLight()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 1.8, w: 3.9, h: 0.08,
      fill: { color: COLOR_TEXT_LIGHT_MUTED }
    });
    slide.addText("ON-CHAIN VERIFIER (Soroban)", {
      x: 5.6, y: 2.1, w: 3.3, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_TEXT_LIGHT_MUTED
    });
    slide.addText([
      { text: "1. Merkle Root Check: ", options: { bold: true, fontSize: 13 } },
      { text: "Asserts that the proven root is in the 100-entry root history.\n", options: { fontSize: 13, breakLine: true } },
      { text: "2. Replay Guard: ", options: { bold: true, fontSize: 13 } },
      { text: "Checks if the nullifier has already been spent. Prevents double spend.\n", options: { fontSize: 13, breakLine: true } },
      { text: "3. UltraHonk Contract: ", options: { bold: true, fontSize: 13 } },
      { text: "Runs a BN254 pairing verifier using Soroban host functions.", options: { fontSize: 13 } }
    ], {
      x: 5.6, y: 2.6, w: 3.3, h: 2.1,
      fontFace: FONT_BODY, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
  }

  // =========================================================================
  // SLIDE 9: Tech Stack (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("TECH STACK", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("Cutting-Edge Cryptography on Soroban", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    const stackItems = [
      { label: "Zero-Knowledge", value: "Noir 1.0.0-beta.9 & Barretenberg 0.87.0", sub: "Client-side proving in WASM web-workers. UltraHonk over BN254 curve." },
      { label: "On-chain Light Client", value: "Soroban Native BLS12-381", sub: "CAP-0059 host functions verify Ethereum sync-committee signatures for ~30M inst." },
      { label: "Inclusion Proofs", value: "Merkle-Patricia Trie (MPT)", sub: "Verified directly in-contract using Keccak/RLP in Rust to verify Sepolia locked storage." },
      { label: "Frontend & DEX", value: "Vite + R3F & TS Matcher", sub: "React, Tailwind CSS, Three.js visualization, and off-chain midpoint orderbook pairing." }
    ];

    for (let i = 0; i < 4; i++) {
      const item = stackItems[i];
      const yPos = 1.7 + i * 0.9;

      // Small card background
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y: yPos, w: 8.4, h: 0.75,
        fill: { color: COLOR_CARD_LIGHT },
        shadow: makeShadowLight()
      });

      // Accent amber bar on left
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y: yPos, w: 0.06, h: 0.75,
        fill: { color: COLOR_ACCENT }
      });

      // Text elements
      slide.addText(item.label, {
        x: 1.0, y: yPos + 0.1, w: 2.2, h: 0.5,
        fontFace: FONT_TITLE, fontSize: 16, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });

      slide.addText(item.value, {
        x: 3.4, y: yPos + 0.1, w: 4.8, h: 0.25,
        fontFace: FONT_BODY, fontSize: 14, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });

      slide.addText(item.sub, {
        x: 3.4, y: yPos + 0.35, w: 4.8, h: 0.3,
        fontFace: FONT_BODY, fontSize: 12, color: COLOR_TEXT_LIGHT_MUTED, margin: 0
      });
    }
  }

  // =========================================================================
  // SLIDE 10: Traction & Deployed Proofs (Dark)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_DARK };

    // Slide Header
    slide.addText("TRACTION", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_DARK_MUTED, charSpacing: 2
    });
    slide.addText("Live and Verifiable on Stellar Testnet", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_DARK_PRIMARY, margin: 0
    });

    // Left side: Deployed Contracts
    slide.addText("DEPLOYED CONTRACTS", {
      x: 0.8, y: 1.7, w: 4.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_TEXT_DARK_MUTED, margin: 0
    });

    const contracts = [
      { name: "Larel Pool", id: "CBZNNVUKTG6YSVT3NGV7MDVL5ZQO5D4KLLIRFAGBCORPH7Q62ZHS5RP3" },
      { name: "EthLightClient", id: "CCI47AHPL6RETKEDIUGD3XWSBPOHY3IJAZVKBODCBAKZ6UAP27AQ6WH5" },
      { name: "LarelBridge", id: "CAY44CMEIJKB2TBVVPFZMEAIDQIROJPB5RIQX5TFQIYCG46WTSWDUXV6" }
    ];

    for (let i = 0; i < 3; i++) {
      const c = contracts[i];
      const y = 2.1 + i * 0.95;

      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y: y, w: 3.9, h: 0.85,
        fill: { color: COLOR_CARD_DARK },
        shadow: makeShadowDark()
      });

      slide.addText(c.name, {
        x: 1.0, y: y + 0.1, w: 3.5, h: 0.25,
        fontFace: FONT_TITLE, fontSize: 13, bold: true, color: COLOR_TEXT_DARK_PRIMARY, margin: 0
      });

      slide.addText(c.id, {
        x: 1.0, y: y + 0.35, w: 3.5, h: 0.45,
        fontFace: FONT_BODY, fontSize: 10, color: COLOR_TEXT_DARK_MUTED, margin: 0
      });
    }

    // Right side: Verified Evidence
    slide.addText("VERIFIED ON-CHAIN PROOFS", {
      x: 5.3, y: 1.7, w: 3.9, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_TEXT_DARK_MUTED, margin: 0
    });

    const steps = [
      { step: "Deposit 1 XLM (Leaf 0)", tx: "cdaa631c68bedd73a7cf469285e21c..." },
      { step: "Verify Sepolia State Root", tx: "2f1549ee8bbcdf5d803d11a99886b2d..." },
      { step: "Bridge Mint (Inbound)", tx: "4b3760d1f31b50da6a54bec54fe5f56..." },
      { step: "ZK Withdrawal", tx: "d2d2aca363087a082483b905d5e7ae..." }
    ];

    for (let i = 0; i < 4; i++) {
      const s = steps[i];
      const y = 2.1 + i * 0.72;

      slide.addShape(pres.shapes.RECTANGLE, {
        x: 5.3, y: y, w: 3.9, h: 0.62,
        fill: { color: COLOR_CARD_DARK },
        shadow: makeShadowDark()
      });

      slide.addImage({
        data: icons.check,
        x: 5.45, y: y + 0.16, w: 0.3, h: 0.3
      });

      slide.addText(s.step, {
        x: 5.85, y: y + 0.08, w: 3.2, h: 0.22,
        fontFace: FONT_TITLE, fontSize: 12, bold: true, color: COLOR_TEXT_DARK_PRIMARY, margin: 0
      });

      slide.addText("Tx: " + s.tx, {
        x: 5.85, y: y + 0.32, w: 3.2, h: 0.22,
        fontFace: FONT_BODY, fontSize: 10, color: COLOR_TEXT_DARK_MUTED, margin: 0
      });
    }
  }

  // =========================================================================
  // SLIDE 11: Roadmap & Ask (Light)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_LIGHT };

    // Slide Header
    slide.addText("THE FUTURE", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLOR_TEXT_LIGHT_MUTED, charSpacing: 2
    });
    slide.addText("Roadmap & The Ask", {
      x: 0.8, y: 0.8, w: 8.4, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 28, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });

    // Left: Roadmap Column
    slide.addText("ROADMAP", {
      x: 0.8, y: 1.7, w: 4.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_TEXT_LIGHT_MUTED, margin: 0
    });

    const roadmap = [
      { phase: "Phase 1: Security Audit", desc: "Run a full cryptographical audit on Noir circuits and Rust-based MPT/BLS light client." },
      { phase: "Phase 2: Decentralized Matcher", desc: "Move the off-chain matching engine into a decentralized, permissionless matcher set." },
      { phase: "Phase 3: Wallet Integration", desc: "Build native SDK integrations directly into Freighter, Albedo, and other Stellar wallets." }
    ];

    for (let i = 0; i < 3; i++) {
      const r = roadmap[i];
      const y = 2.1 + i * 0.95;

      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y: y, w: 4.1, h: 0.85,
        fill: { color: COLOR_CARD_LIGHT },
        shadow: makeShadowLight()
      });

      slide.addText(r.phase, {
        x: 1.0, y: y + 0.1, w: 3.7, h: 0.25,
        fontFace: FONT_TITLE, fontSize: 13, bold: true, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
      });

      slide.addText(r.desc, {
        x: 1.0, y: y + 0.35, w: 3.7, h: 0.45,
        fontFace: FONT_BODY, fontSize: 11, color: COLOR_TEXT_LIGHT_MUTED, margin: 0
      });
    }

    // Right: The Ask Column
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.4, y: 1.7, w: 3.8, h: 3.2,
      fill: { color: COLOR_CARD_LIGHT },
      shadow: makeShadowLight(),
      line: { color: COLOR_ACCENT, width: 2 }
    });

    slide.addText("OUR ASK", {
      x: 5.7, y: 2.0, w: 3.2, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12, bold: true, color: COLOR_ACCENT, margin: 0
    });

    slide.addText([
      { text: "We are looking for:\n\n", options: { bold: true, fontSize: 18 } },
      { text: "1. Design Partners: ", options: { bold: true, fontSize: 14 } },
      { text: "Remote agencies and builders who struggle with public stablecoin transparency.\n\n", options: { fontSize: 14 } },
      { text: "2. Technical Collaborators: ", options: { bold: true, fontSize: 14 } },
      { text: "Cryptographers and Rust developers to help optimize Soroban light-client costs.\n\n", options: { fontSize: 14 } },
      { text: "3. Integrations: ", options: { bold: true, fontSize: 14 } },
      { text: "Stellar wallet providers interested in adding privacy features natively.", options: { fontSize: 14 } }
    ], {
      x: 5.7, y: 2.4, w: 3.2, h: 2.3,
      fontFace: FONT_BODY, color: COLOR_TEXT_LIGHT_PRIMARY, margin: 0
    });
  }

  // =========================================================================
  // SLIDE 12: Closing (Dark)
  // =========================================================================
  {
    let slide = pres.addSlide();
    slide.background = { color: COLOR_BG_DARK };

    // Accent line left
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.15, h: 5.625,
      fill: { color: COLOR_ACCENT }
    });

    slide.addText("Sarah can give her team a raise without announcing it to the world.", {
      x: 1.0, y: 1.5, w: 8.0, h: 0.8,
      fontFace: FONT_TITLE, fontSize: 24, italic: true, color: COLOR_TEXT_DARK_MUTED, margin: 0
    });

    slide.addText("Your balances, transactions, and orders stay completely private.", {
      x: 1.0, y: 2.4, w: 8.0, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, bold: true, color: COLOR_TEXT_DARK_PRIMARY, margin: 0
    });

    slide.addText("Larel", {
      x: 1.0, y: 3.0, w: 8.0, h: 0.8,
      fontFace: FONT_TITLE, fontSize: 44, bold: true, color: COLOR_ACCENT, margin: 0
    });

    // Divider
    slide.addShape(pres.shapes.LINE, {
      x: 1.0, y: 4.0, w: 4.5, h: 0,
      line: { color: COLOR_TEXT_DARK_MUTED, width: 1 }
    });

    slide.addText("GitHub: github.com/ln-tc999/Larel.git\nContact: hello@larel.money / firdaussyah03@gmail.com", {
      x: 1.0, y: 4.2, w: 8.0, h: 0.6,
      fontFace: FONT_BODY, fontSize: 11, color: COLOR_TEXT_DARK_PRIMARY, margin: 0
    });
  }

  // Write file
  pres.writeFile({ fileName: "E:/smweb/Larel/deck/Larel_Pitch_Deck.pptx" }).then(() => {
    console.log("Deck created successfully!");
  }).catch(err => {
    console.error("Error creating deck:", err);
  });
}

main();
