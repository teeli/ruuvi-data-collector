import { createInfluxDbClient } from '@clients/influxdb-client'
import { closeLogger, getLogger } from '@logger/logger'
import { scanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'

const [logger, influxDbClient] = await Promise.all([getLogger(['ruuvi']), createInfluxDbClient()])
logger.info('Starting Ruuvi data collector...')

const writer = await createWriter({ client: influxDbClient })

let shuttingDown = false
const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return
  }
  shuttingDown = true

  logger.info(`Received {signal}, shutting down...`, { signal })

  await writer.close()
  await closeLogger()

  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

await scanner({ onEvent: writer.handleEvent })
