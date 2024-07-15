/* eslint-disable no-param-reassign */
import fs from 'node:fs'
import path from 'node:path'

import express from 'express'
import nunjucks from 'nunjucks'

import logger from '../../logger'
import config from '../config'
import { calculateTrendsRange, makeChartPalette } from './analytics'
import format from './format'
import {
  daysSince,
  findFieldInErrorSummary,
  govukSelectInsertDefault,
  govukSelectSetSelected,
  initialiseName,
  possessive,
} from './utils'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Incentives'
  app.locals.production = config.production
  app.locals.environment = config.environment
  app.locals.phaseName = config.phaseName
  app.locals.featureFlags = config.featureFlags

  app.locals.googleAnalyticsGa4Id = config.googleAnalytics.ga4MeasurementId
  app.locals.hotjarSiteId = config.hotjar.siteId

  app.locals.dpsUrl = config.dpsUrl
  app.locals.supportUrl = config.supportUrl

  let assetManifest: Record<string, string> = {}
  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    logger.error('Could not read asset manifest file')
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // static assets
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)

  // form helpers
  njkEnv.addFilter('findFieldInErrorSummary', findFieldInErrorSummary)
  njkEnv.addFilter('govukSelectInsertDefault', govukSelectInsertDefault)
  njkEnv.addFilter('govukSelectSetSelected', govukSelectSetSelected)

  // name formatting
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('possessive', possessive)

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
