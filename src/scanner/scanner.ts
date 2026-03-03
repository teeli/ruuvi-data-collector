import type { Scanner } from '@scanner/types'

import { RuuviDataSchema } from '@scanner/schema/ruuvi-data-schema.ts'

export const scanner: Scanner = (params) => {
  params.config.adapter({
    onData: (event) => {
      const result = RuuviDataSchema.safeParse(event.data)

      if (result.success) {
        return params.onEvent({ data: result.data, metadata: { timestamp: new Date(), eventType: 'RuuviTag' } })
      }
    },
  })
}
