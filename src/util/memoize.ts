/**
 * Wraps a no-arg `compute` function so it only ever runs once, caching its
 * return value (sync or async) — concurrent first-callers of an async
 * `compute` all await the same in-flight promise.
 */
export const memoize = <T>(compute: () => T): (() => T) => {
  let cached: { value: T } | undefined

  return (): T => {
    if (!cached) {
      cached = { value: compute() }
    }
    return cached.value
  }
}
