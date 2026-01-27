import type { Parser } from './types'
import { parseDataFormat5 } from './data-formats/parseDataFormat5'
import { parseDataFormat6 } from './data-formats/parseDataFormat6'
import { parseDataFormatE1 } from './data-formats/parseDataFormatE1'
import {
  DATA_FORMAT_5,
  DATA_FORMAT_6,
  DATA_FORMAT_E1,
  DATA_FORMAT_INDEX,
  SUPPORTED_DATA_FORMATS,
  type DataFormat,
} from './constants'
import type { EventType } from '../scanners/types'

const PARSERS = {
  [DATA_FORMAT_5]: parseDataFormat5,
  [DATA_FORMAT_6]: parseDataFormat6,
  [DATA_FORMAT_E1]: parseDataFormatE1,
} as const
const RUUVI_AIR_DATA_FORMATS = [DATA_FORMAT_6, DATA_FORMAT_E1] as const

export const ruuviDataParser: Parser = (event) => {
  const dataFormat = event.data.readUInt8(DATA_FORMAT_INDEX)

  if (!isValidDataFormat(dataFormat)) {
    throw new Error(`Input data format ${dataFormat} not supported`)
  }

  const data = PARSERS[dataFormat](event.data)
  const eventType: EventType = RUUVI_AIR_DATA_FORMATS.includes(dataFormat) ? 'RuuviAir' : 'RuuviTag'
  return { metadata: { eventType, timestamp: Date.now() }, data }
}

const isValidDataFormat = (dataFormat: number): dataFormat is DataFormat =>
  SUPPORTED_DATA_FORMATS.includes(dataFormat as DataFormat)
