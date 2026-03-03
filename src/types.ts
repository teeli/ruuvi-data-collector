import type { ScannerAdapter } from '@scanner/types'
import type { WriterAdapter } from '@writers/types'

export type ScannerConfig = {
  /**
   * Scanner adapter to use (e.g. BLEAdapter)
   */
  adapter: ScannerAdapter
}

export type WriterConfig = {
  /**
   * Writer adapter to use (e.g. ConsoleWriter)
   */
  adapter: WriterAdapter
}

export type Config = {
  scannerConfig: ScannerConfig
  writerConfig: WriterConfig

  /**
   * Device aliases as key value pairs
   * key: address
   * value: alias
   *
   * @example {'ff:ff:ff': 'Bedroom'}
   */
  aliases?: Record<string, string>
}
