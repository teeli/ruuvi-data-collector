import { scanner } from '@scanner/scanner'
import { handleEvent } from '@writers/influxdb-writer'

const main = async (): Promise<void> => {
  await scanner({
    onEvent: (event) => {
      handleEvent(event)
    },
  })
}

void main()
