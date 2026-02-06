import { scanner } from '@scanner/scanner'
import type { Config } from './types'
import { config } from './config'

const main = (config: Config): void => {
  scanner({
    config: config.scannerConfig,
    onEvent: (event) => {
      config.writerConfig.adapter(event)
    },
  })
}

main(config)
