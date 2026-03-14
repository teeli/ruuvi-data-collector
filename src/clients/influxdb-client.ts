import { InfluxDB } from '@influxdata/influxdb-client'
import { getConfig } from '@config/config'

const config = getConfig()

export const influxdb = new InfluxDB(config.influxdb.connection)
