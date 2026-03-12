import * as z from 'zod'

export const DATA_FORMAT_5 = '5' as const
export const DATA_FORMAT_6 = '6' as const
export const DATA_FORMAT_E1 = 'E1' as const

const isUndef = <T>(val: T | undefined): val is undefined => val === undefined

const byte = (byteLength: number, unsigned: boolean = false) => {
  const length = 2 ** byteLength
  const max = unsigned ? length : length / 2
  const min = unsigned ? 0 : 1 - max
  return z
    .int()
    .min(min)
    .max(max)
    .transform((value) => (value === max ? undefined : value))
}

const macCodec = z.codec(z.number(), z.string(), {
  decode: (value) => value.toString(16).toUpperCase().match(/.{2}/g)?.join(':') ?? value.toString(16),
  encode: (value) => parseInt(value.split(':').join(''), 16),
})

const txPowerCodec = z.codec(z.number().min(0).max(31), z.number().min(-40).max(22).optional(), {
  decode: (value) => (value === 31 ? undefined : value * 2 - 40),
  encode: (value) => (isUndef(value) ? 31 : (value + 40) / 2),
})

const voltageCodec = z.codec(z.number().min(0).max(2047), z.number().min(1.6).max(3.647).optional(), {
  decode: (v) => (v === 2047 ? undefined : (1600 + v) / 1000),
  encode: (v) => (isUndef(v) ? 2047 : v * 1000 - 1600),
})

const toPrecision = (precision: number) => (v: number | undefined) => {
  if (isUndef(v)) {
    return undefined
  }
  const factor = 10 ** precision
  return Math.round(v * factor) / factor
}

const luminosityTransform = (value: number | undefined): number | undefined => {
  const LUX_MAX_VALUE = 65535
  const LUX_MAX_CODE = 254
  const LUX_DELTA = Math.log(LUX_MAX_VALUE + 1) / LUX_MAX_CODE
  return isUndef(value) ? undefined : Math.exp(value * LUX_DELTA) - 1
}
const luminosityExtendedTransform = (value: number | undefined): number | undefined =>
  isUndef(value) ? undefined : value * 0.01
const pmTransform = (val: number | undefined): number | undefined => (isUndef(val) ? undefined : val * 0.1)
const temperatureTransform = (val: number | undefined): number | undefined => (isUndef(val) ? undefined : val * 0.005)
const humidityTransform = (val: number | undefined): number | undefined => (isUndef(val) ? undefined : val * 0.0025)
const pressureTransform = (val: number | undefined): number | undefined => (isUndef(val) ? undefined : val + 50_000)
const accelerationTransform = (val: number | undefined): number | undefined => (isUndef(val) ? undefined : val / 1000)

const baseSchema = z.object({
  address: macCodec,
  temperature: byte(16).transform(temperatureTransform).transform(toPrecision(3)),
  humidity: byte(16, true).transform(humidityTransform).transform(toPrecision(4)),
  pressure: byte(16, true).transform(pressureTransform),
})

/**
 * Ruuvi data format 5 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2
 */
const ruuviTagSchema = baseSchema.extend({
  dataFormat: z.literal(DATA_FORMAT_5),
  accelerationX: byte(16).transform(accelerationTransform).transform(toPrecision(4)),
  accelerationY: byte(16).transform(accelerationTransform).transform(toPrecision(4)),
  accelerationZ: byte(16).transform(accelerationTransform).transform(toPrecision(4)),
  txPower: txPowerCodec.transform(toPrecision(0)),
  voltage: voltageCodec.transform(toPrecision(4)),
  movement: byte(8, true),
  sequence: byte(16, true),
})

/**
 * Ruuvi data format 6 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-6
 */
const ruuviAirSchema = baseSchema.extend({
  dataFormat: z.literal(DATA_FORMAT_6),
  'pm2.5': byte(16, true).transform(pmTransform).transform(toPrecision(1)),
  calibration: z.boolean(),
  co2: byte(16, true),
  voc: z.number().min(0).max(500),
  nox: z.number().min(0).max(500),
  luminosity: byte(8, true).transform(luminosityTransform).transform(toPrecision(2)),
  sequence: byte(16, true),
})

/**
 * Ruuvi data format E1 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-e1
 */
