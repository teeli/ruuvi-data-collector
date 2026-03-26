import type { Config } from '@config/config.ts'
import { getStreamFileSink } from '@logtape/file'
import { configure, getConsoleSink, getAnsiColorFormatter, getTextFormatter } from '@logtape/logtape'

export const configureLogger = async (config: Config): Promise<void> => {
  const ansiColorFormatter = getAnsiColorFormatter({
    timestamp: 'rfc3339',
    timestampColor: 'green',
    timestampStyle: null,
    level: 'FULL',
    levelStyle: 'bold',
  })

  await configure({
    sinks: {
      console: getConsoleSink({ formatter: ansiColorFormatter, nonBlocking: true }),
      file: getStreamFileSink(config.log.file, {
        formatter: getTextFormatter({ timestamp: 'rfc3339', level: 'FULL' }),
      }),
    },
    loggers: [
      { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
      { category: 'ruuvi', lowestLevel: config.log.level, sinks: ['console', 'file'] },
    ],
  })
}
