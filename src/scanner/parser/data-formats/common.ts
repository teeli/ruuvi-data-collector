export const validateRange = (value: number, min: number, max: number): number =>
  value >= min && value <= max ? value : NaN

export const formatMacAddress = (hexStr: string): string => {
  const a = hexStr.toUpperCase().match(/.{2}/g)
  return a && Array.isArray(a) && a.length > 0 ? a.join(':') : ''
}
