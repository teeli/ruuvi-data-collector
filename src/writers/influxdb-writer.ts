import { InfluxDB, Point } from '@influxdata/influxdb-client'
import type { ScannerEvent } from '@scanner/scanner.ts'
import config from 'config'

const influxdb = new InfluxDB(config.influxdb.connection).getWriteApi(config.influxdb.org, config.influxdb.bucket, 'ns')

const ignoreFields = ['dataFormat', 'address', 'sequence', 'calibration']

const lastSequence: Record<string, number> = {}

export const handleEvent = async (event: ScannerEvent) => {
  const { address, sequence } = event.data
  const alias = config?.aliases?.[address]

  if (lastSequence[address] && lastSequence[address] === sequence) {
    // sample has already been received
    return
  }

  const points = Object.entries(event.data)
    .filter(([key]) => !ignoreFields.includes(key))
    .map(([key, value]) => {
      const point = new Point(key).tag('address', address)

      if (alias) {
        point.tag('alias', alias)
      }

      point.floatField('value', value)

      console.log(` ${point.toLineProtocol(influxdb)}`)
      return point
    })

  influxdb.writePoints(points)
  await influxdb.flush()
}
