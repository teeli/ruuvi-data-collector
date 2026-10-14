import { afterEach, beforeEach, describe, test, vi } from 'vitest'
import { createWatchdog } from './watchdog'

describe('watchdog', () => {
  const onTimeout = vi.fn<() => void>()

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  describe('when started', () => {
    test('should not time out before the timeout has elapsed', ({ expect }) => {
      createWatchdog({ timeoutMs: 1000, onTimeout }).start()

      vi.advanceTimersByTime(999)

      expect(onTimeout).not.toHaveBeenCalled()
    })

    test('should time out once the timeout has elapsed', ({ expect }) => {
      createWatchdog({ timeoutMs: 1000, onTimeout }).start()

      vi.advanceTimersByTime(1000)

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    test('should time out only once', ({ expect }) => {
      createWatchdog({ timeoutMs: 1000, onTimeout }).start()

      vi.advanceTimersByTime(5000)

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    test('should restart the countdown when started again', ({ expect }) => {
      const watchdog = createWatchdog({ timeoutMs: 1000, onTimeout })
      watchdog.start()
      vi.advanceTimersByTime(800)

      watchdog.start()
      vi.advanceTimersByTime(800)
      expect(onTimeout).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)
      expect(onTimeout).toHaveBeenCalledTimes(1)
    })
  })

  describe('when stopped', () => {
    test('should not time out', ({ expect }) => {
      const watchdog = createWatchdog({ timeoutMs: 1000, onTimeout })
      watchdog.start()

      watchdog.stop()
      vi.advanceTimersByTime(5000)

      expect(onTimeout).not.toHaveBeenCalled()
    })
  })

  describe('when armed', () => {
    test('should time out when the timeout has elapsed', ({ expect }) => {
      createWatchdog({ timeoutMs: 1000, onTimeout }).arm()

      vi.advanceTimersByTime(1000)

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    test('should not restart a countdown that is already running', ({ expect }) => {
      const watchdog = createWatchdog({ timeoutMs: 1000, onTimeout })
      watchdog.arm()
      vi.advanceTimersByTime(800)

      watchdog.arm()
      vi.advanceTimersByTime(200)

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    test('should start a new countdown after the previous one timed out', ({ expect }) => {
      const watchdog = createWatchdog({ timeoutMs: 1000, onTimeout })
      watchdog.arm()
      vi.advanceTimersByTime(1000)

      watchdog.arm()
      vi.advanceTimersByTime(1000)

      expect(onTimeout).toHaveBeenCalledTimes(2)
    })
  })
})
