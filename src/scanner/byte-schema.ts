import * as z from 'zod'

/**
 * Ruuvi's "not available" sentinel is given as a raw bit pattern (see spec
 * links below), e.g. 0xffff for unsigned fields (all bits set) or 0x8000 for
 * signed fields (smallest two's-complement value). .sentinel() takes that raw
 * pattern and converts it for signed fields.
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2
 */
const makeInnerByteSchema = (min: number, max: number, sentinel: number) =>
  z
    .int()
    .min(min)
    .max(max)
    .transform((value) => (value === sentinel ? undefined : value))

type InnerByteSchema = ReturnType<typeof makeInnerByteSchema>

/**
 * A zod schema for a fixed-width wire-format integer field, with chain
 * methods for describing the field's bit width, sign, and "not available"
 * sentinel.
 */
interface ByteSchema extends InnerByteSchema {
  /**
   * Sets the field's bit width.
   *
   * @param bits - Number of bits the field occupies on the wire.
   */
  length: (bits: number) => ByteSchema
  /** Interprets the field as a two's-complement signed integer. */
  signed: () => ByteSchema
  /** Interprets the field as an unsigned integer (the default). */
  unsigned: () => ByteSchema
  /**
   * Sets the "not available" sentinel value.
   *
   * @param raw - The sentinel as a raw, unsigned bit pattern, as documented
   * by Ruuvi (e.g. 0xffff, 0x8000). Converted to its two's-complement
   * decimal value internally for signed fields.
   */
  sentinel: (raw: number) => ByteSchema
}

const DEFAULT_BIT_LENGTH = 16

/**
 * Converts an unsigned raw bit pattern to its two's-complement decimal value,
 * e.g. 0x8000 (32768) for a 16-bit signed field becomes -32768.
 */
const toSignedBitPattern = (raw: number, range: number): number => (raw >= range / 2 ? raw - range : raw)

/**
 * Resolves a raw sentinel bit pattern to the decimal value the parsed field
 * is compared against, converting for sign as needed. `NaN` (an unreachable
 * value for `z.int()`) stands in for "no sentinel configured", making the
 * map-to-`undefined` transform a no-op until `.sentinel()` is called.
 */
const resolveSentinel = (raw: number | undefined, isSigned: boolean, range: number): number => {
  if (raw === undefined) {
    return Number.NaN
  }
  return isSigned ? toSignedBitPattern(raw, range) : raw
}

/**
 * @param bitLength - Number of bits the field occupies on the wire.
 * @param isSigned - Whether to interpret the field as two's-complement signed.
 * @param sentinelRaw - Raw "not available" sentinel bit pattern, or
 * `undefined` if none has been configured yet.
 */
const buildByte = (bitLength: number, isSigned: boolean, sentinelRaw: number | undefined): ByteSchema => {
  const range = 2 ** bitLength
  const max = isSigned ? range / 2 - 1 : range - 1
  const min = isSigned ? -(range / 2) : 0
  const sentinel = resolveSentinel(sentinelRaw, isSigned, range)

  return Object.assign(makeInnerByteSchema(min, max, sentinel), {
    length: (newBitLength: number) => buildByte(newBitLength, isSigned, sentinelRaw),
    signed: () => buildByte(bitLength, true, sentinelRaw),
    unsigned: () => buildByte(bitLength, false, sentinelRaw),
    sentinel: (raw: number) => buildByte(bitLength, isSigned, raw),
  })
}

/**
 * Builds a zod schema for a Ruuvi wire-format integer field. Defaults to a
 * 16-bit unsigned integer with no sentinel configured; refine with
 * `.length()`, `.signed()`/`.unsigned()`, and `.sentinel()`.
 */
export const byte = (): ByteSchema => buildByte(DEFAULT_BIT_LENGTH, false, undefined)
