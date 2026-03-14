import { afterEach, describe, test, vi } from 'vitest'
import { createWriter } from './influxdb-writer'
import type { InfluxDB } from '@influxdata/influxdb-client'
import type { ScannerEvent } from '@scanner/scanner'

const writePointMock = vi.fn()
const flushMock = vi.fn()
const influxdb = { getWriteApi: vi.fn(() => ({ writePoint: writePointMock, flush: flushMock })) } as unknown as InfluxDB

describe('influxdb-writer', () => {
  const writer = createWriter({ client: influxdb })

  afterEach(() => {
    vi.resetAllMocks()
  })

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
      tags: { dataFormat: '5', address: 'mock-address', alias: 'mock-alias' },
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
  test('should filter undefined values', async ({ expect }) => {
    await writer.handleEvent({
      data: {
        dataFormat: '6',
        address: 'mock-address-no-alias',
        humidity: undefined,
        pressure: undefined,
        temperature: undefined,
        luminosity: undefined,
        'pm2.5': undefined,
        calibration: false,
        co2: 1,
        nox: 2,
        voc: 3,
        sequence: 4,
      },
      metadata: { timestamp: new Date() },
    })

    expect(writePointMock).toHaveBeenCalledTimes(1)
    expect(writePointMock).toHaveBeenCalledWith({
      name: 'ruuvi_measurement',
      tags: { dataFormat: '6', address: 'mock-address-no-alias' },
      fields: { co2: '1', nox: '2', voc: '3', sequence: '4' },
    })
    expect(flushMock).toHaveBeenCalledTimes(1)
  })
  test('should not write same sequence twice in a row', async ({ expect }) => {
    const event = {
      data: {
        dataFormat: 'E1',
        address: 'mock-address-no-alias',
        humidity: undefined,
        pressure: undefined,
        temperature: undefined,
        luminosity: undefined,
        'pm1.0': undefined,
        'pm2.5': undefined,
        'pm4.0': undefined,
        'pm10.0': undefined,
        calibration: false,
        co2: 1,
        nox: 2,
        voc: 3,
        sequence: 5,
      },
      metadata: { timestamp: new Date() },
    } satisfies ScannerEvent
    await writer.handleEvent(event)
    await writer.handleEvent(event)

    expect(writePointMock).toHaveBeenCalledTimes(1)
    expect(writePointMock).toHaveBeenCalledWith({
      name: 'ruuvi_measurement',
      tags: { dataFormat: 'E1', address: 'mock-address-no-alias' },
      fields: { co2: '1', nox: '2', voc: '3', sequence: '5' },
    })
    expect(flushMock).toHaveBeenCalledTimes(1)
  })
})