const ruuviAirExtendedSchema = ruuviAirSchema.extend({
  dataFormat: z.literal(DATA_FORMAT_E1),
  'pm1.0': byte(16, true).transform(pmTransform).transform(toPrecision(1)),
  'pm4.0': byte(16, true).transform(pmTransform).transform(toPrecision(1)),
  'pm10.0': byte(16, true).transform(pmTransform).transform(toPrecision(1)),
  luminosity: byte(24, true).transform(luminosityExtendedTransform).transform(toPrecision(2)),
  sequence: z.int().min(0).max(16_777_214),
})

const parseRuuviTagFields = (data: Buffer): Omit<z.input<typeof ruuviTagSchema>, 'dataFormat'> => ({
  temperature: data.readIntBE(1, 2),
  humidity: data.readUIntBE(3, 2),
  pressure: data.readUIntBE(5, 2),
  accelerationX: data.readIntBE(7, 2),
  accelerationY: data.readIntBE(9, 2),
  accelerationZ: data.readIntBE(11, 2),
  txPower: data.readUIntBE(13, 2) & 0x1f,
  voltage: data.readUIntBE(13, 2) >> 5,
  // TODO: Can we just pass powerInfo and get txPower nad voltage from there?
  // powerInfo: data.readUIntBE(13, 2),
  movement: data.readUIntBE(15, 1),
  sequence: data.readUIntBE(16, 2),
  address: data.readUIntBE(18, 6),
})

const parseRuuviAirFlags = (flags: number) => {
  const calibration = (flags & 0b0000_0001) === 1
  const noxFlag = (flags & 0b1000_0000) >> 7
  const vocFlag = (flags & 0b0100_0000) >> 6
  return { calibration, noxFlag, vocFlag }
}

const parseRuuviAirFields = (data: Buffer): Omit<z.input<typeof ruuviAirSchema>, 'dataFormat'> => {
  const { calibration, noxFlag, vocFlag } = parseRuuviAirFlags(data.readUInt8(16))

  return {
    calibration,
    temperature: data.readIntBE(1, 2),
    humidity: data.readUIntBE(3, 2),
    pressure: data.readUIntBE(5, 2),
    'pm2.5': data.readUIntBE(7, 2),
    co2: data.readUIntBE(9, 2),
    voc: data.readUIntBE(11, 1) * 2 + vocFlag,
    nox: data.readUIntBE(12, 1) * 2 + noxFlag,
    luminosity: data.readUInt8(13),
    sequence: data.readUIntBE(15, 1),
    address: data.readUIntBE(17, 3),
  }
}

const parseRuuviAirExtendedFields = (data: Buffer): Omit<z.input<typeof ruuviAirExtendedSchema>, 'dataFormat'> => {
  const { calibration, noxFlag, vocFlag } = parseRuuviAirFlags(data.readUInt8(28))

  return {
    calibration,
    temperature: data.readIntBE(1, 2),
    humidity: data.readUIntBE(3, 2),
    pressure: data.readUIntBE(5, 2),
    'pm1.0': data.readUIntBE(7, 2),
    'pm2.5': data.readUIntBE(9, 2),
    'pm4.0': data.readUIntBE(11, 2),
    'pm10.0': data.readUIntBE(13, 2),
    co2: data.readUIntBE(15, 2),
    voc: data.readUIntBE(17, 1) * 2 + vocFlag,
    nox: data.readUIntBE(18, 1) * 2 + noxFlag,
    luminosity: data.readUIntBE(19, 3),
    sequence: data.readUIntBE(25, 3),
    address: data.readUIntBE(34, 6),
  }
}

export const RuuviDataSchema = z
  .instanceof(Buffer)
  .transform((data, ctx) => {
    const dataFormat = data.readUIntBE(0, 1).toString(16).toUpperCase()

    switch (dataFormat) {
      case DATA_FORMAT_5: {
        return { dataFormat, ...parseRuuviTagFields(data) }
      }
      case DATA_FORMAT_6: {
        return { dataFormat, ...parseRuuviAirFields(data) }
      }
      case DATA_FORMAT_E1: {
        return { dataFormat, ...parseRuuviAirExtendedFields(data) }
      }
      default:
        ctx.issues.push({
          code: 'custom',
          message: 'Invalid input data format',
          input: data,
          received: dataFormat,
          expected: DATA_FORMAT_E1,
        })
    }

    return z.NEVER
  })
  .pipe(z.discriminatedUnion('dataFormat', [ruuviTagSchema, ruuviAirSchema, ruuviAirExtendedSchema]))

export type RuuviData = z.output<typeof RuuviDataSchema>
