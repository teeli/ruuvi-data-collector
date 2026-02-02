import { test, describe } from 'vitest'
import { parseDataFormat5 } from './parseDataFormat5.ts'
import { DATA_FORMAT_5 } from './constants.ts'

describe('Ruuvi Data format 5 parser', () => {
  test('should parse valid values', ({ expect }) => {
    const data = Buffer.from('0512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    expect(parseDataFormat5(data)).toEqual({
      dataFormat: DATA_FORMAT_5,
      temperature: 24.3,
      pressure: 100_044,
      humidity: 53.49,
      acceleration: { x: 0.004, y: -0.004, z: 1.036 },
      txPower: 4,
      voltage: 2.977,
      movement: 66,
      sequence: 205,
      mac: 'CB:B8:33:4C:88:4F',
    })
  })

  test('should parse maximum values', ({ expect }) => {
    const maximumValues = '057FFFFFFEFFFE7FFF7FFF7FFFFFDEFEFFFECBB8334C884F'
    const data = Buffer.from(maximumValues, 'hex')
    expect(parseDataFormat5(data)).toEqual({
      dataFormat: DATA_FORMAT_5,
      temperature: 163.835,
      pressure: 115_534,
      humidity: 163.835,
      acceleration: { x: 32.767, y: 32.767, z: 32.767 },
      txPower: 20,
      voltage: 3.646,
      movement: 254,
      sequence: 65534,
      mac: 'CB:B8:33:4C:88:4F',
    })
  })

  test('should parse minimum values', ({ expect }) => {
    const data = Buffer.from('058001000000008001800180010000000000CBB8334C884F', 'hex')
    expect(parseDataFormat5(data)).toEqual({
      dataFormat: DATA_FORMAT_5,
      temperature: -163.835,
      pressure: 50_000,
      humidity: 0,
      acceleration: { x: -32.767, y: -32.767, z: -32.767 },
      txPower: -40,
      voltage: 1.6,
      movement: 0,
      sequence: 0,
      mac: 'CB:B8:33:4C:88:4F',
    })
  })

  test('should handle invalid values', ({ expect }) => {
    const data = Buffer.from('058000FFFFFFFF800080008000FFFFFFFFFFFFFFFFFFFFFF', 'hex')
    expect(parseDataFormat5(data)).toEqual({
      dataFormat: DATA_FORMAT_5,
      temperature: NaN,
      pressure: NaN,
      humidity: NaN,
      acceleration: { x: NaN, y: NaN, z: NaN },
      txPower: NaN,
      voltage: NaN,
      movement: NaN,
      sequence: NaN,
      mac: 'FF:FF:FF:FF:FF:FF',
    })
  })

  test('throws on invalid data format', ({ expect }) => {
    const data = Buffer.from('E1170C5668C79E0065007004BD11CA00C90A0213E0AC000000DECDEE010000000000CBB8334C884F', 'hex')
    expect(() => parseDataFormat5(data)).toThrowError('Input data format 225 incorrect')
  })
})
