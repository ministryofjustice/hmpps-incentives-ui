/* eslint-disable no-param-reassign */
import path from 'path'

import express from 'express'
import nunjucks from 'nunjucks'

import config from '../config'
import { applicationInfo } from '../applicationInfo'
import { calculateTrendsRange, makeChartPalette } from './analytics'
import format from './format'
import { daysSince, initialiseName } from './utils'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Manage incentives'
  app.locals.dpsHome = config.dpsUrl
  app.locals.supportUrl = config.supportUrl
  app.locals.feedbackUrl = config.feedbackUrl
  app.locals.googleAnalyticsUaId = config.googleAnalytics.uaTrackingId
  app.locals.googleAnalyticsGa4Id = config.googleAnalytics.ga4MeasurementId
  app.locals.hotjarSiteId = config.hotjar.siteId
  app.locals.featureFlags = config.featureFlags
  app.locals.phaseName = config.phaseName
  app.locals.phaseNameColour = config.phaseName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitRef
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
