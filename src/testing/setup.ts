import { defineConfig } from '@config/config'

defineConfig({
  aliases: {},
  influxdb: { bucket: 'dummy', org: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
})
