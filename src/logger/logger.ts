import { getConfig } from '@config/config.ts'
import { getStreamFileSink } from '@logtape/file'
import type { Logger } from '@logtape/logtape'
import {
  configure,
  getAnsiColorFormatter,
  getConsoleSink,
  getLogger as getLogtapeLogger,
  getTextFormatter,
} from '@logtape/logtape'
import { redactByField } from '@logtape/redaction'
import { memoize } from '@util/memoize'

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

const configureLogger = memoize(async (): Promise<void> => {
  const config = await getConfig()

  const ansiColorFormatter = getAnsiColorFormatter({
    timestamp: 'rfc3339',
    timestampColor: 'green',
    timestampStyle: null,
    level: 'FULL',
    levelStyle: 'bold',
  })

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
  await configureLogger.get()

  return getLogtapeLogger(category)
}
