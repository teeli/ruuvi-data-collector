import * as z from 'zod'
import { byte } from '@scanner/byte-schema'
import { isNil } from '@util/is-nil'
import { clamp } from '@util/math'

export const DATA_FORMAT_5 = '5' as const
export const DATA_FORMAT_6 = '6' as const
export const DATA_FORMAT_E1 = 'E1' as const

// Luminosity calculation constants
const LUX_MAX_VALUE = 65535
const LUX_MAX_CODE = 254
const LUX_DELTA = Math.log(LUX_MAX_VALUE + 1) / LUX_MAX_CODE

// IAQS calculation constants
const AQI_MAX = 100
const PM25_MAX = 60
const PM25_MIN = 0
const PM25_SCALE = AQI_MAX / (PM25_MAX - PM25_MIN) // ≈ 1.6667
const CO2_MAX = 2300
const CO2_MIN = 420
const CO2_SCALE = AQI_MAX / (CO2_MAX - CO2_MIN) // ≈ 0.05319

const toPrecision = (precision: number) => (v: number | undefined) => {
  if (isNil(v)) {
    return undefined
  }

  const factor = 10 ** precision
  return Math.round(v * factor) / factor
}

const luminosityTransform = (value: number | undefined): number | undefined =>
  isNil(value) ? undefined : Math.exp(value * LUX_DELTA) - 1
const luminosityExtendedTransform = (value: number | undefined): number | undefined =>
  isNil(value) ? undefined : value * 0.01
const pmTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : val * 0.1)
const temperatureTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : val * 0.005)
const humidityTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : val * 0.0025)
const pressureTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : val + 50_000)
const accelerationTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : val / 1000)
const txPowerTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : val * 2 - 40)
const voltageTransform = (val: number | undefined): number | undefined => (isNil(val) ? undefined : (1600 + val) / 1000)
const macAddressTransform = (val: number | undefined): string | undefined =>
  isNil(val) ? undefined : (val.toString(16).toUpperCase().match(/.{2}/g)?.join(':') ?? val.toString(16))

/**
 * https://docs.ruuvi.com/ruuvi-air-firmware/ruuvi-indoor-air-quality-score-iaqs
 */
const iaqsTransform = <T extends { 'pm2.5': number | undefined; co2: number | undefined }>(
  value: T
): T & { iaqs: number | undefined } => {
  if (isNil(value['pm2.5']) || isNil(value.co2)) {
    return { ...value, iaqs: undefined }
  }

  const pm25 = clamp(value['pm2.5'], PM25_MIN, PM25_MAX)
  const co2 = clamp(value.co2, CO2_MIN, CO2_MAX)

  const dx = (pm25 - PM25_MIN) * PM25_SCALE
  const dy = (co2 - CO2_MIN) * CO2_SCALE

  const r = Math.hypot(dx, dy)
  const iaqs = toPrecision(2)(clamp(AQI_MAX - r, 0, AQI_MAX))
  return { ...value, iaqs }
}

const baseSchema = z.object({
  address: byte().length(48).unsigned().sentinel(0xffffffffffff).transform(macAddressTransform),
  temperature: byte().length(16).signed().sentinel(0x8000).transform(temperatureTransform).transform(toPrecision(3)),
  humidity: byte().length(16).unsigned().sentinel(0xffff).transform(humidityTransform).transform(toPrecision(4)),
  pressure: byte().length(16).unsigned().sentinel(0xffff).transform(pressureTransform),
})

/**
 * Ruuvi data format 5 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2
 */
