import { scanner } from '@scanner/scanner'
import { consoleWriter } from '@writers/console-writer'

const main = async (): Promise<void> => {
  await scanner({
    onEvent: (event) => {
      consoleWriter(event)
    },
  })
}

void main()
