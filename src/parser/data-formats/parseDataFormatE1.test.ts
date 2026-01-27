import { test, describe } from 'vitest'
import { parseDataFormatE1 } from './parseDataFormatE1'

describe('Ruuvi Data format E1 parser', () => {
  test('should parse valid values', ({ expect }) => {
    const data = Buffer.from('E1170C5668C79E0065007004BD11CA00C90A0213E0AC000000DECDEE010000000000CBB8334C884F', 'hex')
    expect(parseDataFormatE1(data)).toEqual({
      dataFormat: 0xe1,
      calibration: true,
      temperature: 29.5,
      pressure: 101_102,
      humidity: 55.3,
      pm: { '1.0': 10.1, '2.5': 11.2, '4.0': 121.3, '10.0': 455.4 },
      co2: 201,
      voc: 20,
      nox: 4,
      luminosity: 13_027.0,
      sequence: 14_601_710,
      mac: 'CB:B8:33:4C:88:4F',
    })
  })

  test('should parse maximum values', ({ expect }) => {
    const data = Buffer.from('E17FFF9C40FFFE27102710271027109C40FAFADC28F0000000FFFFFE3F0000000000CBB8334C884F', 'hex')
    expect(parseDataFormatE1(data)).toEqual({
      dataFormat: 0xe1,
      calibration: true,
      temperature: 163.835,
      pressure: 115_534,
      humidity: 100,
      pm: { '1.0': 1_000.0, '2.5': 1_000.0, '4.0': 1_000.0, '10.0': 1_000.0 },
      co2: 40_000,
      voc: 500,
      nox: 500,
      luminosity: 144_284,
      sequence: 16_777_214,
      mac: 'CB:B8:33:4C:88:4F',
    })
  })

  test('should parse minimum values', ({ expect }) => {
    const data = Buffer.from('E1800100000000000000000000000000000000000000000000000000000000000000CBB8334C884F', 'hex')
    expect(parseDataFormatE1(data)).toEqual({
      dataFormat: 0xe1,
      calibration: false,
      temperature: -163.835,
      pressure: 50_000,
      humidity: 0,
      pm: { '1.0': 0, '2.5': 0, '4.0': 0, '10.0': 0 },
      co2: 0,
      voc: 0,
      nox: 0,
      luminosity: 0,
      sequence: 0,
      mac: 'CB:B8:33:4C:88:4F',
    })
  })

  test('should handle invalid values', ({ expect }) => {
    const data = Buffer.from('E18000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000FFFFFFFE0000000000FFFFFFFFFFFF', 'hex')
    expect(parseDataFormatE1(data)).toEqual({
      dataFormat: 0xe1,
      calibration: false,
      temperature: NaN,
      pressure: NaN,
      humidity: NaN,
      pm: { '1.0': NaN, '2.5': NaN, '4.0': NaN, '10.0': NaN },
      co2: NaN,
      voc: NaN,
      nox: NaN,
      luminosity: NaN,
      sequence: NaN,
      mac: 'FF:FF:FF:FF:FF:FF',
    })
  })

  test('throws on invalid data format', ({ expect }) => {
    const data = Buffer.from('06170C5668C79E007000C90501D900CD004C884F', 'hex')
    expect(() => parseDataFormatE1(data)).toThrowError('Input data format 6 incorrect')
  })
})
