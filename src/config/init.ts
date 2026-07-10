import config from '../../config'
import { setConfig } from '@config/config'
import { configureLogger } from '@config/logger/logger'

await configureLogger(config)
setConfig(config)
