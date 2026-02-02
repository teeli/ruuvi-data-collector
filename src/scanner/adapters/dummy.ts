import type { ScannerAdapter } from '@scanner/types'

export const dummy: ScannerAdapter = async (params) => {
  setInterval(() => {
    params.onData({ data: Buffer.from('foo') })
  }, 500)
}
