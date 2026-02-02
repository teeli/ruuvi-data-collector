import type { DataFormat } from '@scanner/parser/parser'

export type ScannerAdapterDataEvent = { data: Buffer }
type ScannerAdapterParams = { onData: (event: ScannerAdapterDataEvent) => void }
export type ScannerAdapter = (params: ScannerAdapterParams) => Promise<void>

type ScannerEventMetadata = { dataFormat: DataFormat; timestamp: Date }
export type ScannerEvent =
  | { metadata: ScannerEventMetadata & { eventType: 'RuuviAir' }; data: RuuviAir }
  | { metadata: ScannerEventMetadata & { eventType: 'RuuviTag' }; data: RuuviTag }

type ScannerParams = { adapter: ScannerAdapter; onEvent: (event: ScannerEvent) => void }
export type Scanner = (params: ScannerParams) => void

export type RuuviTag = {
  temperature: number
  pressure: number
  humidity: number
  acceleration: { x: number; y: number; z: number }
  txPower: number
  voltage: number
  movement: number
  sequence: number
  mac: string | undefined
}

export type RuuviAir = {
  calibration: boolean
  temperature: number
  pressure: number
  humidity: number
  pm: { '1.0'?: number; '2.5': number; '4.0'?: number; '10.0'?: number }
  co2: number
  voc: number
  nox: number
  luminosity: number
  sequence: number
  mac: string | undefined
}

export type RuuviMeasurement = RuuviTag | RuuviAir
