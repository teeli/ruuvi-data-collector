import { resolveAlias } from '@config/resolve-alias'
import { getLogger } from '@logger/logger'
import type { RuuviData } from '@scanner/ruuvi-data-schema'
import { RuuviDataSchema } from '@scanner/ruuvi-data-schema'
import type { AdapterState, Peripheral } from '@stoprocent/noble'
import noble from '@stoprocent/noble'

const RUUVI_COMPANY_CODE = 0x0499

export type ScannerEvent = { metadata: { timestamp: Date }; data: RuuviData }

export interface Scanner {
  start: () => Promise<void>
  close: () => Promise<void>
}

type ScannerConfig = { onEvent: (event: ScannerEvent) => Promise<void> }
type CreateScanner = (scannerConfig: ScannerConfig) => Promise<Scanner>

export const createScanner: CreateScanner = async ({ onEvent }) => {
  const logger = await getLogger(['ruuvi', 'scanner'])
  logger.info(`Initializing scanner...`)

  const ruuviDevices = new Map<string, Peripheral>()
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
      const { data, success, error } = RuuviDataSchema.safeParse(readManufacturerData(peripheral))
      if (error) {
        logger.warn('Failed to parse manufacturer data: {error}', error)
      }

      if (!ruuviDevices.has(peripheral.id)) {
        ruuviDevices.set(peripheral.id, peripheral)
        const address = data?.address ?? peripheral.address?.toUpperCase()
        const alias = await resolveAlias(address)
        logger.info(
          `Found a new Ruuvi device: (address: {address}, name: {peripheral.advertisement.localName}, alias: {alias})`,
          { address, alias, peripheral }
        )
      }

      if (success) {
        const metadata = { timestamp: new Date() }
        const eventPromise = onEvent({ data, metadata })
        inFlightEvents.add(eventPromise)
        try {
          await eventPromise
        } catch (error) {
          logger.error('onEvent handler failed: {error}', { error })
        } finally {
          inFlightEvents.delete(eventPromise)
        }
      }
    }
  }

  const handleStateChange = async (state: AdapterState) => {
    logger.debug(`BLE adapter state change: {state}`, { state })
    if (state === 'poweredOn') {
      try {
        await noble.startScanningAsync(undefined, true)
      } catch (error) {
        logger.error('BLE scan start failed: {error}', { error })
        await noble.stopScanningAsync()
      }
    } else if (state === 'poweredOff') {
      await noble.stopScanningAsync()
    }
  }

  const start: Scanner['start'] = async () => {
    logger.info('Starting the BLE scanner...')
    try {
      noble.on('stateChange', handleStateChange)
      noble.on('discover', handleDiscover)
      await noble.waitForPoweredOnAsync()
    } catch (error) {
      logger.error('BLE discovery failed: {error}', { error })
      noble.off('stateChange', handleStateChange)
      noble.off('discover', handleDiscover)
      await noble.stopScanningAsync()
    }
  }

  const close: Scanner['close'] = async () => {
    logger.info('Closing the BLE scanner...')
    noble.off('stateChange', handleStateChange)
    noble.off('discover', handleDiscover)
    await noble.stopScanningAsync()
    await Promise.allSettled(inFlightEvents)
  }

  return { start, close }
}
