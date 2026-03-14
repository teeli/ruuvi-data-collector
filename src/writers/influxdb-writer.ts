import type { InfluxDB } from '@influxdata/influxdb-client'
import { Point } from '@influxdata/influxdb-client'
import type { ScannerEvent } from '@scanner/scanner'
import { isNil } from '@util/is-nil.ts'
import { getConfig } from '@config/config'

const tagFields = ['dataFormat', 'address']
const ignoreFields = ['calibration']
const lastSequence: Record<string, number> = {}

type HandleEvent = (event: ScannerEvent) => Promise<void>
type InfluxDbWriterConfig = { client: InfluxDB }
type InfluxDbWriter = (config: InfluxDbWriterConfig) => { handleEvent: HandleEvent }

export const createWriter: InfluxDbWriter = ({ client }) => {
  const config = getConfig()
  const influxDb = client.getWriteApi(config.influxdb.org, config.influxdb.bucket, 'ns')

  const handleEvent: HandleEvent = async (event) => {
    const { address, sequence } = event.data

    if (lastSequence[address] && lastSequence[address] === sequence) {
      // data has already been received, don't write it again
      return
    }

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
    console.log(` ${point.toLineProtocol(influxDb)}`)
    await influxDb.flush()
  }

  return { handleEvent }
}
