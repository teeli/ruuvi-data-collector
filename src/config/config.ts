import type { Config } from '@config/schema'
import { ConfigSchema } from '@config/schema'

export const defineConfig = (config: Config) => {
  return ConfigSchema.parse(config)
}
