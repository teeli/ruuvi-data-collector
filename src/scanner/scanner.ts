import type { Scanner } from '@scanner/types'

import { parser } from '@scanner/parser/parser'

export const scanner: Scanner = (params) => {
  params.adapter({ onData: (event) => params.onEvent(parser(event)) })
}
