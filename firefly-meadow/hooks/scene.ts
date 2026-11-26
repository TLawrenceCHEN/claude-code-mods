// The dusky meadow, drawn as one SVG string. Fireflies are seeded by index,
// so firefly 7 always lives in the same spot: as the count grows, the ones
// already there stay put and new ones join them.

const W = 1600
const H = 1000

export const MIN_FIREFLIES = 6
export const MAX_FIREFLIES = 64

/** How many fireflies for a context fill of `percent` (0 to 100). */
export function fireflyCount(percent: number | undefined): number {
  const p = Math.min(100, Math.max(0, percent ?? 0)) / 100

  return Math.round(MIN_FIREFLIES + (MAX_FIREFLIES - MIN_FIREFLIES) * Math.pow(p, 0.85))
}

function rng(seed: number): () => number {
  let a = (seed * 2654435761) >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => n.toFixed(1)

function stars(): string {
  const r = rng(9001)
  let out = ''
  for (let i = 0; i < 46; i++) {
    const x = r() * W
    const y = r() * 360
    const size = 0.6 + r() * 1.3
    const twinkle = r() < 0.4
    const style = twinkle ? ` class="tw" style="animation-duration:${f(6 + r() * 6)}s;animation-delay:-${f(r() * 8)}s"` : ''
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(size)}" fill="#f6ead0" opacity="${f(0.35 + r() * 0.45)}"${style}/>`
  }

  return out
}

function grass(): string {
  const r = rng(424242)
  let blades = ''
  for (let x = -10; x < W + 20; x += 7 + r() * 7) {
    const base = 930 + r() * 30
    const tall = 40 + r() * 90
    const lean = (r() - 0.5) * 36
    const w = 3 + r() * 3
    blades += `M${f(x)} ${f(base)}Q${f(x + lean * 0.4)} ${f(base - tall * 0.6)} ${f(x + lean)} ${f(base - tall)}Q${f(x + lean * 0.4 + w)} ${f(base - tall * 0.55)} ${f(x + w)} ${f(base)}Z`
  }

  return blades
}

// A handful of meadow flowers, pale against the dark grass.
function flowers(): string {
  const r = rng(777)
  let out = ''
  for (let i = 0; i < 22; i++) {
    const x = r() * W
    const y = 905 + r() * 60
    const stem = 30 + r() * 40
    const hue = r() < 0.5 ? '#c9a7d8' : '#e9d9b4'
    out += `<path d="M${f(x)} ${f(y)}L${f(x + (r() - 0.5) * 6)} ${f(y - stem)}" stroke="#1d2a24" stroke-width="1.6"/>`
    out += `<circle cx="${f(x)}" cy="${f(y - stem)}" r="${f(2.4 + r() * 2)}" fill="${hue}" opacity="0.55"/>`
  }

  return out
}

function fireflies(count: number): string {
  let out = ''
  for (let i = 0; i < count; i++) {
    const r = rng(1000 + i)
    const x = 40 + r() * (W - 80)
    // Later fireflies range higher, so a full meadow spills into the sky.
    const reach = 260 + Math.min(i, 60) * 7
    const y = 900 - Math.pow(r(), 0.8) * reach
    const scale = 0.7 + r() * 0.6
    const drift = `d${Math.floor(r() * 5)}`
    const driftDur = f(14 + r() * 16)
    const driftDelay = f(r() * 20)
    const blinkDur = f(3.5 + r() * 4.5)
    const blinkDelay = f(r() * 6)
    out +=
      `<g transform="translate(${f(x)} ${f(y)}) scale(${scale.toFixed(2)})">` +
      `<g class="${drift}" style="animation-duration:${driftDur}s;animation-delay:-${driftDelay}s">` +
      `<g class="bl" opacity="0.85" style="animation-duration:${blinkDur}s;animation-delay:-${blinkDelay}s">` +
      `<circle r="16" fill="url(#glow)"/><circle r="2.3" fill="#fffbe2"/>` +
      `</g></g></g>`
  }

  return out
}

