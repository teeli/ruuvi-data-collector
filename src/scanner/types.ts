import type { DataFormat } from '@scanner/parser/parser'
import type { ScannerConfig } from 'src/types.ts'

export type ScannerAdapterDataEvent = { data: Buffer }
export type ScannerAdapterDiscoverEvent = { address: string }
type ScannerAdapterParams = {
  onDiscover?: (event: ScannerAdapterDiscoverEvent) => void
  onData: (event: ScannerAdapterDataEvent) => void
}
export type ScannerAdapter = (params: ScannerAdapterParams) => Promise<void>

type ScannerEventMetadata = { dataFormat: DataFormat; timestamp: Date }
export type ScannerEvent =
  | { metadata: ScannerEventMetadata & { eventType: 'RuuviAir' }; data: RuuviAir }
  | { metadata: ScannerEventMetadata & { eventType: 'RuuviTag' }; data: RuuviTag }

type ScannerParams = { config: ScannerConfig; onEvent: (event: ScannerEvent) => void }
export type Scanner = (params: ScannerParams) => void

type RuuviCommon = { sequence: number; address: string; alias: string | undefined }

export type RuuviTag = RuuviCommon & {
  temperature: number
  pressure: number
  humidity: number
  acceleration: { x: number; y: number; z: number }
  txPower: number
  voltage: number
  movement: number
}

export type RuuviAir = RuuviCommon & {
  calibration: boolean
  temperature: number
  pressure: number
  humidity: number
  pm: { '1.0'?: number; '2.5': number; '4.0'?: number; '10.0'?: number }
  co2: number
  voc: number
  nox: number
  luminosity: number
}

export type RuuviMeasurement = RuuviTag | RuuviAir
