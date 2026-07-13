import { existsSync, readFileSync } from 'node:fs'
import { describe, test } from 'vitest'
import { testLogFile } from '../testing/test-config'
import { closeLogger, getLogger } from './logger'

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

  /* must run last: closeLogger() disposes the shared sinks for the rest of this file */
  test('flushes pending writes when closed', async ({ expect }) => {
    const logger = await getLogger(['ruuvi', 'test-close'])
    logger.info('flushed on close')

    await closeLogger()

    const contents = existsSync(testLogFile) ? readFileSync(testLogFile, 'utf8') : ''
    expect(contents).toContain('flushed on close')
  })
})
