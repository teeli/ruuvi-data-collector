import { existsSync, readFileSync } from 'node:fs'
import { chmod, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'vitest'
import { testLogFile } from '../testing/test-config'
import { assertLogFileWritable, closeLogger, getLogger } from './logger'

describe('logger', () => {
  test('redacts sensitive fields but keeps non-sensitive ones in the log file', async ({ expect }) => {
    const logger = await getLogger(['ruuvi', 'test'])

    logger.info('test message {token} {note} {address}', {
      token: 'super-secret-value',
      note: 'ok',
      address: 'AA:BB:CC:DD:EE:FF',
    })

    const readLogFile = () => (existsSync(testLogFile) ? readFileSync(testLogFile, 'utf8') : '')

    /* the file sink buffers writes, so poll until the write has landed instead of reading immediately */
    await expect.poll(readLogFile).toContain('ok')

    const contents = readLogFile()
    expect(contents).not.toContain('super-secret-value')
    expect(contents).toContain('AA:BB:CC:DD:EE:FF')
  })

  test('assertLogFileWritable throws when the log directory is not writable', async ({ expect }) => {
    const readOnlyDir = await mkdtemp(join(tmpdir(), 'ruuvi-readonly-'))
    await chmod(readOnlyDir, 0o555)

    try {
      await expect(assertLogFileWritable(join(readOnlyDir, 'test.log'))).rejects.toThrow(/No write permission/)
    } finally {
      await chmod(readOnlyDir, 0o755)
      await rm(readOnlyDir, { recursive: true, force: true })
    }
  })

  /* must run last: closeLogger() disposes the shared sinks for the rest of this file */
  test('flushes pending writes when closed', async ({ expect }) => {
    const logger = await getLogger(['ruuvi', 'test-close'])
    logger.info('flushed on close')

    await closeLogger()

    const contents = existsSync(testLogFile) ? readFileSync(testLogFile, 'utf8') : ''
    expect(contents).toContain('flushed on close')
  })
})
