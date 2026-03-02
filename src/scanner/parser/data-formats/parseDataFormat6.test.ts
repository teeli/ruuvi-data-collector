import { test, describe } from 'vitest'
import { parseDataFormat6 } from './parseDataFormat6.ts'
import { DATA_FORMAT_6 } from './constants.ts'

describe('Ruuvi Data format 6 parser', () => {
  test('should parse valid values', ({ expect }) => {
    const data = Buffer.from('06170C5668C79E007000C90501D900CD004C884F', 'hex')
    expect(parseDataFormat6(data)).toEqual(
      expect.objectContaining({
        calibration: false,
        temperature: 29.5,
        pressure: 101_102,
        humidity: 55.300000000000004,
        pm: { '2.5': 11.200000000000001 },
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
    expect(parseDataFormat6(data)).toEqual(
      expect.objectContaining({
        calibration: true,
        temperature: 163.835,
        pressure: 115_534,
        humidity: 100,
        pm: { '2.5': 1_000.0 },
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
    expect(parseDataFormat6(data)).toEqual(
      expect.objectContaining({
        calibration: false,
        temperature: -163.835,
        pressure: 50_000,
        humidity: 0,
        pm: { '2.5': 0 },
        co2: 0,
        voc: 0,
        nox: 0,
        luminosity: 0,
        sequence: 0,
        address: '4C:88:4F',
      })
    )
  })

  test('should handle invalid values', ({ expect }) => {
    const data = Buffer.from('068000FFFFFFFFFFFFFFFFFFFFFF00FFFFFFFFFF', 'hex')
    expect(parseDataFormat6(data)).toEqual(
      expect.objectContaining({
        calibration: true,
        temperature: NaN,
        pressure: NaN,
        humidity: NaN,
        pm: { '2.5': NaN },
        co2: NaN,
        voc: NaN,
        nox: NaN,
        luminosity: NaN,
        sequence: 255,
        address: 'FF:FF:FF',
      })
    )
  })
})
