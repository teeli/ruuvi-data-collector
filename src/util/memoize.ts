/**
 * Wraps a no-arg `compute` function so it only ever runs once, caching its
 * return value (sync or async) behind `get()` — concurrent first-callers of
 * an async `compute` all await the same in-flight promise. `set()` overrides
 * the cached value directly (e.g. tests injecting a fixture instead of
 * running `compute`).
 */
export type Memoized<T> = { get: () => T; set: (value: T) => void }

export const memoize = <T>(compute: () => T): Memoized<T> => {
  let cached: { value: T } | undefined

  const get = (): T => {
    if (!cached) {
      cached = { value: compute() }
    }
    return cached.value
  }

  const set = (value: T): void => {
    cached = { value }
  }

  return { get, set }
}
