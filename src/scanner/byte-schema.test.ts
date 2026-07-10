import { describe, test } from 'vitest'
import { byte } from './byte-schema'

describe('byte', () => {
  test('defaults to a 16-bit unsigned integer with no sentinel', ({ expect }) => {
    const schema = byte()
    expect(schema.parse(0)).toEqual(0)
    expect(schema.parse(65_535)).toEqual(65_535)
    expect(schema.safeParse(-1).success).toEqual(false)
    expect(schema.safeParse(65_536).success).toEqual(false)
  })

  test('does not map any value to undefined when no sentinel is configured', ({ expect }) => {
    const schema = byte().length(8).unsigned()
    expect(schema.parse(255)).toEqual(255)
    expect(schema.parse(0)).toEqual(0)
  })

  test('length() resizes the valid unsigned range', ({ expect }) => {
    const schema = byte().length(8).unsigned()
    expect(schema.parse(255)).toEqual(255)
    expect(schema.safeParse(256).success).toEqual(false)
    expect(schema.safeParse(-1).success).toEqual(false)
  })

  test("signed() resizes the valid range to two's-complement bounds", ({ expect }) => {
    const schema = byte().length(8).signed()
    expect(schema.parse(127)).toEqual(127)
    expect(schema.parse(-128)).toEqual(-128)
    expect(schema.safeParse(128).success).toEqual(false)
    expect(schema.safeParse(-129).success).toEqual(false)
  })

  test('unsigned() switches a signed schema back to unsigned bounds', ({ expect }) => {
    const schema = byte().length(8).signed().unsigned()
    expect(schema.parse(255)).toEqual(255)
    expect(schema.safeParse(-1).success).toEqual(false)
  })

  test('sentinel() maps the raw unsigned sentinel to undefined for unsigned fields', ({ expect }) => {
    const schema = byte().length(8).unsigned().sentinel(0xff)
    expect(schema.parse(0xff)).toBeUndefined()
    expect(schema.parse(0xfe)).toEqual(254)
  })

  test("sentinel() converts the raw bit pattern to two's-complement for signed fields", ({ expect }) => {
    const schema = byte().length(8).signed().sentinel(0x80)
    expect(schema.parse(-128)).toBeUndefined()
    expect(schema.parse(-127)).toEqual(-127)
  })

  test('chain order does not affect the resolved sentinel', ({ expect }) => {
    const sentinelFirst = byte().sentinel(0x80).length(8).signed()
    const sentinelLast = byte().length(8).signed().sentinel(0x80)
    expect(sentinelFirst.parse(-128)).toBeUndefined()
    expect(sentinelLast.parse(-128)).toBeUndefined()
    expect(sentinelFirst.parse(-127)).toEqual(sentinelLast.parse(-127))
  })

  test('rejects non-integer values', ({ expect }) => {
    expect(byte().safeParse(1.5).success).toEqual(false)
  })
})
