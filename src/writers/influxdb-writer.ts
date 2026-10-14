import { getConfig } from '@config/config'
import { resolveAlias } from '@config/resolve-alias'
import type { InfluxDB } from '@influxdata/influxdb-client'
import { Point } from '@influxdata/influxdb-client'
import { getLogger } from '@logger/logger'
import type { ScannerEvent } from '@scanner/scanner'
import { isNil } from '@util/is-nil.ts'
import { createWatchdog } from '@util/watchdog'

const tagFields = ['dataFormat', 'address']
const ignoreFields = ['calibration']

export interface Writer {
  handleEvent: (event: ScannerEvent) => Promise<void>
  close: () => Promise<void>
}

type WriterConfig = {
  client: InfluxDB
  /* Called when buffered points have not been successfully written within the configured watchdog timeout */
  onStall?: () => void
}
type CreateWriter = (writerConfig: WriterConfig) => Promise<Writer>

export const createWriter: CreateWriter = async ({ client, onStall }) => {
  const logger = await getLogger(['ruuvi', 'influxdb-writer'])
  logger.info(`Initializing InfluxDB writer...`)

  const config = await getConfig()
  const { writerTimeout } = config.watchdog

  /* Armed when a point is buffered, stopped when a write succeeds */
  const watchdog = createWatchdog({
    timeoutMs: writerTimeout,
    onTimeout: () => {
      logger.error('Writer stalled: buffered points not written to InfluxDB in {timeout} ms', {
        timeout: writerTimeout,
      })
      onStall?.()
    },
  })

  const influxDb = client.getWriteApi(config.influxdb.org, config.influxdb.bucket, 'ns', {
    ...config.influxdb.write,
    writeSuccess: (lines) => {
      watchdog.stop()
      logger.debug('Wrote {count} line(s) to InfluxDB', { count: lines.length })
    },
    writeFailed: (error, lines, attempt) => {
      logger.error('InfluxDB write failed (attempt {attempt}, {count} line(s)): {error}', {
        attempt,
        count: lines.length,
        error,
      })
    },
    writeRetrySkipped: ({ lines }) => {
      logger.warn('Dropped {count} line(s) from the InfluxDB retry buffer', { count: lines.length })
    },
  })
  const lastSequence: Record<string, number | undefined> = {}

  const handleEvent: Writer['handleEvent'] = async (event) => {
    logger.debug('Received event (address: {event.data.address}, sequence: {event.data.sequence})', { event })
    const { address, sequence } = event.data

    if (isNil(address)) {
      logger.warn('Skipping event with no address: {event}', { event })
      return
    }

    if (!isNil(lastSequence[address]) && lastSequence[address] === sequence) {
      // data has already been received, don't write it again
      return
    }

    lastSequence[address] = sequence

    const point = Object.entries(event.data).reduce((point, [key, value]) => {
      if (ignoreFields.includes(key) || isNil(value)) {
        return point
      }
      if (tagFields.includes(key)) {
        return point.tag(key, value.toString())
      }

      return point.floatField(key, value)
    }, new Point('ruuvi_measurement'))

    if (!isNil(event.metadata.rssi)) {
      point.floatField('rssi', event.metadata.rssi)
    }

    const alias = await resolveAlias(address)
    if (alias) {
      point.tag('alias', alias)
    }

    influxDb.writePoint(point)
    watchdog.arm()
    logger.debug(`Wrote Point to InfluxDB: {point}`, { point: point.toLineProtocol(influxDb) })
  }

  const close: Writer['close'] = async () => {
    logger.info('Closing InfluxDB writer...')
    watchdog.stop()
    await influxDb.close()
  }

  return { handleEvent, close }
}
