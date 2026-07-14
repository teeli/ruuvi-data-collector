import { getConfig } from '@config/config.ts'
import { getStreamFileSink } from '@logtape/file'
import type { Logger } from '@logtape/logtape'
import {
  configure,
  dispose,
  getAnsiColorFormatter,
  getConsoleSink,
  getLogger as getLogtapeLogger,
  getTextFormatter,
} from '@logtape/logtape'
import { redactByField } from '@logtape/redaction'
import { memoize } from '@util/memoize'
import { constants } from 'node:fs'
import { access, mkdir, stat } from 'node:fs/promises'
import { dirname } from 'node:path'

/**
 * Same as @logtape/redaction's DEFAULT_REDACT_FIELDS, minus /address/i: the
 * scanner logs a BLE peripheral's `address` field, which is not a secret and
 * would otherwise be stripped from logs.
 */
const SENSITIVE_FIELD_PATTERNS = [
  /pass(?:code|phrase|word)/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /signature/i,
  /sensitive/i,
  /private/i,
  /ssn/i,
  /email/i,
  /phone/i,
]

/**
 * Ensures `logFile`'s directory exists and is actually writable by the
 * current user, rather than letting a permission error surface later as a
 * silently dropped write inside the non-blocking/streaming log sinks.
 */
export const assertLogFileWritable = async (logFile: string): Promise<void> => {
  const logDir = dirname(logFile)
  await mkdir(logDir, { recursive: true })

  const logFileExists = await stat(logFile).then(
    () => true,
    () => false
  )
  const writeTarget = logFileExists ? logFile : logDir
  try {
    await access(writeTarget, constants.W_OK)
  } catch {
    throw new Error(`No write permission for the log file at "${logFile}"`)
  }
}

const configureLogger = memoize(async (): Promise<void> => {
  const config = await getConfig()

  const ansiColorFormatter = getAnsiColorFormatter({ timestamp: 'none', level: 'FULL', levelStyle: 'bold' })

  await assertLogFileWritable(config.log.file)

  await configure({
    sinks: {
      console: redactByField(getConsoleSink({ formatter: ansiColorFormatter, nonBlocking: true }), {
        fieldPatterns: SENSITIVE_FIELD_PATTERNS,
      }),
      file: redactByField(
        getStreamFileSink(config.log.file, { formatter: getTextFormatter({ timestamp: 'rfc3339', level: 'FULL' }) }),
        { fieldPatterns: SENSITIVE_FIELD_PATTERNS }
      ),
    },
    loggers: [
      { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
      { category: 'ruuvi', lowestLevel: config.log.level, sinks: ['console', 'file'] },
    ],
  })
})

export const getLogger = async (category: string | readonly string[]): Promise<Logger> => {
  await configureLogger()

  return getLogtapeLogger(category)
}

/**
 * The console sink is non-blocking and the file sink streams writes
 * asynchronously, so pending log records can still be in flight when
 * `process.exit()` is called. Await this before exiting to flush them.
 *
 * `configureLogger` is memoized, and disposing here does not reset that
 * cache — no code may call `getLogger()` again after `closeLogger()` has
 * run, since it would skip reconfiguration and return a logger bound to
 * the now-disposed sinks.
 */
export const closeLogger = async (): Promise<void> => {
  await dispose()
}
