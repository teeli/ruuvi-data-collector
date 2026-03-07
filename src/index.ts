import { scanner } from '@scanner/scanner'
import * as influxDbWriter from '@writers/influxdb-writer'

void scanner({ onEvent: influxDbWriter.handleEvent })
