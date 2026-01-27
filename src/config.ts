import type { Config } from './types'
import { BLEAdapter } from './scanners/ble-scanner/ble-scanner'
import { consoleWriter } from './writers/console-writer/console-writer'

export const config: Config = { scannerConfig: { adapter: BLEAdapter }, writerConfig: { adapter: consoleWriter } }
