export const DATA_FORMAT_5 = 5 as const
export const DATA_FORMAT_6 = 6 as const
export const DATA_FORMAT_E1 = 0xe1 as const

export const SUPPORTED_DATA_FORMATS = [DATA_FORMAT_5, DATA_FORMAT_6, DATA_FORMAT_E1] as const

export type DataFormat = (typeof SUPPORTED_DATA_FORMATS)[number]

export const DATA_FORMAT_INDEX = 0 as const
