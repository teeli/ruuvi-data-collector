import { getConfig } from '@config/config'
import type { InfluxDB } from '@influxdata/influxdb-client'
import { Point } from '@influxdata/influxdb-client'
import { getLogger } from '@logger/logger'
import type { ScannerEvent } from '@scanner/scanner'
import { isNil } from '@util/is-nil.ts'

const tagFields = ['dataFormat', 'address']
const ignoreFields = ['calibration']
const lastSequence: Record<string, number | undefined> = {}

type HandleEvent = (event: ScannerEvent) => Promise<void>
type CloseWriter = () => Promise<void>
type InfluxDbWriterConfig = { client: InfluxDB }
type InfluxDbWriter = (config: InfluxDbWriterConfig) => Promise<{ handleEvent: HandleEvent; close: CloseWriter }>

export const createWriter: InfluxDbWriter = async ({ client }) => {
  const logger = await getLogger(['ruuvi', 'writer'])
  logger.info(`Initializing InfluxDB writer...`)

  const config = await getConfig()
  const influxDb = client.getWriteApi(config.influxdb.org, config.influxdb.bucket, 'ns', config.influxdb.write)

  const handleEvent: HandleEvent = async (event) => {
    const { address, sequence } = event.data

    if (isNil(address)) {
      logger.warn('Skipping event with no address', { event })
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

    if (config?.aliases?.[address]) {
      point.tag('alias', config?.aliases?.[address])
    }

    influxDb.writePoint(point)
    logger.debug(`Wrote Point to InfluxDB: ${point.toLineProtocol(influxDb)}`)
  }

  const close: CloseWriter = async () => {
    logger.info('Closing InfluxDB writer...')
    await influxDb.close()
  }

  return { handleEvent, close }
}
