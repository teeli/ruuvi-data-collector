import type { WriterAdapter } from '@writers/types'

export const consoleWriter: WriterAdapter = (data) => {
  console.log('[info]', data)
}
