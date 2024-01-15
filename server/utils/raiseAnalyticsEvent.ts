import ua from 'universal-analytics'
import config from '../config'

// @ts-ignore
export const raiseAnalyticsEvent = (category, action, label, value?) => {
  if (!config.googleAnalytics.ga4MeasurementId) return Promise.resolve()
  const ga = ua(config.googleAnalytics.ga4MeasurementId)
  const data = {
    ec: category,
    ea: action,
    el: label,
    ev: value,
  }
  return ga.event(data).send()
}

export default {
  raiseAnalyticsEvent,
}
