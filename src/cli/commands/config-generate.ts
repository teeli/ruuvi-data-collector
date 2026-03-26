/* oxlint-disable no-console */
import path from 'path'
import url from 'url'

const target = process.cwd()
const dirname = path.dirname(url.fileURLToPath(import.meta.url))
const templatePath = path.join(dirname, '../assets/config-template.ts')
const configFileName = 'config.ts'
const outputPath = path.join(target, configFileName)

const configGenerate = async (): Promise<void> => {
  const input = Bun.file(templatePath)
  const output = Bun.file(outputPath)
  console.log('Creating configuration file.')

  if (!(await input.exists())) {
    console.error('Configuration template file not found.')
    process.exit(1)
  }

  if (await output.exists()) {
    console.error('Config file already exists.')
    process.exit(1)
  }

  const writer = output.writer()
  writer.write(await input.arrayBuffer())
  writer.end()

  console.log('Generated example config.')
}

await configGenerate()
