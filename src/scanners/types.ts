import type { Parser, RuuviMeasurement } from '../parser/types'

export type ScannerAdapterDataEvent = { data: Buffer }
type ScannerAdapterParams = { onData: (event: ScannerAdapterDataEvent) => void }
export type ScannerAdapter = (params: ScannerAdapterParams) => Promise<void>

export type EventType = 'RuuviTag' | 'RuuviAir'
export type ScannerEvent = {
  metadata: {
    eventType: EventType
    // TODO: define data format type
    // dataFormat: never
    // timestamp in ms
    timestamp: number
  }
  data: RuuviMeasurement
}
type ScannerParams = { parser: Parser; adapter: ScannerAdapter; onEvent: (event: ScannerEvent) => void }

export type Scanner = (params: ScannerParams) => void
