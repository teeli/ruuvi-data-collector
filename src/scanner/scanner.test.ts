import { afterEach, beforeEach, describe, test, vi } from 'vitest'
import type { TestContext } from 'vitest'
import { scanner } from './scanner'
import noble from '@stoprocent/noble'

vi.mock('@stoprocent/noble')
const nobleMock = vi.mocked(noble)

const onEvent = vi.fn()

type CustomContext = TestContext & { discover: Function }

describe('scanner', () => {
  beforeEach<CustomContext>(async (context) => {
    nobleMock.on.mockImplementation((event, listener) => {
      if (event === 'discover') {
        context.discover = listener
      }

      return nobleMock
    })

    await scanner({ onEvent })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test<CustomContext>('should call onEvent when ruuvi device is discovered', async ({ expect, discover }) => {
    const data = Buffer.from('99040512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    const connectAsync = vi.fn()
    discover({
      advertisement: { manufacturerData: data },
      id: 'dummy-ruuvi-peripheral',
      connectable: true,
      connectAsync,
    })
    discover({
      advertisement: { manufacturerData: data },
      id: 'dummy-ruuvi-peripheral',
      connectable: true,
      connectAsync,
    })

    // should only connect once to the same peripheral
    expect(connectAsync).toHaveBeenCalledTimes(1)

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

  test<CustomContext>('should not call onEvent when invalid data is received', async ({ expect, discover }) => {
    const data = Buffer.from('9904058000FFFFFFFF800080008000FFFFFFFFFFFFFFFFFFFFFF', 'hex')
    const connectAsync = vi.fn()
    discover({
      advertisement: { manufacturerData: data },
      id: 'dummy-ruuvi-peripheral',
      connectable: true,
      connectAsync,
    })

    expect(onEvent).not.toHaveBeenCalled()
  })

  test<CustomContext>('should not call onEvent when non-ruuvi device is discovered', async ({ expect, discover }) => {
    const data = Buffer.from('00000512FC5394C37C0004FFFC040CAC364200CDCBB8334C884F', 'hex')
    const connectAsync = vi.fn()
    discover({
      advertisement: { manufacturerData: data },
      id: 'dummy-peripheral-not-ruuvi',
      connectable: true,
      connectAsync,
    })

    expect(connectAsync).not.toHaveBeenCalled()
    expect(onEvent).not.toHaveBeenCalled()
  })
})
