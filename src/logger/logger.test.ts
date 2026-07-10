import { defineConfig, setConfig } from '@config/config'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, test } from 'vitest'
import { getLogger } from './logger'

describe('logger', () => {
  const logDir: string = mkdtempSync(join(tmpdir(), 'ruuvi-logger-test-'))
  const logFile = join(logDir, 'test.log')

  beforeAll(() => {
    setConfig(
      defineConfig({
        influxdb: { org: 'dummy', bucket: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
        log: { level: 'debug', file: logFile },
      })
    )
  })

  afterAll(async () => {
    rmSync(logDir, { recursive: true, force: true })
  })

  test('redacts sensitive fields but keeps non-sensitive ones in the log file', async ({ expect }) => {
    const logger = await getLogger(['ruuvi', 'test'])

    logger.info('test message {token} {note} {address}', {
      token: 'super-secret-value',
      note: 'ok',
      address: 'AA:BB:CC:DD:EE:FF',
    })

    const readLogFile = () => (existsSync(logFile) ? readFileSync(logFile, 'utf8') : '')

    /* the file sink buffers writes, so poll until the write has landed instead of reading immediately */
    await expect.poll(readLogFile).toContain('ok')

    const contents = readLogFile()
    expect(contents).not.toContain('super-secret-value')
    expect(contents).toContain('AA:BB:CC:DD:EE:FF')
  })
})
