/* eslint-disable no-param-reassign */
import path from 'path'

import express from 'express'
import nunjucks from 'nunjucks'

import config from '../config'
import { calculateTrendsRange, makeChartPalette } from './analytics'
import format from './format'
import { daysSince, initialiseName } from './utils'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Incentives'
  app.locals.production = config.production
  app.locals.environment = config.environment
  app.locals.featureFlags = config.featureFlags

  app.locals.phaseName = config.phaseName
  app.locals.phaseNameColour = config.phaseName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''

  app.locals.googleAnalyticsGa4Id = config.googleAnalytics.ga4MeasurementId
  app.locals.hotjarSiteId = config.hotjar.siteId

  app.locals.dpsUrl = config.dpsUrl
  app.locals.supportUrl = config.supportUrl

  // Cachebusting version string
  if (config.production) {
    // Version only changes with new commits
    app.locals.version = config.applicationInfo.gitRef
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter('dateParam', (date: Date) => {
    if (!date) {
      return ''
    }

    return encodeURI(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`)
  })

  njkEnv.addFilter('findError', (array, formFieldId) => {
    if (!array) return null
    // @ts-ignore
    const item = array.find((error) => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('addDefaultSelectedVale', (items, text, show) => {
    if (!items) return null
    const attributes: { hidden?: string } = {}
    if (!show) attributes.hidden = ''

    return [
      {
        text,
        value: '',
        selected: true,
        attributes,
      },
      ...items,
    ]
  })

  njkEnv.addFilter(
    'setSelected',
    (items, selected) =>
      items &&
      // @ts-ignore
      items.map((entry) => ({
        ...entry,
        selected: entry && entry.value === selected,
      }))
  )

  // date & number formatting
  njkEnv.addFilter('date', format.date)
  njkEnv.addFilter('shortDate', format.shortDate)
  njkEnv.addFilter('splitYearAndMonth', format.splitYearAndMonth)
  njkEnv.addFilter('daysAgo', format.daysAgo)
  njkEnv.addFilter('thousands', format.thousands)
  njkEnv.addFilter('percentageOf', format.percentage)
  njkEnv.addFilter('currencyFromPence', format.currencyFromPence)
  njkEnv.addFilter('daysSince', daysSince)

  // analytics charts
  njkEnv.addFilter('chartPalette', makeChartPalette)
  njkEnv.addFilter('calculateTrendsRange', calculateTrendsRange)
}
