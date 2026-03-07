import * as z from 'zod'

export const DATA_FORMAT_5 = '5' as const
export const DATA_FORMAT_6 = '6' as const
export const DATA_FORMAT_E1 = 'E1' as const

const macPreprocess = (val: number): string => val.toString(16).toUpperCase().match(/.{2}/g)?.join(':') ?? ''

// codec for parsing luminosity values for data format 6
const LUX_MAX_VALUE = 65535
const LUX_MAX_CODE = 254
const LUX_DELTA = Math.log(LUX_MAX_VALUE + 1) / LUX_MAX_CODE

const luminosityCodec = z.codec(z.number(), z.number(), {
  decode: (code) => Math.exp(code * LUX_DELTA) - 1,
  encode: (value) => Math.round(Math.log(Math.max(0, Math.min(value, LUX_MAX_VALUE)) + 1) / LUX_DELTA),
})

const toPrecision = (precision: number) =>
  z.number().transform((v) => {
    const factor = 10 ** precision
    return Math.round(v * factor) / factor
  })

/**
 * Ruuvi data format 5 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2
 */
const dataFormat5Schema = z.object({
  dataFormat: z.literal(DATA_FORMAT_5),
  temperature: z
    .int()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val * 0.005))
    .pipe(toPrecision(3)),
  humidity: z
    .int()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val * 0.0025))
    .pipe(toPrecision(4)),
  pressure: z
    .int()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val + 50_000)),
  accelerationX: z
    .int()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val / 1000))
    .pipe(toPrecision(4)),
  accelerationY: z
    .int()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val / 1000))
    .pipe(toPrecision(4)),
  accelerationZ: z
    .int()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val / 1000))
    .pipe(toPrecision(4)),
  txPower: z.preprocess(
    (val: number) => val & 0x1f,
    z
      .number()
      .min(0)
      .max(30)
      .pipe(z.transform((val) => val * 2 - 40))
      .pipe(toPrecision(0))
  ),
  voltage: z.preprocess(
    (val: number) => val >> 5,
    z
      .number()
      .min(0)
      .max(2_046)
      .pipe(z.transform((val) => (1600 + val) / 1000))
      .pipe(toPrecision(4))
  ),
  movement: z.int().min(0).max(254),
  sequence: z.int().min(0).max(65_534),
  address: z.preprocess(macPreprocess, z.mac()),
})

/**
 * Ruuvi data format 6 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-6
 */
const dataFormat6Schema = z.object({
  dataFormat: z.literal(DATA_FORMAT_6),
  calibration: z.boolean(),
  temperature: z
    .int()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val * 0.005))
    .pipe(toPrecision(3)),
  humidity: z
    .int()
    .min(0)
    .max(40_000)
    .pipe(z.transform((val) => val * 0.0025))
    .pipe(toPrecision(4)),
  pressure: z
    .int()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val + 50_000)),
  'pm2.5': z
    .int()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1))
    .pipe(toPrecision(1)),
  co2: z.int().min(0).max(40_000),
  voc: z.number().min(0).max(500),
  nox: z.number().min(0).max(500),
  luminosity: z
    .int()
    .min(0)
    .max(254)
    // RuuviAir often seems to report values over the maximum, so this prevents validation errors
    .catch((ctx) => (ctx.issues.some((issue) => issue.code === 'too_big') ? 254 : 0))
    .pipe(luminosityCodec)
    .pipe(toPrecision(2)),
  sequence: z.int().min(0).max(65_534),
  address: z.preprocess(macPreprocess, z.string()),
})

/**
 * Ruuvi data format E1 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-e1
 */
const dataFormatE1Schema = z.object({
  dataFormat: z.literal(DATA_FORMAT_E1),
  calibration: z.boolean(),
  temperature: z
    .int()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val * 0.005))
    .pipe(toPrecision(3)),
  humidity: z
    .int()
    .min(0)
    .max(40_000)
    .pipe(z.transform((val) => val * 0.0025))
    .pipe(toPrecision(4)),
  pressure: z
    .int()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val + 50_000)),
  'pm1.0': z
    .int()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1))
    .pipe(toPrecision(1)),
  'pm2.5': z
    .int()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1))
    .pipe(toPrecision(1)),
  'pm4.0': z
    .int()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1))
    .pipe(toPrecision(1)),
  'pm10.0': z
    .int()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1))
    .pipe(toPrecision(1)),
  co2: z.int().min(0).max(40_000),
  voc: z.number().min(0).max(500),
  nox: z.number().min(0).max(500),
  luminosity: z
    .number()
    .min(0)
    .max(14_428_400)
    // RuuviAir often seems to report values over the maximum, so this prevents validation errors
    .catch((ctx) => (ctx.issues.some((issue) => issue.code === 'too_big') ? 14_428_400 : 0))
    .pipe(z.transform((val) => val * 0.01))
    .pipe(toPrecision(2)),
  sequence: z.int().min(0).max(16_777_214),
  address: z.preprocess(macPreprocess, z.mac()),
})

const DataFormatUnion = z.discriminatedUnion('dataFormat', [dataFormat5Schema, dataFormat6Schema, dataFormatE1Schema])

export const RuuviDataSchema = z
  .instanceof(Buffer)
  .transform((data, ctx) => {
    const dataFormat = data.readUIntBE(0, 1).toString(16).toUpperCase()

    switch (dataFormat) {
      case DATA_FORMAT_5: {
        return {
          dataFormat,
          temperature: data.readIntBE(1, 2),
          humidity: data.readUIntBE(3, 2),
          pressure: data.readUIntBE(5, 2),
          accelerationX: data.readIntBE(7, 2),
          accelerationY: data.readIntBE(9, 2),
          accelerationZ: data.readIntBE(11, 2),
          txPower: data.readUIntBE(13, 2),
          voltage: data.readUIntBE(13, 2),
          movement: data.readUIntBE(15, 1),
          sequence: data.readUIntBE(16, 2),
          address: data.readUIntBE(18, 6),
        } satisfies z.input<typeof dataFormat5Schema>
      }
      case DATA_FORMAT_6: {
        const flags = data.readUInt8(16)
        const calibration = (flags & 0b0000_0001) === 1
        const noxFlag = (flags & 0b1000_0000) >> 7
        const vocFlag = (flags & 0b0100_0000) >> 6

        return {
          dataFormat,
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
        } satisfies z.input<typeof dataFormat6Schema>
      }
      case DATA_FORMAT_E1: {
        const flags = data.readUInt8(28)
        const calibration = (flags & 0b0000_0001) === 1
        const noxFlag = (flags & 0b1000_0000) >> 7
        const vocFlag = (flags & 0b0100_0000) >> 6

        return {
          dataFormat,
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
        } satisfies z.input<typeof dataFormatE1Schema>
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
  .pipe(DataFormatUnion)

export type RuuviData = z.output<typeof RuuviDataSchema>
