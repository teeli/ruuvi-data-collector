import type { ScannerAdapterDataEvent, ScannerEvent } from '../scanners/types'

export type Parse<T extends RuuviMeasurement> = (data: Buffer) => T

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

export type Parser = (event: ScannerAdapterDataEvent) => ScannerEvent
