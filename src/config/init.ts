import config from '../../config'
import { setConfig } from '@config/config'
import { configureLogger } from '@config/logger'

setConfig(config)
await configureLogger(config)
