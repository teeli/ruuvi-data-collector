import { scanner } from '@scanner/scanner'
import { config } from './config'

const main = async (): Promise<void> => {
  await scanner({
    onEvent: (event) => {
      config.writerConfig.adapter(event)
    },
  })
}

void main()
