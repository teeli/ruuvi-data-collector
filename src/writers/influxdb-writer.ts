import { InfluxDB, Point } from '@influxdata/influxdb-client'
import type { ScannerEvent } from '@scanner/scanner'
import config from 'config'

const influxdb = new InfluxDB(config.influxdb.connection).getWriteApi(config.influxdb.org, config.influxdb.bucket, 'ns')

const tagFields = ['dataFormat', 'address']
const ignoreFields = ['calibration']

const lastSequence: Record<string, number> = {}

const isUndef = <T>(val: T | undefined): val is undefined => val === undefined

export const handleEvent = async (event: ScannerEvent) => {
  const { address, sequence } = event.data

  if (lastSequence[address] && lastSequence[address] === sequence) {
    // data has already been received, don't write it again
    return
  }

  const point = Object.entries(event.data).reduce((point, [key, value]) => {
    if (ignoreFields.includes(key) || isUndef(value)) {
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

  influxdb.writePoint(point)
  console.log(` ${point.toLineProtocol(influxdb)}`)
  await influxdb.flush()
}
