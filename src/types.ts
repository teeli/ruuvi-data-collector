import type { ScannerAdapter } from '@scanner/types'
import type { WriterAdapter } from '@writers/types'

export type Config = { scannerConfig: { adapter: ScannerAdapter }; writerConfig: { adapter: WriterAdapter } }
