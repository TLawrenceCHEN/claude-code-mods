import { expect, test } from 'claude-code/testing'

const BACKDROP = {
  plugin: 'firefly-meadow',
  component: 'Backdrop',
  requestId: 'backdrop',
  props: { scene: 'meadow', plugin: 'firefly-meadow', glass: false },
} as const

const fireflies = (source: string) => source.split('url(#glow)').length - 1

test('more fireflies come out as the context window fills', async ($, on) => {
  let fill: number | undefined = 5
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200000, tokens: 10000, percent: fill }, rateLimits: [] },
  }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 't' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['desktop', 'mobile'] as const) {
    const early = await $.ui.mount({ ...BACKDROP, surface })
    const few = await early.find({ type: 'Svg' })
    await early.unmount()

    fill = 90
    await $.session.measure({
      context: { window: 200000, tokens: 180000, percent: 90 },
      rateLimits: [],
      changed: ['context'],
    })

    const late = await $.ui.mount({ ...BACKDROP, surface })
    const many = await late.find({ type: 'Svg' })
    await late.unmount()

    const before = fireflies(String(few?.props.source))
    const after = fireflies(String(many?.props.source))
    expect(before >= 6).toBe(true)
    expect(after > before).toBe(true)

    fill = 5
    await $.session.measure({
      context: { window: 200000, tokens: 10000, percent: 5 },
      rateLimits: [],
      changed: ['context'],
    })
  }
})
