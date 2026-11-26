import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { fireflyCount, meadowSvg } from './scene.js'

const PLUGIN = 'firefly-meadow'
const SCENE = 'meadow'

// Dusk: indigo grays warmed toward plum, cream words, firefly-gold accent.
const { theme, problems } = makeColors({
  label: 'Firefly meadow',
  only: 'dark',
  roles: {
    accent: '#e8c25a',
    danger: '#d86a5c',
    success: '#94c47c',
    warning: '#e0944a',
    pro: '#a993d8',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#15172a',
        'surface-1': '#1b1e33',
        'surface-2': '#21243b',
        'surface-3': '#24273f',
        'text-primary': '#f4ecdb',
        'text-secondary': '#d2c9b6',
        'text-muted': '#aaa18f',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: SCENE, glass: { blur: 18, tint: '#15172a', opacity: 0.55 } },
}

// The module's own memory of the fill; refreshed at start and on each measure.
let percent: number | undefined
let count = fireflyCount(undefined)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    try {
      percent = (await $.session.usage()).context.percent
      count = fireflyCount(percent)
    } catch {
      // No session figures yet: start with the evening's first few fireflies.
    }

    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('session.measure', ($, e, next) => {
    if (e.changed.includes('context')) {
      percent = e.context.percent
      const fresh = fireflyCount(percent)
      if (fresh !== count) {
        count = fresh
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
    const fill = percent === undefined ? 'a fresh evening' : `${percent}% of the context window`

    return (
      <Svg
        source={meadowSvg(count)}
        alt={`A dusky meadow under a crescent moon, with ${count} fireflies drifting over the grass (${fill})`}
        isInteractive
      />
    )
  })
}
