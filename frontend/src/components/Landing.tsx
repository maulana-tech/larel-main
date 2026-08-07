import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import ScrambleCycle from './ScrambleCycle'
import { StoryShielded } from './StoryShielded'
import heroBanner from '../assets/hero-banner.jpg'
import logoDark from '../assets/logo-dark.png'
import logoLight from '../assets/logo-light.png'
import { ThemeToggle } from './ThemeToggle'
import { useIsDark } from '../hooks/useTheme'

const ROTATING = ['shielded', 'unlinkable', 'verified', 'private', 'yours']

/** Coordinate-label copy. Module-level so ScrambleCycle's `words` stays
 *  referentially stable across renders — an inline array would re-fire its
 *  effect every render and restart the animation. The labels settle in once
 *  (`once`) and then hold: they're fixed readouts, not a loop. Durations are
 *  staggered so the three resolve in sequence rather than snapping together. */
const NET_TITLE = ['Testnet']
const NET_VALUE = ['Stellar · SDF Horizon']
const PROOF_TITLE = ['Proof']
const PROOF_VALUE = ['UltraHonk · BN254']
const SHIELD_TITLE = ['Shielded']
const SHIELD_VALUE = ['Poseidon2 · Merkle']

const GRID_V = 'rgba(255,255,255,0.06)'
const GRID_H = 'rgba(255,255,255,0.09)'
const GRID_V_LIGHT = 'rgba(25,25,25,0.06)'
const GRID_H_LIGHT = 'rgba(25,25,25,0.09)'

/** A faint trading-chart grid behind the hero — evenly spaced vertical (time)
 *  and horizontal (price) hairlines, the horizontals a touch stronger like price
 *  levels — the same atmosphere the app surface runs, so the whole product reads
 *  as one world. Grid colour fades out on scroll via the `--grid-*` vars so it
 *  dissolves into the incoming footer. */
function ChartBackground() {
  const fade = 'radial-gradient(125% 105% at 50% 46%, #000 40%, transparent 100%)'
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--grid-v) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-h) 1px, transparent 1px)',
          backgroundSize: '192px 138px',
          maskImage: fade,
          WebkitMaskImage: fade,
        }}
      />
    </div>
  )
}

/** The coordinate readouts, now a stacked column anchored to the hero's right
 *  rail rather than scattered over the backdrop — it counterweights the
 *  left-aligned headline instead of colliding with it. Fades with the grid. */
function Readouts({ dark }: { dark: boolean }) {
  const textColor = dark ? 'text-[#f2f2f2]/50' : 'text-[#191919]/50'
  const textHighlight = dark ? 'text-[#f2f2f2]/85' : 'text-[#191919]/85'
  const rule = dark ? 'border-[#f2f2f2]/12' : 'border-[#191919]/12'
  const rows = [
    { title: NET_TITLE, value: NET_VALUE, td: 620, vd: 900 },
    { title: PROOF_TITLE, value: PROOF_VALUE, td: 820, vd: 1150 },
    { title: SHIELD_TITLE, value: SHIELD_VALUE, td: 1040, vd: 1400 },
  ]
  return (
    <ul
      className={`flex flex-col gap-7 border-l ${rule} pl-6 font-mono text-[10px] uppercase tracking-[0.14em] ${textColor}`}
      style={{ opacity: 'var(--grid-op, 1)' }}
    >
      {rows.map((r) => (
        <li key={r.title[0]}>
          <span className={`block ${textHighlight}`}>
            <ScrambleCycle words={r.title} duration={r.td} glitch={false} once />
          </span>
          <span className="mt-1 block">
            [ <ScrambleCycle words={r.value} duration={r.vd} glitch={false} once /> ]
          </span>
        </li>
      ))}
    </ul>
  )
}

function Word({ children }: { children: string }) {
  return <span className="inline-block">{children}</span>
}