const STYLE = `
.d0,.d1,.d2,.d3,.d4{animation-timing-function:ease-in-out;animation-iteration-count:infinite}
.d0{animation-name:d0}.d1{animation-name:d1}.d2{animation-name:d2}.d3{animation-name:d3}.d4{animation-name:d4}
@keyframes d0{0%,100%{transform:translate(0px,0px)}25%{transform:translate(22px,-26px)}50%{transform:translate(-8px,-48px)}75%{transform:translate(-28px,-18px)}}
@keyframes d1{0%,100%{transform:translate(0px,0px)}30%{transform:translate(-30px,-14px)}60%{transform:translate(-12px,24px)}80%{transform:translate(16px,8px)}}
@keyframes d2{0%,100%{transform:translate(0px,0px)}20%{transform:translate(14px,18px)}55%{transform:translate(40px,-20px)}80%{transform:translate(10px,-34px)}}
@keyframes d3{0%,100%{transform:translate(0px,0px)}35%{transform:translate(-18px,-38px)}70%{transform:translate(24px,-22px)}}
@keyframes d4{0%,100%{transform:translate(0px,0px)}25%{transform:translate(-36px,10px)}50%{transform:translate(-20px,-30px)}75%{transform:translate(12px,-12px)}}
.bl{animation-name:bl;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes bl{0%,100%{opacity:0.15}35%{opacity:1}55%{opacity:0.9}80%{opacity:0.3}}
.tw{animation-name:tw;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes tw{0%,100%{opacity:0.3}50%{opacity:0.85}}
.sway{transform-origin:800px 960px;animation:sway 11s ease-in-out infinite}
@keyframes sway{0%,100%{transform:skewX(0deg)}50%{transform:skewX(1.6deg)}}
`

const GRASS = grass()
const STARS = stars()
const FLOWERS = flowers()

export function meadowSvg(count: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<style>${STYLE}</style>` +
    `<defs>` +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#121530"/><stop offset="0.38" stop-color="#2a2550"/>` +
    `<stop offset="0.6" stop-color="#5b3a5e"/><stop offset="0.72" stop-color="#a8606a"/>` +
    `<stop offset="0.8" stop-color="#d98d64"/></linearGradient>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="#fff4b8" stop-opacity="1"/>` +
    `<stop offset="0.25" stop-color="#f4cf55" stop-opacity="0.75"/>` +
    `<stop offset="1" stop-color="#e8a83a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="moonhalo"><stop offset="0" stop-color="#f6e7c4" stop-opacity="0.35"/>` +
    `<stop offset="1" stop-color="#f6e7c4" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#c98a7a" stop-opacity="0"/><stop offset="0.5" stop-color="#c98a7a" stop-opacity="0.18"/>` +
    `<stop offset="1" stop-color="#c98a7a" stop-opacity="0"/></linearGradient>` +
    `</defs>` +
    `<!-- sky -->` +
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
    STARS +
    `<!-- moon -->` +
    `<circle cx="1330" cy="170" r="120" fill="url(#moonhalo)"/>` +
    `<circle cx="1330" cy="170" r="34" fill="#f3e3bf"/>` +
    `<circle cx="1346" cy="160" r="30" fill="#24234a"/>` +
    `<!-- hills -->` +
    `<path d="M0 640C180 590 330 600 480 620S800 560 980 590 1300 640 1600 585V1000H0Z" fill="#3a2b4f"/>` +
    `<rect y="600" width="${W}" height="120" fill="url(#mist)"/>` +
    `<path d="M0 720C220 670 420 700 640 690S1020 650 1240 690 1480 700 1600 670V1000H0Z" fill="#262341"/>` +
    `<!-- trees -->` +
    `<path d="M120 712l26-90 26 90zM150 715l20-64 20 64zM1420 690l30-110 30 110zM1460 695l22-74 22 74z" fill="#1a1a31"/>` +
    `<path d="M0 800C260 760 520 790 800 780S1340 750 1600 775V1000H0Z" fill="#181a2e"/>` +
    `<!-- fireflies -->` +
    fireflies(count) +
    `<!-- meadow -->` +
    `<g class="sway"><path d="${GRASS}" fill="#121723"/>${FLOWERS}</g>` +
    `<rect y="955" width="${W}" height="45" fill="#0f1320"/>` +
    `</svg>`
  )
}
