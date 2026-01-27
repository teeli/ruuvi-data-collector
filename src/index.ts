import { scanner } from './scanners/scanner'
import { ruuviDataParser } from './parser/ruuvi-data-parser'
import type { Config } from './types'
import { config } from './config'

const main = (config: Config): void => {
  scanner({
    adapter: config.scannerConfig.adapter,
    parser: ruuviDataParser,
    onEvent: (event) => config.writerConfig.adapter(event),
  })
}

main(config)
