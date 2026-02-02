import type { ScannerAdapterDataEvent, RuuviMeasurement } from '@scanner/types'

export type ParseDataFormat<T extends RuuviMeasurement> = (data: ScannerAdapterDataEvent['data']) => T
