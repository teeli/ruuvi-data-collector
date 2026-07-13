import { describe, test, vi } from 'vitest'
import { memoize } from './memoize'

describe('memoize', () => {
  test('memoizes the result of an async compute across repeated calls', async ({ expect }) => {
    const compute = vi.fn<() => Promise<string>>(async () => 'computed')
    const cached = memoize(compute)

    const [first, second] = await Promise.all([cached(), cached()])

    expect(first).toBe('computed')
    expect(second).toBe('computed')
    expect(compute).toHaveBeenCalledTimes(1)
  })

  test('memoizes the result of a sync compute across repeated calls', ({ expect }) => {
    const compute = vi.fn<() => string>(() => 'computed')
    const cached = memoize(compute)

    expect(cached()).toBe('computed')
    expect(cached()).toBe('computed')
    expect(compute).toHaveBeenCalledTimes(1)
  })
})
