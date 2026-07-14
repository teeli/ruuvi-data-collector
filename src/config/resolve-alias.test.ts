import { describe, test, vi } from 'vitest'
import type { Config } from '@config/config'
import { getConfig } from '@config/config'
import { resolveAlias } from './resolve-alias'

vi.mock('@config/config')
const getConfigMock = vi.mocked(getConfig)

describe('resolveAlias', () => {
  test('returns undefined when there are no aliases configured', async ({ expect }) => {
    getConfigMock.mockResolvedValue({ aliases: undefined } as unknown as Config)

    await expect(resolveAlias('AA:BB:CC:DD:EE:FF')).resolves.toBeUndefined()
  })

  test('returns undefined when the address is undefined', async ({ expect }) => {
    getConfigMock.mockResolvedValue({ aliases: { 'AA:BB:CC:DD:EE:FF': 'Bedroom' } } as unknown as Config)

    await expect(resolveAlias(undefined)).resolves.toBeUndefined()
  })

  test('returns undefined when the address has no matching alias', async ({ expect }) => {
    getConfigMock.mockResolvedValue({ aliases: { 'AA:BB:CC:DD:EE:FF': 'Bedroom' } } as unknown as Config)

    await expect(resolveAlias('11:22:33:44:55:66')).resolves.toBeUndefined()
  })

  test('resolves a full-form address via an exact match', async ({ expect }) => {
    getConfigMock.mockResolvedValue({ aliases: { 'AA:BB:CC:DD:EE:FF': 'Bedroom' } } as unknown as Config)

    await expect(resolveAlias('AA:BB:CC:DD:EE:FF')).resolves.toBe('Bedroom')
  })

  test('resolves a short-form address by matching the suffix of a full-form alias key', async ({ expect }) => {
    getConfigMock.mockResolvedValue({ aliases: { 'AA:BB:CC:DD:EE:FF': 'Bedroom' } } as unknown as Config)

    await expect(resolveAlias('DD:EE:FF')).resolves.toBe('Bedroom')
  })

  test('does not match a short-form address against a non-suffix occurrence in a full-form key', async ({ expect }) => {
    getConfigMock.mockResolvedValue({ aliases: { 'DD:EE:FF:AA:BB:CC': 'Bedroom' } } as unknown as Config)

    await expect(resolveAlias('DD:EE:FF')).resolves.toBeUndefined()
  })
})
