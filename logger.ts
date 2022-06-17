import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'

const formatOut = bunyanFormat({ outputMode: 'short', color: !process.env.BUNYAN_NO_COLOR })

const logger = bunyan.createLogger({ name: 'HMPPS Incentives UI', stream: formatOut, level: 'debug' })

export default logger
