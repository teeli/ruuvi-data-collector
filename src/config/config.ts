import { z } from 'zod'
import { getLogLevels } from '@logtape/logtape'
import { memoize } from '@util/memoize'

const ConfigSchema = z.object({
  influxdb: z.object({
    connection: z.object({ url: z.url().prefault('http://localhost:8086'), token: z.string() }),
    org: z.string(),
    bucket: z.string(),
  }),
  // TODO: Add validation for Ruuvi's short mac format
  aliases: z.record(z.string(), z.string()).optional(),
  log: z
    .object({ level: z.enum(getLogLevels()).prefault('info'), file: z.string().prefault('ruuvi-data-collector.log') })
    .optional()
    .prefault({}),
})

export type ConfigInput = z.input<typeof ConfigSchema>
export type Config = z.output<typeof ConfigSchema>

export const defineConfig = (config: ConfigInput): Config => ConfigSchema.parse(config)

const loadConfig = memoize(async (): Promise<Config> => {
  const { default: rawConfig } = await import('../../config')
  return defineConfig(rawConfig)
})

export const getConfig = (): Promise<Config> => loadConfig.get()
