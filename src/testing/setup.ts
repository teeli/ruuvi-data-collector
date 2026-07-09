import { defineConfig, setConfig } from '@config/config'

setConfig(
  defineConfig({
    aliases: { 'mock-address': 'mock-alias' },
    influxdb: { bucket: 'dummy', org: 'dummy', connection: { url: 'http://dummy', token: 'dummy' } },
  })
)
