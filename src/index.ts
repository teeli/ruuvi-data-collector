import '@config/init'
import { scanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'
import { influxdb } from '@clients/influxdb-client'
import { getLogger } from '@logtape/logtape'

const logger = getLogger(['ruuvi'])
logger.info('Starting...')

const writer = createWriter({ client: influxdb })

await scanner({ onEvent: writer.handleEvent })
