import type { ScannerEvent } from '@scanner/scanner'
import { afterEach, beforeAll, describe, test, vi } from 'vitest'
import { createConsoleWriter } from './console-writer'

describe('console-writer', () => {
  let writer: Awaited<ReturnType<typeof createConsoleWriter>>

  beforeAll(async () => {
    writer = await createConsoleWriter()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('prints the aliased address and measurements for a known device', async ({ expect }) => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await writer.handleEvent({
      data: {
        dataFormat: '5',
        address: 'AA:BB:CC:DD:EE:FF',
        txPower: 1,
        voltage: 2,
        sequence: 3,
        accelerationX: 4,
        accelerationY: 5,
        accelerationZ: 6,
        humidity: 7,
        pressure: 8,
        temperature: 9,
        movement: 10,
      },
      metadata: { timestamp: new Date() },
    } satisfies ScannerEvent)

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0]?.join(' ')).toContain('mock-alias')
  })
})
