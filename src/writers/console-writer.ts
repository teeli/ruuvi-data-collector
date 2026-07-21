import type { ScannerEvent } from '@scanner/scanner'
import { resolveAlias } from '@config/resolve-alias'

const fixedLength = (str: string, len: number = 15, alignRight: boolean = false) => {
  const s = str.substring(0, len)
  if (alignRight) {
    return s.padStart(len, ' ')
  }
  return s.padEnd(len, ' ')
}

export const createConsoleWriter = async (): Promise<{ handleEvent: (event: ScannerEvent) => Promise<void> }> => {
  const handleEvent = async (event: ScannerEvent): Promise<void> => {
    const address = event.data.address ?? 'unknown'
    const alias = await resolveAlias(address)
    const columns = [
      fixedLength(alias ?? address, 20),
      fixedLength(event.data.dataFormat, 3),
      fixedLength(`${event.data?.temperature?.toFixed(2)}°C`, 10, true),
      fixedLength(`${event.data?.humidity?.toFixed(2)}%`, 10, true),
      fixedLength(`${event.data?.pressure} Pa`, 10, true),
      fixedLength(`${'luminosity' in event.data ? event.data.luminosity : 'n/a'} lux`, 13, true),
      fixedLength(`${event.metadata.rssi ?? 'n/a'} dBm`, 10, true),
    ] as const
    // oxlint-disable-next-line no-console
    console.log('|', columns.join(' | '), '|')
  }

  return { handleEvent }
}
