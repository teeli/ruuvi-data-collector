import { describe, test } from 'vitest'
import { testConfig } from '../testing/test-config'
import { defineConfig, getConfig } from './config'

const baseConfig = { influxdb: { bucket: 'dummy', org: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } } }

describe('getConfig', () => {
  test('returns the mocked test config', async ({ expect }) => {
    await expect(getConfig()).resolves.toEqual(testConfig)
  })

  test('memoizes the config across repeated calls', async ({ expect }) => {
    const [first, second] = await Promise.all([getConfig(), getConfig()])
    expect(first).toBe(second)
  })
})

describe('defineConfig aliases validation', () => {
  test('accepts a mac address key', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, aliases: { 'AA:BB:CC:DD:EE:FF': 'Bedroom' } })).not.toThrow()
  })

  test('rejects a key that is not a valid mac address', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, aliases: { 'not-a-mac': 'Bedroom' } })).toThrow()
  })

  test('normalizes lowercase mac address keys to uppercase', ({ expect }) => {
    const config = defineConfig({ ...baseConfig, aliases: { 'aa:bb:cc:dd:ee:ff': 'Bedroom' } })
    expect(config.aliases).toEqual({ 'AA:BB:CC:DD:EE:FF': 'Bedroom' })
  })
})

describe('defineConfig watchdog validation', () => {
  test('defaults both timeouts to 10 minutes', ({ expect }) => {
    expect(defineConfig(baseConfig).watchdog).toEqual({ scannerTimeout: 600_000, writerTimeout: 600_000 })
  })

  test('accepts custom timeouts', ({ expect }) => {
    const config = defineConfig({ ...baseConfig, watchdog: { scannerTimeout: 1000, writerTimeout: 400_000 } })
    expect(config.watchdog).toEqual({ scannerTimeout: 1000, writerTimeout: 400_000 })
  })

  test('keeps the default for a timeout that is not given', ({ expect }) => {
    const config = defineConfig({ ...baseConfig, watchdog: { scannerTimeout: 1000 } })
    expect(config.watchdog).toEqual({ scannerTimeout: 1000, writerTimeout: 600_000 })
  })

  test('rejects a timeout of zero', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, watchdog: { scannerTimeout: 0 } })).toThrow(/scannerTimeout/)
  })

  test('rejects a negative timeout', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, watchdog: { scannerTimeout: -1 } })).toThrow(/scannerTimeout/)
  })

  test('rejects a fractional timeout', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, watchdog: { scannerTimeout: 1.5 } })).toThrow(/scannerTimeout/)
  })
})

describe('defineConfig watchdog timeout limits', () => {
  const maxTimerDelay = 2_147_483_647

  test('accepts the largest delay setTimeout supports', ({ expect }) => {
    const config = defineConfig({
      ...baseConfig,
      watchdog: { scannerTimeout: maxTimerDelay, writerTimeout: maxTimerDelay },
    })
    expect(config.watchdog).toEqual({ scannerTimeout: maxTimerDelay, writerTimeout: maxTimerDelay })
  })

  test('rejects a scanner timeout above the largest delay setTimeout supports', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, watchdog: { scannerTimeout: maxTimerDelay + 1 } })).toThrow(
      /scannerTimeout/
    )
  })

  test('rejects a writer timeout above the largest delay setTimeout supports', ({ expect }) => {
    expect(() => defineConfig({ ...baseConfig, watchdog: { writerTimeout: maxTimerDelay + 1 } })).toThrow(
      /writerTimeout/
    )
  })
})

describe('defineConfig writer timeout relative to the flush interval', () => {
  const withTimeouts = (flushInterval: number, writerTimeout: number) =>
    defineConfig({ influxdb: { ...baseConfig.influxdb, write: { flushInterval } }, watchdog: { writerTimeout } })

  test('rejects a writer timeout shorter than the flush interval', ({ expect }) => {
    expect(() => withTimeouts(900_000, 600_000)).toThrow(/writerTimeout/)
  })

  test('rejects a writer timeout that leaves no room for InfluxDB retries', ({ expect }) => {
    expect(() => withTimeouts(60_000, 365_000)).toThrow(/retry margin/)
  })

  test('accepts a writer timeout just above the flush interval plus the retry margin', ({ expect }) => {
    expect(withTimeouts(60_000, 365_001).watchdog.writerTimeout).toBe(365_001)
  })

  test('accepts the default flush interval with the default writer timeout', ({ expect }) => {
    expect(() => defineConfig(baseConfig)).not.toThrow()
  })

  test('rejects a flush interval that makes the default writer timeout too short', ({ expect }) => {
    expect(() => defineConfig({ influxdb: { ...baseConfig.influxdb, write: { flushInterval: 300_000 } } })).toThrow(
      /writerTimeout/
    )
  })
})
