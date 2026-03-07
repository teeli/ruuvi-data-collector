import { describe, test } from 'vitest'
import { RuuviDataSchema } from './ruuvi-data-schema'

describe('Ruuvi data schema', () => {
  describe('with data format 5', () => {
    test('should parse valid values', ({ expect }) => {
      const data = Buffer.from('0512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          temperature: 24.3,
          pressure: 100_044,
          humidity: 53.49,
          accelerationX: 0.004,
          accelerationY: -0.004,
          accelerationZ: 1.036,
          txPower: 4,
          voltage: 2.977,
          movement: 66,
          sequence: 205,
          address: 'CB:B8:33:4C:88:4F',
        })
      )
    })

    test('should parse maximum values', ({ expect }) => {
      const maximumValues = '057FFFFFFEFFFE7FFF7FFF7FFFFFDEFEFFFECBB8334C884F'
      const data = Buffer.from(maximumValues, 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          temperature: 163.835,
          pressure: 115_534,
          humidity: 163.835,
          accelerationX: 32.767,
          accelerationY: 32.767,
          accelerationZ: 32.767,
          txPower: 20,
          voltage: 3.646,
          movement: 254,
          sequence: 65534,
          address: 'CB:B8:33:4C:88:4F',
        })
      )
    })

    test('should parse minimum values', ({ expect }) => {
      const data = Buffer.from('058001000000008001800180010000000000CBB8334C884F', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          temperature: -163.835,
          pressure: 50_000,
          humidity: 0,
          accelerationX: -32.767,
          accelerationY: -32.767,
          accelerationZ: -32.767,
          txPower: -40,
          voltage: 1.6,
          movement: 0,
          sequence: 0,
          address: 'CB:B8:33:4C:88:4F',
        })
      )
    })

    test('should fail on invalid values', ({ expect }) => {
      const data = Buffer.from('058000FFFFFFFF800080008000FFFFFFFFFFFFFFFFFFFFFF', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.error).toBeDefined()
      expect(result.data).not.toBeDefined()
      expect(result.success).toEqual(false)
    })
  })

  describe('with data format 6', () => {
    test('should parse valid values', ({ expect }) => {
      const data = Buffer.from('06170C5668C79E007000C90501D900CD004C884F', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          calibration: false,
          temperature: 29.5,
          pressure: 101_102,
          humidity: 55.300000000000004,
          'pm2.5': 11.200000000000001,
          co2: 201,
          voc: 10,
          nox: 2,
          luminosity: 13026.668900127113,
          sequence: 205,
          address: '4C:88:4F',
        })
      )
    })

    test('should parse maximum values', ({ expect }) => {
      const data = Buffer.from('067FFF9C40FFFE27109C40FAFAFE00FF074C8F4F', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          calibration: true,
          temperature: 163.835,
          pressure: 115_534,
          humidity: 100,
          'pm2.5': 1_000.0,
          co2: 40_000,
          voc: 500,
          nox: 500,
          luminosity: 65_534.99999999998,
          sequence: 255,
          address: '4C:8F:4F',
        })
      )
    })

    test('should parse minimum values', ({ expect }) => {
      const data = Buffer.from('06800100000000000000000000000000004C884F', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          calibration: false,
          temperature: -163.835,
          pressure: 50_000,
          humidity: 0,
          'pm2.5': 0,
          co2: 0,
          voc: 0,
          nox: 0,
          luminosity: 0,
          sequence: 0,
          address: '4C:88:4F',
        })
      )
    })

    test('should fail on invalid values', ({ expect }) => {
      const data = Buffer.from('068000FFFFFFFFFFFFFFFFFFFFFF00FFFFFFFFFF', 'hex')
      const result = RuuviDataSchema.safeParse(data)
      expect(result.error).toBeDefined()
      expect(result.data).not.toBeDefined()
      expect(result.success).toEqual(false)
    })
  })

  describe('with data format E1', () => {
    test('should parse valid values', ({ expect }) => {
      const data = Buffer.from(
        'E1170C5668C79E0065007004BD11CA00C90A0213E0AC000000DECDEE010000000000CBB8334C884F',
        'hex'
      )
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          calibration: true,
          temperature: 29.5,
          pressure: 101_102,
          humidity: 55.300000000000004,
          'pm1.0': 10.100000000000001,
          'pm10.0': 455.40000000000003,
          'pm2.5': 11.200000000000001,
          'pm4.0': 121.30000000000001,
          co2: 201,
          voc: 20,
          nox: 4,
          luminosity: 13_027.0,
          sequence: 14_601_710,
          address: 'CB:B8:33:4C:88:4F',
        })
      )
    })

    test('should parse maximum values', ({ expect }) => {
      const data = Buffer.from(
        'E17FFF9C40FFFE27102710271027109C40FAFADC28F0000000FFFFFE3F0000000000CBB8334C884F',
        'hex'
      )
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          calibration: true,
          temperature: 163.835,
          pressure: 115_534,
          humidity: 100,
          'pm1.0': 1_000.0,
          'pm2.5': 1_000.0,
          'pm4.0': 1_000.0,
          'pm10.0': 1_000.0,
          co2: 40_000,
          voc: 500,
          nox: 500,
          luminosity: 144_284,
          sequence: 16_777_214,
          address: 'CB:B8:33:4C:88:4F',
        })
      )
    })

    test('should parse minimum values', ({ expect }) => {
      const data = Buffer.from(
        'E1800100000000000000000000000000000000000000000000000000000000000000CBB8334C884F',
        'hex'
      )
      const result = RuuviDataSchema.safeParse(data)
      expect(result.data).toEqual(
        expect.objectContaining({
          calibration: false,
          temperature: -163.835,
          pressure: 50_000,
          humidity: 0,
          'pm1.0': 0,
          'pm2.5': 0,
          'pm4.0': 0,
          'pm10.0': 0,
          co2: 0,
          voc: 0,
          nox: 0,
          luminosity: 0,
          sequence: 0,
          address: 'CB:B8:33:4C:88:4F',
        })
      )
    })

    test('should handle invalid values', ({ expect }) => {
      const data = Buffer.from(
        'E18000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000FFFFFFFE0000000000FFFFFFFFFFFF',
        'hex'
      )
      const result = RuuviDataSchema.safeParse(data)
      expect(result.error).toBeDefined()
      expect(result.data).not.toBeDefined()
      expect(result.success).toEqual(false)
    })
  })

  describe('with invalid data', () => {
    test('should fail validation with invalid data', ({ expect }) => {
      const data = 'E1170C5668C79E0065007004BD11CA00C90A0213E0AC000000DECDEE010000000000CBB8334C884F'
      const result = RuuviDataSchema.safeParse(data)
      expect(result.error).toBeDefined()
      expect(result.data).not.toBeDefined()
      expect(result.success).toEqual(false)
    })
    test('should fail validation with invalid data format', ({ expect }) => {
      const data = Buffer.from(
        'EE8000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000FFFFFFFE0000000000FFFFFFFFFFFF',
        'hex'
      )
      const result = RuuviDataSchema.safeParse(data)
      expect(result.error).toBeDefined()
      expect(result.data).not.toBeDefined()
      expect(result.success).toEqual(false)
    })
  })
})
