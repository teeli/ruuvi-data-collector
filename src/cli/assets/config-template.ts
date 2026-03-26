import { defineConfig } from '@config/config.ts'

/**
 * This is an example configuration file
 */
export default defineConfig({
  /**
   * Aliases for your known Ruuvi devices. InfluxDB data points will have an alias tag for known devices.
   */
  aliases: { 'AA:BB:CC:DD:EE:FF': 'Bedroom' },
  /**
   * InfluxDB credentials
   */
  influxdb: { bucket: 'ruuvi', org: 'my-org', connection: { url: 'http://my-host', token: 'ACCESS_TOKEN' } },
  /**
   * Log settings (Optional)
   */
  log: {
    /**
     * Set log level. Default is "info" if not defined.
     */
    level: 'info',
    /**
     * Set log file location. Default is "ruuvi-data-collector.log"
     */
    file: 'ruuvi-data-collector.log',
  },
})
