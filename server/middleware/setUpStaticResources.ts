import path from 'path'

import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration }

  // frontend assets
  Array.of(
    '/assets',
    '/assets/stylesheets',
    '/assets/js',
    '/node_modules/govuk-frontend/govuk/assets',
    '/node_modules/govuk-frontend',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
  ).forEach(dir => {
    router.use('/assets', express.static(path.join(process.cwd(), dir), cacheControl))
  })
  router.use(
    '/assets/js/jquery.min.js',
    express.static(path.join(process.cwd(), '/node_modules/jquery/dist/jquery.min.js'), cacheControl),
  )

  // downloads
  router.use(
    '/user-guide.pdf',
    express.static(path.join(process.cwd(), '/assets/downloads/user-guide.pdf'), {
      maxAge: '2h',
    }),
  )

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
