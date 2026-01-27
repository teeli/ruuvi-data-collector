/**
 * Ruuvi Data Format E1 parse
 *
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-e1
 */
import type { Parse, RuuviAir } from '../types'

const TEMPERATURE_INDEX = 1 as const
const TEMPERATURE_MIN = -32767 as const
const TEMPERATURE_MAX = 32767 as const
const HUMIDITY_INDEX = 3 as const
const HUMIDITY_MIN = 0 as const
const HUMIDITY_MAX = 40_000 as const
const PRESSURE_INDEX = 5 as const
const PRESSURE_MIN = 0 as const
const PRESSURE_MAX = 65_534 as const
const PM_1_0_INDEX = 7 as const
const PM_2_5_INDEX = 9 as const
const PM_4_0_INDEX = 11 as const
const PM_10_0_INDEX = 13 as const
const PM_MIN = 0 as const
const PM_MAX = 10_000 as const
const CO2_INDEX = 15 as const
const CO2_MIN = 0 as const
const CO2_MAX = 40_000 as const
const VOC_INDEX = 17 as const
const VOC_MIN = 0 as const
const VOC_MAX = 500 as const
const NOX_INDEX = 18 as const
const NOX_MIN = 0 as const
const NOX_MAX = 500 as const
const LUMINOSITY_INDEX = 19 as const
const LUMINOSITY_MIN = 0 as const
const LUMINOSITY_MAX = 14_428_400 as const
const SEQUENCE_INDEX = 25 as const
const SEQUENCE_MIN = 0 as const
const SEQUENCE_MAX = 16_777_214 as const
const FLAGS_INDEX = 28 as const
const MAC_ADDRESS_INDEX = 34 as const

export const parseDataFormatE1: Parse<RuuviAir> = (data) => {
  const flags = data.readUint8(FLAGS_INDEX)
  const calibration = (flags & 0b0000_0001) === 1
  const noxFlag = (flags & 0b1000_0000) >> 7
  const vocFlag = (flags & 0b0100_0000) >> 6

  const temperatureValue = validateRange(data.readIntBE(TEMPERATURE_INDEX, 2), TEMPERATURE_MIN, TEMPERATURE_MAX)
  const temperature = toPrecision(temperatureValue * 0.005)
  const pressureValue = validateRange(data.readUIntBE(PRESSURE_INDEX, 2), PRESSURE_MIN, PRESSURE_MAX)
  const pressure = pressureValue + 50_000
  const humidityValue = validateRange(data.readUIntBE(HUMIDITY_INDEX, 2), HUMIDITY_MIN, HUMIDITY_MAX)
  const humidity = toPrecision(humidityValue * 0.0025)
  const pm10Value = validateRange(data.readUIntBE(PM_1_0_INDEX, 2), PM_MIN, PM_MAX)
  const pm25Value = validateRange(data.readUIntBE(PM_2_5_INDEX, 2), PM_MIN, PM_MAX)
  const pm40Value = validateRange(data.readUIntBE(PM_4_0_INDEX, 2), PM_MIN, PM_MAX)
  const pm100Value = validateRange(data.readUIntBE(PM_10_0_INDEX, 2), PM_MIN, PM_MAX)
  const pm = {
    '1.0': toPrecision(pm10Value * 0.1),
    '2.5': toPrecision(pm25Value * 0.1),
    '4.0': toPrecision(pm40Value * 0.1),
    '10.0': toPrecision(pm100Value * 0.1),
  }
  const co2 = validateRange(data.readUIntBE(CO2_INDEX, 2), CO2_MIN, CO2_MAX)
  const voc = validateRange(data.readUIntBE(VOC_INDEX, 1) * 2 + vocFlag, VOC_MIN, VOC_MAX)
  const nox = validateRange(data.readUIntBE(NOX_INDEX, 1) * 2 + noxFlag, NOX_MIN, NOX_MAX)
  const luminosityValue = validateRange(data.readUIntBE(LUMINOSITY_INDEX, 3), LUMINOSITY_MIN, LUMINOSITY_MAX)
  const luminosity = luminosityValue * 0.01
  const sequence = validateRange(data.readUIntBE(SEQUENCE_INDEX, 3), SEQUENCE_MIN, SEQUENCE_MAX)
  const mac = formatMacAddress(data.readUIntBE(MAC_ADDRESS_INDEX, 6).toString(16))

  return { calibration, temperature, pressure, humidity, pm, co2, voc, nox, luminosity, sequence, mac }
}

/**
 * TODO: Maybe just use Zod?
 */
const validateRange = (value: number, min: number, max: number): number => (value >= min && value <= max ? value : NaN)

const formatMacAddress = (hexStr: string): string | undefined => {
  const a = hexStr.toUpperCase().match(/.{2}/g)
  return a && Array.isArray(a) && a.length === 6 ? a.join(':') : undefined
}

/**
 * TODO: Do we need this?
 */
const toPrecision = (value: number, decimals: number = 4): number =>
  Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