export function Landing({ onEnter }: { onEnter: () => void }) {
  // Smooth section scrolling is driven by the ScrollStack's window-scroll Lenis
  // (in StoryShielded), so no separate Lenis instance is mounted here.
  const heroRef = useRef<HTMLElement>(null)
  const dark = useIsDark()

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.6)))
      const a = 1 - p // grid + labels fade out as the story scrolls up
      const colorPrefix = dark ? '255,255,255' : '25,25,25'
      el.style.setProperty('--grid-v', `rgba(${colorPrefix},${(0.06 * a).toFixed(3)})`)
      el.style.setProperty('--grid-h', `rgba(${colorPrefix},${(0.09 * a).toFixed(3)})`)
      el.style.setProperty('--grid-op', a.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [dark])

  return (
    <div
      className="relative w-full transition-colors duration-300"
      style={{
        backgroundColor: dark ? '#191919' : '#f2f2f2',
        color: dark ? '#f2f2f2' : '#191919',
      }}
    >
      <section
        ref={heroRef}
        className="relative min-h-screen w-full overflow-hidden"
        style={{ '--grid-v': dark ? GRID_V : GRID_V_LIGHT, '--grid-h': dark ? GRID_H : GRID_H_LIGHT, '--grid-op': 1 } as CSSProperties}
      >
      {/* Backdrop — hero banner, driven fully to greyscale so it reads as the
          same black-and-white world as the app surface rather than a standalone
          illustration. `isolate` keeps the blend layers acting on the image
          only, never on the page beneath. Grain is a separate static overlay. */}
      <div className="absolute inset-0 isolate overflow-hidden">
        <img
          src={heroBanner}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          style={{
            filter: dark
              ? 'grayscale(1) contrast(1.05) brightness(0.44)'
              : 'grayscale(1) contrast(0.9) brightness(1.06)',
          }}
        />
        {/* Ground wash — sinks the image toward the story ground (dark) or the
            broken-white page (light) so the headline keeps its contrast. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: dark ? '#101010' : '#f2f2f2',
            mixBlendMode: dark ? 'multiply' : 'screen',
            opacity: dark ? 0.5 : 0.55,
          }}
        />
      </div>

      {/* Static film grain — fixed noise, does not shimmer. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0.45 0.45 0 -0.4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
          backgroundSize: '90px 90px',
          opacity: dark ? 0.6 : 0.25,
        }}
      />

      <ChartBackground />

      {/* Keep the upper half a touch darker for the white type, and weight the
          left edge where the headline now sits so it always clears the banner. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: dark
            ? 'linear-gradient(to bottom, rgba(14,14,14,0.55), rgba(14,14,14,0.12) 42%, transparent 70%)'
            : 'linear-gradient(to bottom, rgba(242,242,242,0.55), rgba(242,242,242,0.12) 42%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: dark
            ? 'linear-gradient(to right, rgba(14,14,14,0.62) 0%, rgba(14,14,14,0.34) 38%, transparent 66%)'
            : 'linear-gradient(to right, rgba(242,242,242,0.72) 0%, rgba(242,242,242,0.4) 38%, transparent 66%)',
        }}
      />

      {/* Header — fixed, inverts against whatever scrolls behind it. */}
      <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-5">
          <a href="#/" className="flex items-center gap-3">
            {/* Dark logo (black mark) works with mix-blend-difference: inverts to white on dark bg */}
            <img src={logoDark} alt="Larel" className="h-12 w-auto" />
            <span className="font-display text-base font-semibold tracking-tight text-[#f2f2f2]">
              larel
            </span>
          </a>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em]">
            <a href="#/faucet" className="text-[#f2f2f2]/70 transition hover:text-[#f2f2f2]">
              Faucet
            </a>
            <ThemeToggle />
            <button onClick={onEnter} className="text-[#f2f2f2]/70 transition hover:text-[#f2f2f2]">
              Enter →
            </button>
          </nav>
        </div>
      </header>

      {/* Hero — left-aligned masthead on a 12-column rail, with the coordinate
          readouts held on the right so the composition stays balanced instead of
          floating dead-centre. Stacks to a single column below `lg`. */}
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto grid w-full max-w-[100rem] grid-cols-1 items-center gap-14 px-6 pb-28 pt-32 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:px-16 lg:pb-24">
          <div className="lg:col-span-7 xl:col-span-7">
            <span
              className={`block font-mono text-[10px] uppercase tracking-[0.28em] ${dark ? 'text-[#f2f2f2]/55' : 'text-[#191919]/55'}`}
            >
              [ Stellar · Soroban · zero-knowledge ]
            </span>

            <h1
              className="mt-7 font-display font-medium uppercase leading-[0.98] tracking-[-0.04em]"
              style={{
                fontSize: 'clamp(2.4rem, 6.2vw, 5.25rem)',
                textShadow: dark ? '0 2px 30px rgba(14,14,14,0.45)' : 'none',
                color: dark ? '#fafafa' : '#191919',
              }}
            >
              <span className="flex flex-wrap gap-x-[0.26em]">
                <Word>private</Word>
                <Word>your</Word>
                <Word>assets</Word>
              </span>
              <span className="flex flex-wrap gap-x-[0.26em]">
                <Word>that</Word>
                <Word>stay</Word>
              </span>
              <span className="block">
                <ScrambleCycle words={ROTATING} duration={900} hold={2000} />
              </span>
            </h1>

            <p
              className={`mt-8 max-w-xl text-[15px] font-medium leading-relaxed ${dark ? 'text-[#f2f2f2]/70' : 'text-[#191919]/70'}`}
            >
              Deposit, transfer and trade on Stellar with amounts, balances and counterparties
              hidden — every move still verified on-chain by a zero-knowledge proof.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-2 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition hover:opacity-80"
                style={{
                  backgroundColor: dark ? '#f2f2f2' : '#191919',
                  color: dark ? '#101010' : '#f2f2f2',
                }}
              >
                Enter app →
              </button>
              <a
                href="#/faucet"
                className={`inline-flex items-center gap-2 border px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                  dark
                    ? 'border-[#f2f2f2]/25 text-[#f2f2f2]/80 hover:border-[#f2f2f2]/60 hover:text-[#f2f2f2]'
                    : 'border-[#191919]/25 text-[#191919]/80 hover:border-[#191919]/60 hover:text-[#191919]'
                }`}
              >
                Get testnet funds
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:flex lg:justify-end">
            <Readouts dark={dark} />
          </div>
        </div>

        {/* Scroll cue — pinned bottom-left, on the same rail as the headline. */}
        <span
          className={`absolute bottom-10 left-6 font-mono text-[11px] uppercase tracking-[0.3em] sm:left-10 lg:left-16 ${dark ? 'text-[#f2f2f2]/55' : 'text-[#191919]/55'}`}
        >
          scroll ↓
        </span>
      </div>

      {/* Clean seam into the dark story: a long, gradual wash over the bottom
          (grain and fluid alike) reaching the story ground #101010 at the
          boundary so the section change is invisible. Below the z-10 content, so
          the headline and `scroll` stay crisp; the ramp stays transparent through
          their band. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[32rem]"
        style={{
          background: dark
            ? 'linear-gradient(to bottom, rgba(16,16,16,0) 0%, rgba(16,16,16,0) 48%, rgba(16,16,16,0.35) 70%, rgba(16,16,16,0.72) 86%, rgba(16,16,16,0.92) 94%, #101010 100%)'
            : 'linear-gradient(to bottom, rgba(242,242,242,0) 0%, rgba(242,242,242,0) 48%, rgba(242,242,242,0.35) 70%, rgba(242,242,242,0.72) 86%, rgba(242,242,242,0.92) 94%, #f2f2f2 100%)',
        }}
      />
      </section>

      <StoryShielded onEnter={onEnter} />

      <footer className="relative flex min-h-screen flex-col justify-between overflow-hidden px-8 py-16 transition-colors duration-300"
              style={{
                backgroundColor: dark ? '#101010' : '#f2f2f2',
                color: dark ? '#f2f2f2' : '#191919',
              }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.35 0.35 0.35 0 -0.36'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
            backgroundSize: '90px 90px',
          }}
        />

        <div className="relative flex items-start justify-between">
          <p className={`max-w-xs text-[15px] font-medium leading-snug ${dark ? 'text-[#f2f2f2]/80' : 'text-[#191919]/80'}`}>
            Feel free to reach out if you want private money on Stellar — or simply have a chat.
          </p>
          <a href="#/" className="transition hover:opacity-75">
            <img src={dark ? logoDark : logoLight} alt="Larel" className="h-36 w-auto opacity-85" />
          </a>
        </div>

        <style>{`
          @keyframes lax-marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-lax-marquee {
            display: inline-block;
            white-space: nowrap;
            animation: lax-marquee 20s linear infinite;
          }
        `}</style>

        <div className="relative overflow-hidden w-full whitespace-nowrap select-none">
          <div className="animate-lax-marquee" style={{ fontSize: 'clamp(2rem, 8.2vw, 6.5rem)', color: dark ? '#a6a6a6' : '#7a7a7a' }}>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>LAREL</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>STELLAR</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>SOROBAN</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>NOIR</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>SHIELDED</a>
            <span className="mx-8 opacity-45">·</span>
            {/* Duplicate for infinite loop */}
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>LAREL</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>STELLAR</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>SOROBAN</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>NOIR</a>
            <span className="mx-8 opacity-45">·</span>
            <a href="/" className={`transition-colors ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>SHIELDED</a>
            <span className="mx-8 opacity-45">·</span>
          </div>
          <div className="mt-6 h-px w-full" style={{ backgroundColor: dark ? 'rgba(242,242,242,0.2)' : 'rgba(25,25,25,0.2)' }} />
        </div>

        <div className="relative">
          <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
            <nav className={`flex gap-6 font-mono text-[13px] uppercase tracking-[0.14em] ${dark ? 'text-[#f2f2f2]/70' : 'text-[#191919]/70'}`}>
              <a href="https://github.com/ln-tc999/Larel.git" className={`transition ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}>GitHub</a>
            </nav>

            <div className="flex justify-end">
              <div className="max-w-[20rem] text-right">
                <div className={`mb-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] justify-end ${dark ? 'text-[#f2f2f2]' : 'text-[#191919]'}`}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                    <circle cx="5" cy="6.5" r="4.5" stroke="currentColor" />
                    <circle cx="8" cy="6.5" r="4.5" stroke="currentColor" />
                  </svg>
                  Build on Stellar
                </div>
                <p className={`text-[13px] leading-relaxed ${dark ? 'text-[#f2f2f2]/70' : 'text-[#191919]/70'}`}>
                  Larel is a community-run project. We're always developing for everyone in the Stellar ecosystem. To get involved, reach out with what you'd build.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14 flex items-center justify-between border-t pt-6 font-mono text-[11px] uppercase tracking-[0.14em]"
               style={{
                 borderColor: dark ? 'rgba(242,242,242,0.12)' : 'rgba(25,25,25,0.12)',
                 color: dark ? 'rgba(242,242,242,0.5)' : 'rgba(25,25,25,0.5)',
               }}
          >
            <span>© Larel Team 2026</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`transition ${dark ? 'hover:text-[#f2f2f2]' : 'hover:text-[#191919]'}`}
            >
              Top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
