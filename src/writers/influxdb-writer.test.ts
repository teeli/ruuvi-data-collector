import { describe, test, vi } from 'vitest'
import { createWriter } from './influxdb-writer'
import type { InfluxDB } from '@influxdata/influxdb-client'

const writePointMock = vi.fn()
const flushMock = vi.fn()
const writeApi = vi.fn(() => ({ writePoint: writePointMock, flush: flushMock }))
const influxdb = { getWriteApi: writeApi } as unknown as InfluxDB

describe('influxdb-writer', () => {
  const writer = createWriter({ client: influxdb })
  test('should write point to influxdb', async ({ expect }) => {
    await writer.handleEvent({
      data: {
        dataFormat: '5',
        address: 'mock-address',
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
    })

    expect(writePointMock).toHaveBeenCalledTimes(1)
    expect(writePointMock).toHaveBeenCalledWith({
      name: 'ruuvi_measurement',
      tags: { dataFormat: '5', address: 'mock-address' },
      fields: {
        txPower: '1',
        voltage: '2',
        sequence: '3',
        accelerationX: '4',
        accelerationY: '5',
        accelerationZ: '6',
        humidity: '7',
        pressure: '8',
        temperature: '9',
        movement: '10',
      },
    })
    expect(flushMock).toHaveBeenCalledTimes(1)
  })
})
