import { createInfluxDbClient } from '@clients/influxdb-client'
import { getLogger } from '@logger/logger'
import { scanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'

const [logger, influxDbClient] = await Promise.all([getLogger(['ruuvi']), createInfluxDbClient()])
logger.info('Starting...')

const writer = await createWriter({ client: influxDbClient })

await scanner({ onEvent: writer.handleEvent })
