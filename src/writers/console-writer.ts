import type { WriterAdapter } from '@writers/types'

const toPrecision = (value: number, decimals: number = 1): number =>
  Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)

const fixedLength = (str: string, len: number = 15, alignRight: boolean = false) => {
  const s = str.substring(0, len)
  if (alignRight) {
    return s.padStart(len, ' ')
  }
  return s.padEnd(len, ' ')
}

export const consoleWriter: WriterAdapter = (event) => {
  const columns = [
    fixedLength(event.data.alias ?? event.data.address, 20),
    fixedLength(`${event.data.temperature.toFixed(2)}°C`, 10, true),
    fixedLength(`${event.data.humidity.toFixed(2)}%`, 10, true),
    fixedLength(`${event.data.pressure} Pa`, 10, true),
  ] as const
  console.log('|', columns.join(' | '), '|')
}
