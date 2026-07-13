import { getConfig } from '@config/config'
import { InfluxDB } from '@influxdata/influxdb-client'
import { getLogger } from '@logger/logger'

export const createInfluxDbClient = async (): Promise<InfluxDB> => {
  const logger = await getLogger(['ruuvi', 'influx-db-client'])
  logger.debug('Creating influx db client...')
  const config = await getConfig()
  return new InfluxDB(config.influxdb.connection)
}
