import { InfluxDB, Point } from '@influxdata/influxdb-client'
import type { ScannerEvent } from '@scanner/scanner.ts'
import { config } from 'src/config.ts'
import { z } from 'zod'

const Env = z.object({
  INFLUXDB_HOST: z.url(),
  INFLUXDB_ORG: z.string(),
  INFLUXDB_BUCKET: z.string(),
  INFLUXDB_TOKEN: z.string(),
})
const env = Env.parse(process.env)
const influxdb = new InfluxDB({ url: env.INFLUXDB_HOST, token: env.INFLUXDB_TOKEN }).getWriteApi(
  env.INFLUXDB_ORG,
  env.INFLUXDB_BUCKET,
  'ns'
)

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
