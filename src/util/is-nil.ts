type Nil = null | undefined
export const isNil = <T>(val: T | Nil): val is Nil => val === undefined || val === null
