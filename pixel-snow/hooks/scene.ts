// A pixel-art winter night on a 320 by 200 grid: one unit is one pixel.
// The snow on the ground deepens with the context window's fill, and the
// fill itself is painted on the wooden sign stuck in the snow.

const W = 320
const H = 200
const BASE = 196 // where the bare ground would be

/** Snow depth in pixels for a fill of `percent` (0 to 100). */
export function snowDepth(percent: number): number {
  return 3 + Math.round(Math.min(100, Math.max(0, percent)) * 0.5)
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

const px = (x: number, y: number, w: number, h: number, c: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`

// Columns of one height merged into one rect, so the file stays small.
function columns(heights: (x: number) => number, top: (x: number, h: number) => number, color: string): string {
  let out = ''
  let start = 0
  let prev = heights(0)
  for (let x = 1; x <= W; x++) {
    const h = x < W ? heights(x) : -1
    if (h !== prev) {
      const y = top(start, prev)
      out += px(start, y, x - start, H - y, color)
      start = x
      prev = h
    }
  }

  return out
}

// Spans from y0 down to y1 per column, merged where neighbours match.
function runs(span: (x: number) => [number, number], color: string): string {
  let out = ''
  let start = 0
  let prev = span(0)
  for (let x = 1; x <= W; x++) {
    const cur: [number, number] = x < W ? span(x) : [-1, -1]
    if (cur[0] !== prev[0] || cur[1] !== prev[1]) {
      if (prev[1] > prev[0]) out += px(start, prev[0], x - start, prev[1] - prev[0], color)
      start = x
      prev = cur
    }
  }

  return out
}

// 3 by 5 digits, drawn at twice size on the sign.
const GLYPHS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '%': ['11001', '11010', '00100', '01011', '10011'],
}

function text(s: string, x0: number, y0: number, scale: number, color: string): string {
  let out = ''
  let x = x0
  for (const ch of s) {
    const g = GLYPHS[ch]
    if (g === undefined) continue
    g.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '1') out += px(x + c * scale, y0 + r * scale, scale, scale, color)
      }
    })
    x += ((g[0]?.length ?? 3) + 1) * scale
  }

  return out
}

function textWidth(s: string, scale: number): number {
  let w = 0
  for (const ch of s) w += ((GLYPHS[ch]?.[0]?.length ?? 3) + 1) * scale

  return w - scale
}

function sky(): string {
  const bands = ['#0b1228', '#0e1631', '#111b3b', '#152146', '#1a2852', '#20305e', '#273869']
  const step = 18
  let out = ''
  bands.forEach((c, i) => {
    out += px(0, i * step, W, step + 1, c)
    // A dithered row between bands, for the pixel look.
    const next = bands[i + 1]
    if (next !== undefined) {
      for (let x = (i % 2) * 2; x < W; x += 4) out += px(x, (i + 1) * step - 1, 2, 1, next)
    }
  })
  out += px(0, bands.length * step, W, H, bands[bands.length - 1] ?? '#273869')

  return out
}

function stars(): string {
  const r = rng(31)
  let out = ''
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(r() * W)
    const y = Math.floor(r() * 90)
    const big = r() < 0.12
    const tw = r() < 0.45 ? ` class="tw" style="animation-duration:${(3 + r() * 5).toFixed(1)}s;animation-delay:-${(r() * 6).toFixed(1)}s"` : ''
    out += px(x, y, 1, 1, big ? '#ffffff' : '#b9c6ea', tw)
    if (big) out += px(x - 1, y, 3, 1, '#ffffff', tw) + px(x, y - 1, 1, 3, '#ffffff', tw)
  }

  return out
}

function moon(): string {
  const cx = 268
  const cy = 34
  const R = 10
  let out = ''
  for (let y = -R; y <= R; y++) {
    const half = Math.floor(Math.sqrt(R * R - y * y))
    out += px(cx - half, cy + y, half * 2 + 1, 1, '#f3efd6')
  }
  out += px(cx - 4, cy - 3, 3, 2, '#d9d3b4') + px(cx + 3, cy + 2, 2, 2, '#d9d3b4') + px(cx - 1, cy + 5, 2, 1, '#d9d3b4')

  return out
}

function mountains(): string {
  // A triangle wave: jagged peaks, as pixel mountains have.
  const tri = (t: number) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1)
  const far = (x: number) => Math.round(124 - 44 * tri(x / 70 + 0.2) - 6 * tri(x / 23))
  const near = (x: number) => Math.round(148 - 30 * tri(x / 52 + 0.65) - 4 * tri(x / 17))
  let out = columns(far, (_, h) => h, '#18213f')
  // Snow caps: from each peak down to a ragged snowline.
  out += runs(x => [far(x), Math.round(96 + 3 * tri(x / 9))], '#a9b8dc')
  out += columns(near, (_, h) => h, '#111933')
  out += runs(x => [near(x), Math.round(126 + 2 * tri(x / 7))], '#c9d5ee')

  return out
}

function pine(x: number, base: number, size: number): string {
  let out = px(x - 1, base - 4, 3, 4, '#3b2a22')
  let y = base - 4
  for (let tier = 0; tier < 3; tier++) {
    const w = (size - tier * 2) * 2 + 1
    const h = size - tier
    for (let row = 0; row < h; row++) {
      const half = Math.round(((row + 1) / h) * (w / 2))
      out += px(x - half, y - h + row, half * 2 + 1, 1, row % 3 === 0 ? '#1c4a3c' : '#163d33')
    }
    // Snow resting on each tier.
    const half = Math.round(w / 2)
    out += px(x - half + 1, y - 1, half, 1, '#e6eefa')
    y -= h - 1
  }
  out += px(x, y - 2, 1, 2, '#e6eefa')

  return out
}

function cabin(): string {
  const x = 236
  const b = BASE
  let out = ''
  out += px(x + 26, b - 54, 6, 16, '#4b3b3f') // chimney
  out += px(x + 26, b - 55, 6, 2, '#eef3fb')
  out += px(x, b - 30, 40, 30, '#5b3b29') // walls
  for (let y = b - 27; y < b; y += 4) out += px(x, y, 40, 1, '#4a2f20')
  // Roof, stepped, with snow on it.
  for (let i = 0; i < 12; i++) {
    out += px(x - 4 + i * 2, b - 30 - i, 48 - i * 4, 1, '#3a2433')
    out += px(x - 4 + i * 2, b - 31 - i, 48 - i * 4, 1, i % 2 === 0 ? '#eef3fb' : '#d8e2f2')
  }
  // A lit window, and its warm spill.
  out += px(x + 7, b - 22, 11, 9, '#2a1a14')
  out += px(x + 8, b - 21, 9, 7, '#ffd56b', ' class="glow"')
  out += px(x + 12, b - 21, 1, 7, '#2a1a14') + px(x + 8, b - 18, 9, 1, '#2a1a14')
  out += px(x + 25, b - 20, 9, 20, '#3a2418') // door
  out += px(x + 31, b - 11, 1, 1, '#d9a441')

  return out
}

function smoke(): string {
  let out = ''
  for (let i = 0; i < 4; i++) {
    out += px(265, 138, 3, 3, '#8d97b4', ` class="sm" style="animation-delay:-${(i * 1.75).toFixed(2)}s"`)
  }

  return out
}

function sign(percent: number): string {
  const label = `${Math.round(percent)}%`
  const scale = 2
  const bw = 48
  const bx = 26
  const by = 98
  let out = ''
  out += px(bx + 21, by + 18, 5, H - by - 18, '#6b4a2e') // post
  out += px(bx + 22, by + 18, 1, H - by - 18, '#7d5837')
  out += px(bx, by, bw, 18, '#5a3b22') // board edge
  out += px(bx + 1, by + 1, bw - 2, 16, '#8a5f3a')
  out += px(bx + 1, by + 6, bw - 2, 1, '#7a5232') + px(bx + 1, by + 12, bw - 2, 1, '#7a5232')
  const tw = textWidth(label, scale)
  out += text(label, bx + Math.round((bw - tw) / 2), by + 4, scale, '#f6ecd2')
  // Snow on the top of the board.
  out += px(bx - 1, by - 2, bw + 2, 2, '#eef3fb') + px(bx + 4, by - 3, 14, 1, '#eef3fb') + px(bx + 30, by - 3, 9, 1, '#eef3fb')

  return out
}

function ground(depth: number): string {
  const drift = (x: number) =>
    Math.round(1.6 * Math.sin(x / 17) + 1.2 * Math.sin(x / 7 + 1) + 3 * Math.exp(-(((x - 120) / 10) ** 2)) + 4 * Math.exp(-(((x - 236) / 8) ** 2)))
  const top = (x: number) => BASE - depth - Math.max(0, drift(x))
  let out = columns(top, (_, h) => h, '#dfe8f5')
  out += columns(top, (_, h) => h, '#ffffff').replace(/height="\d+"/g, 'height="1"')
  out += columns(top, (_, h) => h + 2, '#c4d1ea').replace(/height="\d+"/g, 'height="1"')
  // Glints on the snow.
  const r = rng(5)
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(r() * W)
    out += px(x, top(x) + 1 + Math.floor(r() * Math.max(1, depth - 2)), 1, 1, '#ffffff', ` class="tw" style="animation-duration:${(4 + r() * 4).toFixed(1)}s;animation-delay:-${(r() * 5).toFixed(1)}s"`)
  }

  return out
}

function snowfall(percent: number): string {
  const count = 36 + Math.round(percent * 0.5)
  let out = ''
  for (let i = 0; i < count; i++) {
    const r = rng(700 + i)
    const x = Math.floor(r() * W)
    const y = Math.floor(r() * H)
    const size = r() < 0.25 ? 2 : 1
    const dur = (size === 2 ? 14 : 20) + r() * 10
    const sway = `s${Math.floor(r() * 3)}`
    out +=
      `<g class="${sway}" style="animation-delay:-${(r() * 6).toFixed(1)}s">` +
      px(x, y, size, size, size === 2 ? '#ffffff' : '#dce6f7', ` class="fall" style="animation-duration:${dur.toFixed(1)}s;animation-delay:-${(r() * dur).toFixed(1)}s"`) +
      `</g>`
  }

  return out
}

const STYLE = `
.fall{animation-name:fall;animation-timing-function:steps(200);animation-iteration-count:infinite}
@keyframes fall{0%{transform:translate(0px,-200px)}100%{transform:translate(0px,200px)}}
.s0,.s1,.s2{animation-duration:6s;animation-iteration-count:infinite;animation-timing-function:steps(4)}
.s0{animation-name:s0}.s1{animation-name:s1}.s2{animation-name:s2}
@keyframes s0{0%,100%{transform:translate(0px,0px)}50%{transform:translate(3px,0px)}}
@keyframes s1{0%,100%{transform:translate(0px,0px)}50%{transform:translate(-3px,0px)}}
@keyframes s2{0%,100%{transform:translate(-2px,0px)}50%{transform:translate(2px,0px)}}
.tw{animation-name:tw;animation-timing-function:steps(2);animation-iteration-count:infinite}
@keyframes tw{0%,100%{opacity:1}50%{opacity:0.35}}
.sm{animation:sm 7s steps(14) infinite}
@keyframes sm{0%{transform:translate(0px,0px);opacity:0.8}100%{transform:translate(-8px,-28px);opacity:0}}
.glow{animation:glow 5s steps(3) infinite}
@keyframes glow{0%,100%{opacity:1}50%{opacity:0.85}}
`

// Runs of plain same-colored pixels merged into one path each, in order,
// so the scene stays well under the size an Svg may be.
const RECT = /<rect x="(-?\d+)" y="(-?\d+)" width="(\d+)" height="(\d+)" fill="(#\w+)"\/>/g
function compact(svg: string): string {
  return svg.replace(/(?:<rect x="-?\d+" y="-?\d+" width="\d+" height="\d+" fill="#\w+"\/>)+/g, block => {
    let out = ''
    let color = ''
    let d = ''
    for (const [, x, y, w, h, c] of block.matchAll(RECT)) {
      if (c !== color) {
        if (d !== '') out += `<path d="${d}" fill="${color}"/>`
        color = c ?? ''
        d = ''
      }
      d += `M${x} ${y}h${w}v${h}h-${w}z`
    }
    if (d !== '') out += `<path d="${d}" fill="${color}"/>`

    return out
  })
}

const STILL = compact(sky() + stars() + moon() + mountains())

export function winterSvg(percent: number): string {
  const depth = snowDepth(percent)
  const trees = pine(104, BASE, 14) + pine(124, BASE, 17) + pine(144, BASE, 13) + pine(302, BASE, 16) + pine(12, BASE, 15)

  return compact(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">` +
    `<style>${STYLE}</style>` +
    `<!-- sky -->` +
    STILL +
    `<!-- village -->` +
    trees +
    cabin() +
    smoke() +
    sign(percent) +
    `<!-- snow -->` +
    ground(depth) +
    snowfall(percent) +
    `</svg>`
  )
}
