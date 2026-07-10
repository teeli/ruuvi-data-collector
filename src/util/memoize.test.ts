import { describe, test, vi } from 'vitest'
import { memoize } from './memoize'

describe('memoize', () => {
  test('memoizes the result of an async compute across repeated calls', async ({ expect }) => {
    const compute = vi.fn<() => Promise<string>>(async () => 'computed')
    const cached = memoize(compute)

    const [first, second] = await Promise.all([cached.get(), cached.get()])

    expect(first).toBe('computed')
    expect(second).toBe('computed')
    expect(compute).toHaveBeenCalledTimes(1)
  })

  test('memoizes the result of a sync compute across repeated calls', ({ expect }) => {
    const compute = vi.fn<() => string>(() => 'computed')
    const cached = memoize(compute)

    expect(cached.get()).toBe('computed')
    expect(cached.get()).toBe('computed')
    expect(compute).toHaveBeenCalledTimes(1)
  })

  test('set overrides the cached value without calling compute', async ({ expect }) => {
    const compute = vi.fn<() => Promise<string>>(async () => 'computed')
    const cached = memoize(compute)
    cached.set(Promise.resolve('overridden'))

    await expect(cached.get()).resolves.toBe('overridden')
    expect(compute).not.toHaveBeenCalled()
  })
})
