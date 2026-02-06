import type { Config } from './types'
import { ble } from '@scanner/adapters/ble'
import { consoleWriter } from '@writers/console-writer'

export const config: Config = { scannerConfig: { adapter: ble, aliases: {} }, writerConfig: { adapter: consoleWriter } }
