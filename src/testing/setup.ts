import { vi } from 'vitest'

vi.mock('../../config', async () => {
  const { testConfig } = await import('./test-config')
  return { default: testConfig }
})
