/* oxlint-disable no-console */
import path from 'path'
import url from 'url'
const target = process.cwd()
const dirname = path.dirname(url.fileURLToPath(import.meta.url))
const input = Bun.file(path.join(dirname, 'example.ts'))
const configFileName = 'config.ts'
const output = Bun.file(path.join(target, configFileName))

const generate = async (): Promise<void> => {
  console.log('Creating configuration file.')

  if (!(await input.exists())) {
    console.error('Configuration template file not found.')
    process.exit(1)
  }

  if (await output.exists()) {
    console.error('Config file already exists.')
    process.exit(1)
  }

  await Bun.write(output, input)
  console.log('Generated example config.')
}

void generate()
