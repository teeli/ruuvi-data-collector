import { InfluxDB } from '@influxdata/influxdb-client'
import config from 'config*'

export const influxdb = new InfluxDB(config.influxdb.connection)
