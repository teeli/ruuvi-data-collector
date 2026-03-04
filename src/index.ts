import { scanner } from '@scanner/scanner'
import { config, type Config } from './config'

const main = async (config: Config): Promise<void> => {
  await scanner({
    onEvent: (event) => {
      config.writerConfig.adapter(event)
    },
  })
}

void main(config)
