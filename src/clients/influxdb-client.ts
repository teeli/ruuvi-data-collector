import { InfluxDB } from '@influxdata/influxdb-client'
import { getConfig } from '@config/config'

export const createInfluxDbClient = async (): Promise<InfluxDB> => {
  const config = await getConfig()
  return new InfluxDB(config.influxdb.connection)
}
