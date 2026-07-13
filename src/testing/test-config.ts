import { defineConfig } from '@config/config'
import { join } from 'node:path'

const testLogDir = process.env.RUUVI_TEST_LOG_DIR
if (!testLogDir) {
  throw new Error('RUUVI_TEST_LOG_DIR is not set — src/testing/global-setup.ts must run first')
}

export const testLogFile = join(testLogDir, 'test.log')

export const testConfig = defineConfig({
  aliases: { 'mock-address': 'mock-alias' },
  influxdb: { bucket: 'dummy', org: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
  log: { level: 'debug', file: testLogFile },
})
