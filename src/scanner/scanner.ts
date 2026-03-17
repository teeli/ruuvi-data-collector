import { RuuviDataSchema } from '@scanner/ruuvi-data-schema'
import type { RuuviData } from '@scanner/ruuvi-data-schema'
import type { Peripheral } from '@stoprocent/noble'
import noble from '@stoprocent/noble'

const RUUVI_COMPANY_CODE = 0x0499

const ruuviDevices = new Map<string, Peripheral>()

type ScannerEventMetadata = { timestamp: Date }
export type ScannerEvent = { metadata: ScannerEventMetadata; data: RuuviData }
type ScannerParams = { onEvent: (event: ScannerEvent) => void }
type Scanner = (params: ScannerParams) => Promise<void>

export const scanner: Scanner = async (params): Promise<void> => {
  const handleDiscover = (peripheral: Peripheral): void => {
    if (isRuuviDevice(peripheral)) {
      if (!ruuviDevices.has(peripheral.id) && peripheral.connectable) {
        ruuviDevices.set(peripheral.id, peripheral)
      }

      const { data, success, error } = RuuviDataSchema.safeParse(readManufacturerData(peripheral))
      if (error) {
        console.warn('Parse error', error)
      }
      if (success) {
        const metadata = { timestamp: new Date(), eventType: 'RuuviTag' }
        params.onEvent({ data, metadata })
      }
    }
  }

  noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
      try {
        await noble.startScanningAsync(undefined, true)
      } catch (e) {
        console.error('Bluetooth LE scan start failed', e)
        await noble.stopScanningAsync()
      }
    } else if (state === 'poweredOff') {
      await noble.stopScanningAsync()
    }
  })

  noble.on('discover', handleDiscover)

  try {
    await noble.waitForPoweredOnAsync()
  } catch (e) {
    console.error('Bluetooth LE discovery failed', e)
    await noble.stopScanningAsync()
  }
}

const readManufacturerData = (peripheral: Peripheral) => {
  const manufacturerData = peripheral.advertisement.manufacturerData
  return manufacturerData.slice(2)
}

const isRuuviDevice = (peripheral: Peripheral): boolean => {
  if (!peripheral.advertisement.manufacturerData || peripheral.advertisement.manufacturerData.length < 2) {
    return false
  }

  return peripheral.advertisement.manufacturerData.readUInt16LE(0) === RUUVI_COMPANY_CODE
}
