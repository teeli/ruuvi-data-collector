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

export const scanner: Scanner = async (params) => {
  const handleDiscover = (peripheral: Peripheral): void => {
    if (isRuuviDevice(peripheral)) {
      if (!ruuviDevices.has(peripheral.id) && peripheral.connectable) {
        ruuviDevices.set(peripheral.id, peripheral)
        void peripheral.connectAsync()
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

  try {
    await noble.waitForPoweredOnAsync()
    await noble.startScanningAsync()
    noble.on('discover', handleDiscover)
  } catch (e) {
    console.error('Bluetooth LE discovery failed', e)
    await noble.stopScanningAsync()
  }
}

const readManufacturerData = (peripheral: Peripheral) => {
  const manufacturerData = peripheral.advertisement.manufacturerData
  return manufacturerData.slice(2)
}

const isRuuviDevice = (peripheral: Peripheral) => {
  const manufacturerData = peripheral.advertisement.manufacturerData
  return manufacturerData && manufacturerData.readUInt16LE(0) === RUUVI_COMPANY_CODE
}
