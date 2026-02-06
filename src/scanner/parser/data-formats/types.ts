import type { ScannerAdapterDataEvent, RuuviMeasurement } from '@scanner/types'
import type { ScannerConfig } from 'src/types.ts'

export type ParseDataFormat<T extends RuuviMeasurement> = (
  data: ScannerAdapterDataEvent['data'],
  aliases?: ScannerConfig['aliases']
) => T
