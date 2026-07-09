import { reset } from '@logtape/logtape'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, test } from 'vitest'
import { defineConfig, setConfig } from './config'
import { configureLogger } from './logger/logger'

describe('setConfig', () => {
  let logDir: string

  afterEach(async () => {
    await reset()
    rmSync(logDir, { recursive: true, force: true })
  })

  test('does not leak the InfluxDB token to debug logs', async ({ expect }) => {
    logDir = mkdtempSync(join(tmpdir(), 'ruuvi-config-test-'))
    const logFile = join(logDir, 'test.log')

    await configureLogger(
      defineConfig({
        influxdb: { org: 'dummy', bucket: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
        log: { level: 'debug', file: logFile },
      })
    )

    setConfig(
      defineConfig({
        influxdb: {
          org: 'my-org',
          bucket: 'my-bucket',
          connection: { url: 'http://influxdb:8086', token: 'super-secret-token' },
        },
        log: { level: 'debug', file: logFile },
      })
    )
    await reset()

    const contents = readFileSync(logFile, 'utf8')
    expect(contents).not.toContain('super-secret-token')
    expect(contents).toContain('my-org')
    expect(contents).toContain('my-bucket')
  })
})
