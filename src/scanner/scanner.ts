import { getLogger } from '@logger/logger'
import type { RuuviData } from '@scanner/ruuvi-data-schema'
import { RuuviDataSchema } from '@scanner/ruuvi-data-schema'
import type { AdapterState, Peripheral } from '@stoprocent/noble'
import noble from '@stoprocent/noble'

const RUUVI_COMPANY_CODE = 0x0499

const ruuviDevices = new Map<string, Peripheral>()

type ScannerEventMetadata = { timestamp: Date }
export type ScannerEvent = { metadata: ScannerEventMetadata; data: RuuviData }
type ScannerParams = { onEvent: (event: ScannerEvent) => Promise<void> }
type StartScanner = () => Promise<void>
type CloseScanner = () => Promise<void>
export type Scanner = { start: StartScanner; close: CloseScanner }
type CreateScanner = (params: ScannerParams) => Promise<Scanner>

export const createScanner: CreateScanner = async (params) => {
  const logger = await getLogger(['ruuvi', 'scanner'])
  logger.debug(`Initializing scanner...`)

  const inFlightEvents = new Set<Promise<void>>()

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

  const handleDiscover = async (peripheral: Peripheral): Promise<void> => {
    if (isRuuviDevice(peripheral)) {
      if (!ruuviDevices.has(peripheral.id) && peripheral.connectable) {
        logger.info(`Found a new Ruuvi device: ${peripheral.advertisement.localName}`, { peripheral })
        ruuviDevices.set(peripheral.id, peripheral)
      }

      const { data, success, error } = RuuviDataSchema.safeParse(readManufacturerData(peripheral))
      if (error) {
        logger.warn('Parse error', error)
      }
      if (success) {
        const metadata = { timestamp: new Date(), eventType: 'RuuviTag' }
        try {
          const eventPromise = params.onEvent({ data, metadata })
          inFlightEvents.add(eventPromise)
          await eventPromise
          inFlightEvents.delete(eventPromise)
        } catch (error) {
          logger.error('onEvent handler failed {error}', { error })
        }
      }
    }
  }

  const handleStateChange = async (state: AdapterState) => {
    logger.debug(`BLE adapter state change: ${state}`, { state })
    if (state === 'poweredOn') {
      try {
        await noble.startScanningAsync(undefined, true)
      } catch (error) {
        logger.error('BLE scan start failed', { error })
        await noble.stopScanningAsync()
      }
    } else if (state === 'poweredOff') {
      await noble.stopScanningAsync()
    }
  }

  const start: StartScanner = async () => {
    logger.info('Starting the BLE scanner...')
    try {
      noble.on('stateChange', handleStateChange)
      noble.on('discover', handleDiscover)
      await noble.waitForPoweredOnAsync()
    } catch (error) {
      logger.error('BLE discovery failed', { error })
      await noble.stopScanningAsync()
    }
  }

  const close: CloseScanner = async () => {
    logger.info('Closing the BLE scanner...')
    noble.off('stateChange', handleStateChange)
    noble.off('discover', handleDiscover)
    await noble.stopScanningAsync()
    await Promise.all(inFlightEvents)
  }

  return { start, close }
}
