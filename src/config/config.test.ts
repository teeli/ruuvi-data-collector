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
