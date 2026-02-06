import type { RuuviMeasurement, ScannerEvent } from '@scanner/types.ts'

export type WriterAdapter = (event: ScannerEvent) => void
