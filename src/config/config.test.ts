import { describe, test } from 'vitest'
import { testConfig } from '../testing/test-config'
import { getConfig } from './config'

describe('getConfig', () => {
  test('returns the mocked test config', async ({ expect }) => {
    await expect(getConfig()).resolves.toEqual(testConfig)
  })

  test('memoizes the config across repeated calls', async ({ expect }) => {
    const [first, second] = await Promise.all([getConfig(), getConfig()])
    expect(first).toBe(second)
  })
})
