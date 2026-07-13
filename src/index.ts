import { createInfluxDbClient } from '@clients/influxdb-client'
import { closeLogger, getLogger } from '@logger/logger'
import { createScanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'

const [logger, influxDbClient] = await Promise.all([getLogger(['ruuvi']), createInfluxDbClient()])
logger.info('Starting Ruuvi data collector...')

const writer = await createWriter({ client: influxDbClient })
const scanner = await createScanner({ onEvent: writer.handleEvent })
await scanner.start()

let shuttingDown = false
const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return
  }
  shuttingDown = true

  logger.info(`Received {signal}, shutting down...`, { signal })

  try {
    await scanner.close()
    await writer.close()
    await closeLogger()
    process.exit(0)
  } catch (error) {
    logger.error('Shutdown failed {error}', { error })
    process.exit(1)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
