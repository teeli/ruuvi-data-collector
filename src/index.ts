import { createInfluxDbClient } from '@clients/influxdb-client'
import { closeLogger, getLogger } from '@logger/logger'
import { createScanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'

const logger = await getLogger(['ruuvi'])
logger.info('Starting Ruuvi data collector...')

const writer = await createWriter({ client: await createInfluxDbClient() })
const scanner = await createScanner({ onEvent: writer.handleEvent })
await scanner.start()

let shuttingDown = false
const shutdown = async (reason: string, error?: unknown): Promise<void> => {
  if (shuttingDown) {
    return
  }
  shuttingDown = true

  if (error) {
    logger.error(`Shutting down after {reason} {error}`, { reason, error })
  } else {
    logger.info(`Received {reason}, shutting down...`, { reason })
  }

  try {
    await scanner.close()
    await writer.close()
    await closeLogger()
    process.exit(error ? 1 : 0)
  } catch (shutdownError) {
    logger.error('Shutdown failed {error}', { error: shutdownError })
    process.exit(1)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('uncaughtException', (error) => void shutdown('uncaughtException', error))
process.on('unhandledRejection', (error) => void shutdown('unhandledRejection', error))
