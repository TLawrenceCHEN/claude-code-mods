import { expect, test } from 'claude-code/testing'

const BACKDROP = {
  plugin: 'pixel-snow',
  component: 'Backdrop',
  requestId: 'backdrop',
  props: { scene: 'winter', plugin: 'pixel-snow', glass: false },
} as const

const depthOf = (alt: string) => Number(/(\d+) pixels of snow/.exec(alt)?.[1])
const signOf = (alt: string) => /reading (\d+)%/.exec(alt)?.[1]

test('the snow deepens and the sign follows the context fill', async ($, on) => {
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200000, tokens: 8000, percent: 4 }, rateLimits: [] },
  }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 't' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['desktop', 'mobile'] as const) {
    const early = await $.ui.mount({ ...BACKDROP, surface })
    const before = String((await early.find({ type: 'Svg' }))?.props.alt)
    await early.unmount()

    await $.session.measure({ context: { window: 200000, tokens: 146000, percent: 73 }, rateLimits: [], changed: ['context'] })

    const late = await $.ui.mount({ ...BACKDROP, surface })
    const after = String((await late.find({ type: 'Svg' }))?.props.alt)
    await late.unmount()

    expect(signOf(before)).toBe('4')
    expect(signOf(after)).toBe('73')
    expect(depthOf(after) > depthOf(before)).toBe(true)

    await $.session.measure({ context: { window: 200000, tokens: 8000, percent: 4 }, rateLimits: [], changed: ['context'] })
  }
})
