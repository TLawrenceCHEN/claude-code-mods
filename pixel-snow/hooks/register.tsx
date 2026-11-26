import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { snowDepth, winterSvg } from './scene.js'

const PLUGIN = 'pixel-snow'
const SCENE = 'winter'

// A winter night: ink-blue grays, snow-white words, an icy accent.
const { theme, problems } = makeColors({
  label: 'Pixel snow',
  only: 'dark',
  roles: {
    accent: '#7cc8f0',
    danger: '#e0605a',
    success: '#86cf96',
    warning: '#e8b04a',
    pro: '#b39ae8',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0f1832',
        'surface-1': '#15203d',
        'surface-2': '#1a2747',
        'surface-3': '#1c2a4b',
        'text-primary': '#eef3fb',
        'text-secondary': '#c8d3e6',
        'text-muted': '#9eabc4',
      },
    },
  },
})

const BASE: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: SCENE, glass: { blur: 10, tint: '#0f1832', opacity: 0.6 } },
}

// Square corners and a monospace face, for the pixel feel.
const LOOK: ThemeSetArgs = {
  ...BASE,
  style: {
    Text: { fontFamily: ['mono'] },
    Heading: { fontFamily: ['mono'], fontWeight: 'bold' },
    UserMessage: { backgroundColor: '#1c2a4b', borderColor: '#7cc8f0', borderWidth: 2, radius: 0, padding: 12 },
    AssistantMessage: { radius: 0 },
    ToolUse: { fontFamily: ['mono'], backgroundColor: '#15203d', radius: 0, paddingX: 8 },
  },
}

// Refreshed at start and on each measure; a reload runs session.start again.
let percent = 0
let depth = snowDepth(0)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    try {
      percent = (await $.session.usage()).context.percent ?? 0
      depth = snowDepth(percent)
    } catch {
      // No figures yet: a light dusting to start.
    }

    try {
      const set = await $.theme.set(LOOK)
      if (!set.isDrawn) $.ui.status(set.reason)
    } catch (error) {
      $.ui.log(String(error))
      await $.theme.set(BASE)
    }

    return next(e)
  })

  on('session.measure', ($, e, next) => {
    if (e.changed.includes('context')) {
      const fresh = Math.round(e.context.percent ?? 0)
      if (fresh !== Math.round(percent)) {
        percent = fresh
        depth = snowDepth(percent)
        $.ui.invalidate('ui.render')
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== PLUGIN || e.props.scene !== SCENE) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const shown = Math.round(percent)

    return (
      <Svg
        source={winterSvg(shown)}
        alt={`A pixel-art winter night: a cabin and pines under falling snow, ${depth} pixels of snow on the ground, and a wooden sign reading ${shown}%`}
        isInteractive
      />
    )
  })
}
