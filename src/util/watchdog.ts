export interface Watchdog {
  /* (Re)starts the countdown from zero */
  start: () => void
  /* Starts the countdown only if it is not already running */
  arm: () => void
  /* Cancels the countdown */
  stop: () => void
}

type WatchdogConfig = { timeoutMs: number; onTimeout: () => void }

/*
 * Calls `onTimeout` once if neither `start` nor `stop` is called within `timeoutMs`.
 * The timer is deliberately not unref'd: a running watchdog keeps the process alive, so a stalled process
 * can't drain the event loop and exit cleanly (exit code 0) before the watchdog gets to report the stall.
 */
export const createWatchdog = ({ timeoutMs, onTimeout }: WatchdogConfig): Watchdog => {
  let timer: ReturnType<typeof setTimeout> | undefined

  const stop: Watchdog['stop'] = () => {
    clearTimeout(timer)
    timer = undefined
  }

  const start: Watchdog['start'] = () => {
    stop()
    timer = setTimeout(() => {
      timer = undefined
      onTimeout()
    }, timeoutMs)
  }

  const arm: Watchdog['arm'] = () => {
    if (timer === undefined) {
      start()
    }
  }

  return { start, arm, stop }
}
