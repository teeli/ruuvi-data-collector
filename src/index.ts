import { createInfluxDbClient } from '@clients/influxdb-client'
import { getLogger } from '@logger/logger'
import { scanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'

const logger = await getLogger(['ruuvi'])
logger.info('Starting...')

const writer = await createWriter({ client: await createInfluxDbClient() })

await scanner({ onEvent: writer.handleEvent })
