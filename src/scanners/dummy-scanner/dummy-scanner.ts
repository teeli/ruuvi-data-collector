import type { ScannerAdapter } from '../types'

export const dummyAdapter: ScannerAdapter = async (params) => {
  setInterval(() => {
    params.onData({ data: 'foo' })
  }, 500)
}
