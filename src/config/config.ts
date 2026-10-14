import { getLogLevels } from '@logtape/logtape'
import { memoize } from '@util/memoize'
import { z } from 'zod'

/* Largest delay setTimeout supports, anything above is silently turned into 1 ms */
const MAX_TIMER_DELAY_MS = 2_147_483_647

/* InfluxDB client's default maxRetryTime (180 s) + maxRetryDelay (125 s) */
const WRITE_RETRY_MARGIN_MS = 305_000

const ConfigSchema = z
  .object({
    influxdb: z.object({
      connection: z.object({ url: z.url().prefault('http://localhost:8086'), token: z.string() }),
      org: z.string(),
      bucket: z.string(),
      write: z
        .object({
          batchSize: z.number().int().positive().prefault(1000),
          flushInterval: z.number().int().positive().prefault(60000),
        })
        .prefault({}),
    }),
    aliases: z
      .record(
        z.mac().transform((value) => value.toUpperCase()),
        z.string()
      )
      .optional(),
    /* Timeouts (ms) after which a silent scanner or writer is considered stalled and the process exits */
    watchdog: z
      .object({
        scannerTimeout: z.number().int().positive().max(MAX_TIMER_DELAY_MS).prefault(600_000),
        writerTimeout: z.number().int().positive().max(MAX_TIMER_DELAY_MS).prefault(600_000),
      })
      .prefault({}),
    log: z
      .object({
        level: z.enum(getLogLevels()).prefault('info'),
        file: z.string().prefault('logs/ruuvi-data-collector.log'),
      })
      .prefault({}),
  })
  .refine(({ watchdog, influxdb }) => watchdog.writerTimeout > influxdb.write.flushInterval + WRITE_RETRY_MARGIN_MS, {
    error: `watchdog.writerTimeout must exceed influxdb.write.flushInterval by more than ${WRITE_RETRY_MARGIN_MS} ms (InfluxDB retry margin)`,
    path: ['watchdog', 'writerTimeout'],
  })

export type ConfigInput = z.input<typeof ConfigSchema>
export type Config = z.output<typeof ConfigSchema>

export const defineConfig = (config: ConfigInput): Config => ConfigSchema.parse(config)

const loadConfig = memoize(async (): Promise<Config> => {
  const { default: rawConfig } = await import('../../config')
  return defineConfig(rawConfig)
})

export const getConfig = (): Promise<Config> => loadConfig()
