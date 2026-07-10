import { defineConfig } from '@config/config'
import { getLogger, reset } from '@logtape/logtape'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, test } from 'vitest'
import { configureLogger } from './logger'

describe('configureLogger', () => {
  let logDir: string

  afterEach(async () => {
    await reset()
    rmSync(logDir, { recursive: true, force: true })
  })

  test('redacts sensitive fields but keeps non-sensitive ones in the log file', async ({ expect }) => {
    logDir = mkdtempSync(join(tmpdir(), 'ruuvi-logger-test-'))
    const logFile = join(logDir, 'test.log')

    const config = defineConfig({
      influxdb: { org: 'dummy', bucket: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
      log: { level: 'debug', file: logFile },
    })
    await configureLogger(config)

    getLogger(['ruuvi', 'test']).info('test message {token} {note} {address}', {
      token: 'super-secret-value',
      note: 'ok',
      address: 'AA:BB:CC:DD:EE:FF',
    })
    await reset()

    const contents = readFileSync(logFile, 'utf8')
    expect(contents).not.toContain('super-secret-value')
    expect(contents).toContain('ok')
    expect(contents).toContain('AA:BB:CC:DD:EE:FF')
  })
})
