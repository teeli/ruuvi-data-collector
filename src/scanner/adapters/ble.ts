import noble from '@stoprocent/noble'
import { type Peripheral } from '@stoprocent/noble'
import type { ScannerAdapter } from '@scanner/types'

const RUUVI_COMPANY_CODE = 0x0499
const ruuviDevices = new Map<string, Peripheral>()

export const ble: ScannerAdapter = async (params) => {
  const readManufacturerData = (peripheral: Peripheral) => {
    const manufacturerData = peripheral.advertisement.manufacturerData
    params.onData({ data: manufacturerData.slice(2) })
  }

  const handleDiscover = (peripheral: Peripheral) => {
    // console.log('discover', peripheral.id, isRuuviDevice(peripheral), ruuviDevices.has(peripheral.id))
    if (isRuuviDevice(peripheral)) {
      if (!ruuviDevices.has(peripheral.id)) {
        ruuviDevices.set(peripheral.id, peripheral)

        if (params?.onDiscover) {
          params.onDiscover({ address: peripheral.address })
        }

        peripheral.connectAsync()
      }

      readManufacturerData(peripheral)
    }
  }

  try {
    await noble.waitForPoweredOnAsync()
    await noble.startScanningAsync()
    noble.on('discover', handleDiscover)
  } catch (e) {
    console.error('BLE discovery failed', e)
    await noble.stopScanningAsync()
  }
}

const isRuuviDevice = (peripheral: Peripheral) => {
  const manufacturerData = peripheral.advertisement.manufacturerData
  return manufacturerData && manufacturerData.readUInt16LE(0) === RUUVI_COMPANY_CODE
}
