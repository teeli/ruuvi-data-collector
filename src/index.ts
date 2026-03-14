import '../config'
import { scanner } from '@scanner/scanner'
import { createWriter } from '@writers/influxdb-writer'
import { influxdb } from '@clients/influxdb-client'

const writer = createWriter({ client: influxdb })

void scanner({ onEvent: writer.handleEvent })
