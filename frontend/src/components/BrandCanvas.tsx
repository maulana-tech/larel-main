import FluidVolume, { type FluidShape } from './FluidVolume'
import { useIsDark } from '../hooks/useTheme'

// The ambient field's form. Override for preview via ?fx=veils|plumes|waves|swirl.
const SHAPES: FluidShape[] = ['veils', 'plumes', 'waves', 'swirl']
function currentShape(): FluidShape {
  if (typeof window === 'undefined') return 'plumes'
  const fx = new URLSearchParams(window.location.search).get('fx') as FluidShape | null
  return fx && SHAPES.includes(fx) ? fx : 'waves'
}

/** A faint trading-chart grid behind the app — evenly spaced vertical (time) and
 *  horizontal (price) hairlines, the horizontals a touch stronger like price
 *  levels. Edges fade out so it reads as atmosphere, not a hard sheet. */
function ChartGrid({ dark }: { dark: boolean }) {
  const v = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'    // vertical / time
  const h = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.065)'  //  horizontal / price
  const fade = 'radial-gradient(130% 100% at 50% 32%, #000 42%, transparent 100%)'
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, ${v} 1px, transparent 1px),
          linear-gradient(to bottom, ${h} 1px, transparent 1px)
        `,
        backgroundSize: '108px 80px',
        maskImage: fade,
        WebkitMaskImage: fade,
      }}
    />
  )
}

/**
 * Ambient brand backdrop for the app surfaces — the same volumetric fluid the
 * landing hero runs, dimmed under a sepia scrim with film grain and coordinate
 * hairlines on top. One fixed instance behind /app and /faucet, replacing the
 * old cold monochrome DitherFluid so the whole product is one continuous world.
 */
export function BrandCanvas() {
  const dark = useIsDark()
  const shape = currentShape()
  // Dark: neutral dark gray. Light: neutral off-white. No warm cast.
  const bg   = dark ? '#0d0d0d' : '#f6f6f6'
  const base = dark ? '#383838' : '#aaaaaa'
  const scrim = dark ? 'rgba(13,13,13,0.62)' : 'rgba(246,246,246,0.35)'
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: bg }}>
      {/* key={theme} remounts the shader so its baseColor/background uniforms
          re-initialise for the new theme. */}
      <div className="absolute inset-0" style={{ opacity: 1 }}>
        <FluidVolume
          key={`${dark ? 'dark' : 'light'}-${shape}`}
          baseColor={base}
          background={bg}
          shape={shape}
          quality="medium"
          speed={0.85}
        />
      </div>
      {/* Scrim — keeps the field as atmosphere, not a distraction under forms. */}
      <div className="absolute inset-0" style={{ background: scrim }} />
      <div className="wr-grain absolute inset-0 opacity-40" />
      <ChartGrid dark={dark} />
    </div>
  )
}

export default BrandCanvas
