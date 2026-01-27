import type { WriterAdapter } from '../types'

export const consoleWriter: WriterAdapter = (data) => {
  console.log('[info]', data)
}
