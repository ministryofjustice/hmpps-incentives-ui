import crypto from 'crypto'

import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  const scriptSrc = [
    "'self'",
    'https://*.hotjar.com',
    "'unsafe-inline'",
    '*.google-analytics.com',
    '*.googletagmanager.com',
    (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
  ]
  const styleSrc = [
    "'self'",
    'https://*.hotjar.com',
    "'unsafe-inline'",
    (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
  ]
  const imgSrc = ["'self'", 'data:', '*.google-analytics.com', '*.googletagmanager.com', 'https://*.hotjar.com']
  const fontSrc = ["'self'", 'https://*.hotjar.com']

  if (config.apis.frontendComponents.url) {
    scriptSrc.push(config.apis.frontendComponents.url)
    styleSrc.push(config.apis.frontendComponents.url)
    imgSrc.push(config.apis.frontendComponents.url)
    fontSrc.push(config.apis.frontendComponents.url)
  }

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
          fontSrc,
          imgSrc,
          formAction: ["'self'", new URL(config.apis.hmppsAuth.url).hostname],
          frameSrc: ['https://*.hotjar.com'],
          connectSrc: [
            "'self'",
            '*.google-analytics.com',
            '*.googletagmanager.com',
            '*.analytics.google.com',
            'https://*.hotjar.com',
            'https://*.hotjar.io',
            'wss://*.hotjar.com',
          ],
        },
      },
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
    }),
  )

  // cf. https://security-guidance.service.justice.gov.uk/implement-security-txt/
  router.get('/.well-known/security.txt', (req, res) =>
    res.redirect(301, 'https://security-guidance.service.justice.gov.uk/.well-known/security.txt'),
  )

  return router
}
