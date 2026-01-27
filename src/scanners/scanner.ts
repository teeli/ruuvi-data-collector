import type { Scanner } from './types'

export const scanner: Scanner = (params) => {
  params.adapter({ onData: (event) => params.onEvent(params.parser(event)) })
}
