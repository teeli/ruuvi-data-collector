import type { WriterAdapter } from '@writers/types'
import { config } from '../config'

const fixedLength = (str: string, len: number = 15, alignRight: boolean = false) => {
  const s = str.substring(0, len)
  if (alignRight) {
    return s.padStart(len, ' ')
  }
  return s.padEnd(len, ' ')
}

export const consoleWriter: WriterAdapter = (event) => {
  const columns = [
    fixedLength(config?.aliases?.[event.data.address] ?? event.data.address, 20),
    fixedLength(event.data.dataFormat.toString(), 3),
    fixedLength(`${event.data.temperature.toFixed(2)}°C`, 10, true),
    fixedLength(`${event.data.humidity.toFixed(2)}%`, 10, true),
    fixedLength(`${event.data.pressure} Pa`, 10, true),
    fixedLength(`${event.data?.luminosity ?? 'n/a'} lux`, 13, true),
  ] as const
  console.log('|', columns.join(' | '), '|')
}
