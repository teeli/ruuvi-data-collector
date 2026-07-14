import { getLogger } from '@logger/logger'
import noble from '@stoprocent/noble'
import type { TestContext } from 'vitest'
import { afterEach, beforeEach, describe, test, vi } from 'vitest'
import type { Scanner, ScannerEvent } from './scanner'
import { createScanner } from './scanner'

vi.mock('@stoprocent/noble')
const nobleMock = vi.mocked(noble)

type LogFn = (message: string, properties?: Record<string, unknown>) => void

const { loggerMock } = vi.hoisted(() => ({
  loggerMock: { info: vi.fn<LogFn>(), warn: vi.fn<LogFn>(), error: vi.fn<LogFn>(), debug: vi.fn<LogFn>() },
}))
vi.mock('@logger/logger', () => ({ getLogger: vi.fn<typeof getLogger>() }))
const getLoggerMock = vi.mocked(getLogger)

const onEvent = vi.fn<(event: ScannerEvent) => Promise<void>>()

type CustomContext = TestContext & { discover: Function; stateChange: Function; scanner: Scanner }

describe('scanner', () => {
  beforeEach<CustomContext>(async (context) => {
    getLoggerMock.mockResolvedValue(loggerMock as unknown as Awaited<ReturnType<typeof getLogger>>)

    nobleMock.on.mockImplementation((event, listener) => {
      if (event === 'stateChange') {
        context.stateChange = listener
      }
      if (event === 'discover') {
        context.discover = listener
      }

      return nobleMock
    })

    context.scanner = await createScanner({ onEvent })
    await context.scanner.start()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test<CustomContext>('should start scanning when adapter is powered on', async ({ expect, stateChange }) => {
    stateChange('poweredOn')

    expect(nobleMock.waitForPoweredOnAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).toHaveBeenCalledWith(undefined, true)
    expect(nobleMock.stopScanningAsync).not.toHaveBeenCalled()
  })

  test<CustomContext>('should stop scanning when adapter is powered off', async ({ expect, stateChange }) => {
    stateChange('poweredOff')

    expect(nobleMock.waitForPoweredOnAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).not.toHaveBeenCalled()
    expect(nobleMock.stopScanningAsync).toHaveBeenCalledTimes(1)
  })

  test<CustomContext>('should stop scanning when start scanning throws', async ({ expect, stateChange }) => {
    nobleMock.startScanningAsync.mockImplementation(() => {
      throw new Error('mock error')
    })

    stateChange('poweredOn')

    expect(nobleMock.waitForPoweredOnAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).toHaveBeenCalledWith(undefined, true)
    expect(nobleMock.stopScanningAsync).toHaveBeenCalledTimes(1)
  })

  test<CustomContext>('should remove listeners when powering on fails', async ({ expect }) => {
    nobleMock.waitForPoweredOnAsync.mockRejectedValueOnce(new Error('mock error'))

    const failedScanner = await createScanner({ onEvent })
    await failedScanner.start()

    expect(nobleMock.off).toHaveBeenCalledWith('stateChange', expect.any(Function))
    expect(nobleMock.off).toHaveBeenCalledWith('discover', expect.any(Function))
    expect(nobleMock.stopScanningAsync).toHaveBeenCalledTimes(1)
  })

  test<CustomContext>('should stop scanning when close is called', async ({ expect, stateChange, scanner }) => {
    stateChange('poweredOn')

    await scanner.close()

    expect(nobleMock.waitForPoweredOnAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).toHaveBeenCalledTimes(1)
    expect(nobleMock.startScanningAsync).toHaveBeenCalledWith(undefined, true)
    expect(nobleMock.stopScanningAsync).toHaveBeenCalledTimes(1)
  })

  test<CustomContext>('should wait for an in-flight onEvent call before close resolves', async ({
    expect,
    discover,
    scanner,
  }) => {
    const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    let resolveEvent: () => void = () => {}
    onEvent.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveEvent = resolve
        })
    )

    const discoverPromise = discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })
    await vi.waitFor(() => expect(onEvent).toHaveBeenCalled())

    let closed = false
    const closePromise = scanner.close().then(() => {
      closed = true
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(closed).toBe(false)

    resolveEvent()
    await closePromise

    expect(closed).toBe(true)
    await discoverPromise
  })

  test<CustomContext>('should not reject close when an in-flight onEvent call rejects', async ({
    expect,
    discover,
    scanner,
  }) => {
    const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    let rejectEvent: (error: Error) => void = () => {}
    onEvent.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectEvent = reject
        })
    )

    const discoverPromise = discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })
    await vi.waitFor(() => expect(onEvent).toHaveBeenCalled())

    const closePromise = scanner.close()

    rejectEvent(new Error('write failed'))

    await expect(closePromise).resolves.toBeUndefined()
    await discoverPromise
  })

  test<CustomContext>('should call onEvent when ruuvi device is discovered', async ({ expect, discover }) => {
    const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    await discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })
    await discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })

    // discover called two times
    expect(onEvent).toHaveBeenCalledTimes(2)
    expect(onEvent).toHaveBeenCalledWith({
      data: {
        address: 'CB:B8:33:4C:88:4F',
        temperature: 24.3,
        humidity: 53.49,
        pressure: 100044,
        dataFormat: '5',
        accelerationX: 0.004,
        accelerationY: -0.004,
        accelerationZ: 1.036,
        txPower: 4,
        voltage: 2.977,
        movement: 66,
        sequence: 205,
      },
      metadata: { timestamp: expect.any(Date), eventType: 'RuuviTag' },
    })
  })

  test<CustomContext>('should not crash when onEvent rejects', async ({ expect, discover }) => {
    const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    onEvent.mockRejectedValueOnce(new Error('write failed'))

    await expect(
      discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })
    ).resolves.toBeUndefined()

    expect(onEvent).toHaveBeenCalledTimes(1)
  })

  test<CustomContext>('should not call onEvent when invalid data is received', async ({ expect, discover }) => {
    const data = Buffer.from('9904FF', 'hex')
    discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })

    expect(onEvent).not.toHaveBeenCalled()
  })

  test<CustomContext>('should not call onEvent when non-ruuvi device is discovered', async ({ expect, discover }) => {
    const data = Buffer.from('00000512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    discover({ advertisement: { manufacturerData: data }, id: 'dummy-peripheral-not-ruuvi' })

    expect(onEvent).not.toHaveBeenCalled()
  })

  test<CustomContext>('should not throw and should not call onEvent when truncated ruuvi data is received', async ({
    expect,
    discover,
  }) => {
    const data = Buffer.from('990405', 'hex')

    expect(() => discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })).not.toThrow()
    expect(onEvent).not.toHaveBeenCalled()
  })

  describe('on new device discovery', async () => {
    const discoveryLogMessage =
      'Found a new Ruuvi device: (address: {address}, name: {peripheral.advertisement.localName}, alias: {alias})'

    test<CustomContext>('should log the address embedded in the payload and the alias for a device with a configured alias', async ({
      expect,
      discover,
    }) => {
      // MAC embedded in the payload is AA:BB:CC:DD:EE:FF, aliased to 'mock-alias' in src/testing/test-config.ts
      const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CDAABBCCDDEEFF', 'hex')

      await discover({ advertisement: { manufacturerData: data }, id: 'dummy-ruuvi-peripheral' })

      expect(loggerMock.info).toHaveBeenCalledWith(discoveryLogMessage, {
        address: 'AA:BB:CC:DD:EE:FF',
        alias: 'mock-alias',
        peripheral: expect.anything(),
      })
    })

    test<CustomContext>('should log the address embedded in the payload and an undefined alias for device without a configured alias', async ({
      expect,
      discover,
    }) => {
      // MAC embedded in the payload is 11:22:33:44:55:66, which has no alias configured
      const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CD112233445566', 'hex')

      await discover({
        advertisement: { manufacturerData: data, localName: 'Ruuvi 1234' },
        id: 'dummy-ruuvi-peripheral',
      })

      expect(loggerMock.info).toHaveBeenCalledWith(discoveryLogMessage, {
        address: '11:22:33:44:55:66',
        alias: undefined,
        peripheral: expect.anything(),
      })
    })

    test<CustomContext>('should log the peripheral address, normalized to uppercase, when manufacturer data fails to parse,', async ({
      expect,
      discover,
    }) => {
      // Regresses the Linux-only bug: manufacturer data has the right company code but is otherwise
      // truncated, so RuuviDataSchema can't parse an embedded MAC out of it. The peripheral's own BLE
      // address (which noble can report lowercase) is used instead, uppercased to match how aliases
      // are keyed in config.
      const data = Buffer.from('990405', 'hex')

      await discover({
        advertisement: { manufacturerData: data },
        id: 'dummy-ruuvi-peripheral',
        address: 'aa:bb:cc:dd:ee:ff',
      })

      expect(loggerMock.info).toHaveBeenCalledWith(discoveryLogMessage, {
        address: 'AA:BB:CC:DD:EE:FF',
        alias: 'mock-alias',
        peripheral: expect.anything(),
      })
    })
  })
})
