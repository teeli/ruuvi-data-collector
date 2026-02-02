import noble from '@stoprocent/noble'
import { type Peripheral } from '@stoprocent/noble'
import type { ScannerAdapter } from '@scanner/types'

const RUUVI_COMPANY_CODE = 0x0499

export const ble: ScannerAdapter = async (params) => {
  const init = (peripheral: Peripheral) => {
    const manufacturerData = peripheral.advertisement.manufacturerData
    if (manufacturerData && manufacturerData.readUInt16LE(0) === RUUVI_COMPANY_CODE) {
      peripheral.connect()
      const name = peripheral.advertisement.localName || peripheral.address || peripheral.id
      const dataFormat = manufacturerData.readUInt8(2)
      console.log(`Found ${name}`, {
        dataFormat: dataFormat.toString(16).toUpperCase(),
        address: peripheral.address,
        id: peripheral.id,
      })

      params.onData({ data: manufacturerData.slice(2) })
    }
  }

  try {
    await noble.waitForPoweredOnAsync()
    await noble.startScanningAsync()
    noble.on('discover', init)
  } catch {
    await noble.stopScanningAsync()
  }
}
