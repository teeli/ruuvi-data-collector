import { z } from 'zod'
import { getLogger, getLogLevels } from '@logtape/logtape'

const logger = getLogger(['ruuvi', 'config'])

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

let _config: Config

export const defineConfig = (config: ConfigInput): Config => ConfigSchema.parse(config)

export const setConfig = (config: Config): void => {
  logger.debug('Set config', { config })
  _config = config
}
export const getConfig = (): Config => _config
