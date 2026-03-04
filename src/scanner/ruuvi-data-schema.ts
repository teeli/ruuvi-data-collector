import * as z from 'zod'

export const DATA_FORMAT_5 = 5 as const
export const DATA_FORMAT_6 = 6 as const
export const DATA_FORMAT_E1 = 0xe1 as const

const macPreprocess = (val: string): string => val.toUpperCase().match(/.{2}/g)?.join(':') ?? ''

/**
 * Ruuvi data format 5 schema
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2
 */
const dataFormat5Schema = z.object({
  dataFormat: z.literal(DATA_FORMAT_5),
  temperature: z
    .number()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val * 0.005)),
  humidity: z
    .number()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val * 0.0025)),
  pressure: z
    .number()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val + 50_000)),
  acceleration: z.object({
    x: z
      .number()
      .min(-32_767)
      .max(32_767)
      .pipe(z.transform((val) => val / 1000)),
    y: z
      .number()
      .min(-32_767)
      .max(32_767)
      .pipe(z.transform((val) => val / 1000)),
    z: z
      .number()
      .min(-32_767)
      .max(32_767)
      .pipe(z.transform((val) => val / 1000)),
  }),
  txPower: z
    .number()
    .pipe(z.number().min(0).max(30))
    .pipe(z.transform((val) => val * 2 - 40)),
  voltage: z
    .number()
    .pipe(z.number().min(0).max(2_046))
    .pipe(z.transform((val) => (1600 + val) / 1000)),
  movement: z.number().min(0).max(254),
  sequence: z.number().min(0).max(65_534),
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
    .number()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val * 0.005)),
  humidity: z
    .number()
    .min(0)
    .max(40_000)
    .pipe(z.transform((val) => val * 0.0025)),
  pressure: z
    .number()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val + 50_000)),
  'pm2.5': z
    .number()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1)),
  co2: z.number().min(0).max(40_000),
  voc: z.number().min(0).max(500),
  nox: z.number().min(0).max(500),
  luminosity: z
    .number()
    .min(0)
    .max(254)
    .pipe(
      z.transform((val) => {
        const delta = Math.log(65536) / 254
        return Math.exp(val * delta) - 1
      })
    ),
  sequence: z.number().min(0).max(65_534),
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
    .number()
    .min(-32_767)
    .max(32_767)
    .pipe(z.transform((val) => val * 0.005)),
  humidity: z
    .number()
    .min(0)
    .max(40_000)
    .pipe(z.transform((val) => val * 0.0025)),
  pressure: z
    .number()
    .min(0)
    .max(65_534)
    .pipe(z.transform((val) => val + 50_000)),
  'pm1.0': z
    .number()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1)),
  'pm2.5': z
    .number()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1)),
  'pm4.0': z
    .number()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1)),
  'pm10.0': z
    .number()
    .min(0)
    .max(10_000)
    .pipe(z.transform((val) => val * 0.1)),
  co2: z.number().min(0).max(40_000),
  voc: z.number().min(0).max(500),
  nox: z.number().min(0).max(500),
  luminosity: z.number().min(0).max(14_428_400),
  sequence: z.number().min(0).max(16_777_214),
  address: z.preprocess(macPreprocess, z.mac()),
})

const dataFormat5Transform = z
  .instanceof(Buffer)
  .transform((data, ctx) => {
    const dataFormat = data.readUIntBE(0, 1)

    if (dataFormat === DATA_FORMAT_5) {
      return {
        dataFormat,
        temperature: data.readIntBE(1, 2),
        humidity: data.readUIntBE(3, 2),
        pressure: data.readUIntBE(5, 2),
        acceleration: { x: data.readIntBE(7, 2), y: data.readIntBE(9, 2), z: data.readIntBE(11, 2) },
        txPower: data.readUIntBE(13, 2) & 0x1f,
        voltage: data.readUIntBE(13, 2) >> 5,
        movement: data.readUIntBE(15, 1),
        sequence: data.readUIntBE(16, 2),
        address: data.readUIntBE(18, 6).toString(16),
      }
    } else {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid input data format',
        input: data,
        received: dataFormat,
        expected: DATA_FORMAT_5,
      })
    }

    return z.NEVER
  })
  .pipe(dataFormat5Schema)

const dataFormat6Transform = z
  .instanceof(Buffer)
  .transform((data, ctx) => {
    const dataFormat = data.readUIntBE(0, 1)

    if (dataFormat === DATA_FORMAT_6) {
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
        address: data.readUIntBE(17, 3).toString(16),
      }
    } else {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid input data format',
        input: data,
        received: dataFormat,
        expected: DATA_FORMAT_6,
      })
    }

    return z.NEVER
  })
  .pipe(dataFormat6Schema)

const dataFormatE1Transform = z
  .instanceof(Buffer)
  .transform((data, ctx) => {
    const dataFormat = data.readUIntBE(0, 1)

    if (dataFormat === DATA_FORMAT_E1) {
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
        luminosity: data.readUIntBE(19, 3) * 0.01,
        sequence: data.readUIntBE(25, 3),
        address: data.readUIntBE(34, 6).toString(16),
      }
    } else {
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
  .pipe(dataFormatE1Schema)

export const RuuviDataSchema = z.union([dataFormat5Transform, dataFormat6Transform, dataFormatE1Transform])

export type RuuviData = z.output<typeof RuuviDataSchema>
