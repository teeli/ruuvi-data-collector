import { z } from 'zod'

export const ConfigSchema = z.object({
  influxdb: z.object({
    connection: z.object({ url: z.url().optional().default('http://localhost:8086'), token: z.string() }),
    org: z.string(),
    bucket: z.string(),
  }),
  // TODO: Add validation for Ruuvi's short mac format
  aliases: z.record(z.string(), z.string()).optional(),
})

export type Config = z.infer<typeof ConfigSchema>
