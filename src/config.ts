export type Config = {
  /**
   * Device aliases as key value pairs
   * key: address
   * value: alias
   *
   * @example {'ff:ff:ff': 'Bedroom'}
   */
  aliases?: Record<string, string>
}

export const config: Config = {
  aliases: {
    'FE:9B:DD:55:B5:E9': 'Living Room',
    'C0:C4:FC:C7:A0:47': 'Sauna',
    'F0:5F:ED:6D:89:D9': 'Fridge',
    'D0:6E:26:73:2E:EE': 'Bedroom',
    'EE:3A:BC:95:29:E1': 'Balcony',
    'D3:9B:A3:B0:6A:5B': 'Freezer',
    'E9:13:1F:99:73:D6': 'Office',
    'D9:58:37:9B:BD:05': 'Movable sensor',
    'D5:8E:52:5D:45:AC': 'Living Room (Air)',
    '5D:45:AC': 'Living Room (Air)',
  },
}