const ruuviTagSchema = z.object({
  ...baseSchema.shape,
  dataFormat: z.literal(DATA_FORMAT_5),
  accelerationX: byte().length(16).signed().sentinel(0x8000).transform(accelerationTransform).transform(toPrecision(4)),
  accelerationY: byte().length(16).signed().sentinel(0x8000).transform(accelerationTransform).transform(toPrecision(4)),
  accelerationZ: byte().length(16).signed().sentinel(0x8000).transform(accelerationTransform).transform(toPrecision(4)),
  // 16-bit powerInfo packs an 11-bit voltage + 5-bit txPower; split at parse time (see parseRuuviTagFields)
  txPower: byte().length(5).unsigned().sentinel(0x1f).transform(txPowerTransform).transform(toPrecision(0)),
  voltage: byte().length(11).unsigned().sentinel(0x7ff).transform(voltageTransform).transform(toPrecision(4)),
  movement: byte().length(8).unsigned().sentinel(0xff),
  sequence: byte().length(16).unsigned().sentinel(0xffff),
})

const ruuviAirBaseSchema = z.object({
  ...baseSchema.shape,
  'pm2.5': byte().length(16).unsigned().sentinel(0xffff).transform(pmTransform).transform(toPrecision(1)),
  calibration: z.boolean(),
  co2: byte().length(16).unsigned().sentinel(0xffff),
  // 9-bit value: dedicated byte + least significant bit from the flags byte
  voc: byte().length(9).unsigned().sentinel(0x1ff),
  nox: byte().length(9).unsigned().sentinel(0x1ff),
})

/**
 * Ruuvi data format 6 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-6
 */
const ruuviAirSchema = z
  .object({
    ...ruuviAirBaseSchema.shape,
    dataFormat: z.literal(DATA_FORMAT_6),
    address: byte().length(24).unsigned().sentinel(0xffffff).transform(macAddressTransform),
    luminosity: byte().length(8).unsigned().sentinel(0xff).transform(luminosityTransform).transform(toPrecision(2)),
    // No reserved "not available" value for this field, unlike E1's sequence
    sequence: byte().length(8).unsigned(),
  })
  .transform(iaqsTransform)

/**
 * Ruuvi data format E1 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-e1
 */
const ruuviAirExtendedSchema = z
  .object({
    ...ruuviAirBaseSchema.shape,
    dataFormat: z.literal(DATA_FORMAT_E1),
    address: byte().length(48).unsigned().sentinel(0xffffffffffff).transform(macAddressTransform),
    'pm1.0': byte().length(16).unsigned().sentinel(0xffff).transform(pmTransform).transform(toPrecision(1)),
    'pm4.0': byte().length(16).unsigned().sentinel(0xffff).transform(pmTransform).transform(toPrecision(1)),
    'pm10.0': byte().length(16).unsigned().sentinel(0xffff).transform(pmTransform).transform(toPrecision(1)),
    luminosity: byte()
      .length(24)
      .unsigned()
      .sentinel(0xffffff)
      .transform(luminosityExtendedTransform)
      .transform(toPrecision(2)),
    sequence: byte().length(24).unsigned().sentinel(0xffffff),
  })
  .transform(iaqsTransform)

const parseRuuviTagFields = (data: Buffer): Omit<z.input<typeof ruuviTagSchema>, 'dataFormat'> => {
  // Packed 16-bit value: 11-bit voltage + 5-bit txPower
  const powerInfo = data.readUIntBE(13, 2)

  return {
    temperature: data.readIntBE(1, 2),
    humidity: data.readUIntBE(3, 2),
    pressure: data.readUIntBE(5, 2),
    accelerationX: data.readIntBE(7, 2),
    accelerationY: data.readIntBE(9, 2),
    accelerationZ: data.readIntBE(11, 2),
    txPower: powerInfo & 0x1f,
    voltage: powerInfo >> 5,
    movement: data.readUIntBE(15, 1),
    sequence: data.readUIntBE(16, 2),
    address: data.readUIntBE(18, 6),
  }
}

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
    try {
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
    } catch (error) {
      ctx.issues.push({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Failed to parse manufacturer data',
        input: data,
      })
    }

    return z.NEVER
  })
  .pipe(z.discriminatedUnion('dataFormat', [ruuviTagSchema, ruuviAirSchema, ruuviAirExtendedSchema]))

export type RuuviData = z.output<typeof RuuviDataSchema>
