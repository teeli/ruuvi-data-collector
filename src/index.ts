import { createInfluxDbClient } from '@clients/influxdb-client'
import { closeLogger, getLogger } from '@logger/logger'
import type { Scanner } from '@scanner/scanner'
import { createScanner } from '@scanner/scanner'
import type { Writer } from '@writers/influxdb-writer'
import { createWriter } from '@writers/influxdb-writer'

const FORCE_EXIT_TIMEOUT_MS = 10_000

const logger = await getLogger(['ruuvi'])
logger.info('Starting Ruuvi data collector...')

/* Shutdown handling is set up before anything starts, so it also works if a watchdog fires during startup */
let writer: Writer | undefined
let scanner: Scanner | undefined

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

  if (error) {
    /* A stalled BLE stack or writer may never let the graceful shutdown finish */
    setTimeout(() => process.exit(1), FORCE_EXIT_TIMEOUT_MS)
  }

  try {
    await scanner?.close()
    await writer?.close()
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

/* Exit with an error so the service manager restarts the process */
const onStall = (source: string) => () => void shutdown(`${source} watchdog timeout`, new Error(`${source} stalled`))

writer = await createWriter({ client: await createInfluxDbClient(), onStall: onStall('writer') })
scanner = await createScanner({ onEvent: writer.handleEvent, onStall: onStall('scanner') })
await scanner.start()
