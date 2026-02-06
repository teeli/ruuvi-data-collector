import { parseDataFormat5 } from '@scanner/parser/data-formats/parseDataFormat5'
import { parseDataFormat6 } from '@scanner/parser/data-formats/parseDataFormat6'
import { parseDataFormatE1 } from '@scanner/parser/data-formats/parseDataFormatE1'
import {
  DATA_FORMAT_5,
  DATA_FORMAT_6,
  DATA_FORMAT_E1,
  DATA_FORMAT_INDEX,
  SUPPORTED_DATA_FORMATS,
} from '@scanner/parser/data-formats/constants'

export type DataFormat = (typeof SUPPORTED_DATA_FORMATS)[number]

import type { ScannerAdapterDataEvent, ScannerEvent } from 'src/scanner/types'
import type { ScannerConfig } from 'src/types.ts'

export const parser = (event: ScannerAdapterDataEvent, config: ScannerConfig): ScannerEvent => {
  const dataFormat = event.data.readUInt8(DATA_FORMAT_INDEX)

  if (isValidDataFormat(dataFormat)) {
    switch (dataFormat) {
      case DATA_FORMAT_5:
        return {
          metadata: { eventType: 'RuuviTag', dataFormat: dataFormat, timestamp: new Date() },
          data: parseDataFormat5(event.data, config.aliases),
        }
      case DATA_FORMAT_6:
        return {
          metadata: { eventType: 'RuuviAir', dataFormat: dataFormat, timestamp: new Date() },
          data: parseDataFormat6(event.data, config.aliases),
        }
      case DATA_FORMAT_E1:
        return {
          metadata: { eventType: 'RuuviAir', dataFormat: dataFormat, timestamp: new Date() },
          data: parseDataFormatE1(event.data, config.aliases),
        }
      default:
        assertUnreachable(dataFormat)
    }
  }

  throw new Error(`Input data format ${dataFormat} not supported`)
}

const isValidDataFormat = (dataFormat: number): dataFormat is DataFormat =>
  SUPPORTED_DATA_FORMATS.includes(dataFormat as DataFormat)

const assertUnreachable = (_value: never): never => {
  throw new Error('Statement should be unreachable')
}
