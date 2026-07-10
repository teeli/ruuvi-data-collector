import { describe, test } from 'vitest'
import { defineConfig, getConfig, setConfig } from './config'

describe('getConfig', () => {
  test('returns the config set via setConfig', async ({ expect }) => {
    const config = defineConfig({
      influxdb: { org: 'my-org', bucket: 'my-bucket', connection: { url: 'http://influxdb:8086', token: 'my-token' } },
    })
    setConfig(config)

    await expect(getConfig()).resolves.toBe(config)
  })

  test('memoizes the config across repeated calls', async ({ expect }) => {
    const config = defineConfig({
      influxdb: {
        org: 'memo-org',
        bucket: 'memo-bucket',
        connection: { url: 'http://influxdb:8086', token: 'memo-token' },
      },
    })
    setConfig(config)

    const [first, second] = await Promise.all([getConfig(), getConfig()])
    expect(first).toBe(second)
  })
})
