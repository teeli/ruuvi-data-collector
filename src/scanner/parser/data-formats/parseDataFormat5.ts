/**
 * Ruuvi Data Format 6 parser
 *
 * https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-6
 */
import type { ParseDataFormat } from '@scanner/parser/data-formats/types'
import type { RuuviTag } from '@scanner/types'
import { formatMacAddress, validateRange } from '@scanner/parser/data-formats/common'

const TEMPERATURE_INDEX = 1 as const
const TEMPERATURE_MIN = -32767 as const
const TEMPERATURE_MAX = 32767 as const
const HUMIDITY_INDEX = 3 as const
const HUMIDITY_MIN = 0 as const
const HUMIDITY_MAX = 65_534 as const
const PRESSURE_INDEX = 5 as const
const PRESSURE_MIN = 0 as const
const PRESSURE_MAX = 65_534 as const
const ACCELERATION_X_INDEX = 7 as const
const ACCELERATION_Y_INDEX = 9 as const
const ACCELERATION_Z_INDEX = 11 as const
const ACCELERATION_MIN = -32767 as const
const ACCELERATION_MAX = 32767 as const
const POWER_INFO_INDEX = 13 as const
const VOLTAGE_MIN = 0 as const
const VOLTAGE_MAX = 2_046 as const
const TX_POWER_MIN = 0 as const
const TX_POWER_MAX = 30 as const
const MOVEMENT_INDEX = 15 as const
const MOVEMENT_MIN = 0 as const
const MOVEMENT_MAX = 254 as const
const SEQUENCE_INDEX = 16 as const
const SEQUENCE_MIN = 0 as const
const SEQUENCE_MAX = 65_534 as const
const MAC_ADDRESS_INDEX = 18 as const

export const parseDataFormat5: ParseDataFormat<RuuviTag> = (data, aliases) => {
  const temperatureValue = validateRange(data.readIntBE(TEMPERATURE_INDEX, 2), TEMPERATURE_MIN, TEMPERATURE_MAX)
  const temperature = temperatureValue * 0.005
  const pressureValue = validateRange(data.readUIntBE(PRESSURE_INDEX, 2), PRESSURE_MIN, PRESSURE_MAX)
  const pressure = pressureValue + 50_000
  const humidityData = data.readUIntBE(HUMIDITY_INDEX, 2)

  const humidityValue = validateRange(humidityData, HUMIDITY_MIN, HUMIDITY_MAX)
  const humidity = humidityValue * 0.0025
  const x = data.readIntBE(ACCELERATION_X_INDEX, 2)
  const accelerationXyValue = validateRange(x, ACCELERATION_MIN, ACCELERATION_MAX)
  const y = data.readIntBE(ACCELERATION_Y_INDEX, 2)
  const accelerationYyValue = validateRange(y, ACCELERATION_MIN, ACCELERATION_MAX)
  const z = data.readIntBE(ACCELERATION_Z_INDEX, 2)
  const accelerationZyValue = validateRange(z, ACCELERATION_MIN, ACCELERATION_MAX)
  const powerInfo = data.readUIntBE(POWER_INFO_INDEX, 2)
  const txPowerData = powerInfo & 0x1f
  const txPower = validateRange(txPowerData, TX_POWER_MIN, TX_POWER_MAX) * 2 - 40
  const voltageData = powerInfo >> 5
  const voltage = (1600 + validateRange(voltageData, VOLTAGE_MIN, VOLTAGE_MAX)) / 1000
  const movement = validateRange(data.readUIntBE(MOVEMENT_INDEX, 1), MOVEMENT_MIN, MOVEMENT_MAX)
  const sequence = validateRange(data.readUIntBE(SEQUENCE_INDEX, 2), SEQUENCE_MIN, SEQUENCE_MAX)
  const macData = data.readUIntBE(MAC_ADDRESS_INDEX, 6)
  const maxHex = macData.toString(16)
  const address = formatMacAddress(maxHex)
  const alias = aliases ? aliases[address] : undefined

  const acceleration = { x: accelerationXyValue / 1000, y: accelerationYyValue / 1000, z: accelerationZyValue / 1000 }

  return { temperature, pressure, humidity, acceleration, movement, sequence, txPower, voltage, address, alias }
}
