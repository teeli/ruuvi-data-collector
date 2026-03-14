import { defineConfig } from '@config/config'

defineConfig({
  aliases: { 'mock-address': 'mock-alias' },
  influxdb: { bucket: 'dummy', org: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
})
