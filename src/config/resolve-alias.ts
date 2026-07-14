import { getConfig } from '@config/config'

/**
 * Ruuvi's "short" (3-byte) address — used by data format 6 — is always the 24 least significant
 * bits of the device's full (6-byte) MAC address
 * (https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-6), so a short
 * address with no exact alias match falls back to the suffix of any full-form alias key.
 */
export const resolveAlias = async (address: string | undefined): Promise<string | undefined> => {
  const { aliases } = await getConfig()

  if (!aliases || !address) {
    return undefined
  }

  if (aliases[address]) {
    return aliases[address]
  }

  const fullMac = Object.keys(aliases).find((key) => key.endsWith(`:${address}`))
  return fullMac ? aliases[fullMac] : undefined
}
