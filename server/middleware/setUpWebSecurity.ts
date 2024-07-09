import crypto from 'node:crypto'

import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  const authHost = new URL(config.apis.hmppsAuth.externalUrl).hostname
  const dpsHost = new URL(config.dpsUrl).hostname
  const frontendComponentsHost = new URL(config.apis.frontendComponents.url).hostname

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            frontendComponentsHost,
            '*.google-analytics.com',
            '*.googletagmanager.com',
            'https://*.hotjar.com',
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            frontendComponentsHost,
            'https://*.hotjar.com',
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
          ],
          fontSrc: ["'self'", frontendComponentsHost, 'https://*.hotjar.com'],
          imgSrc: [
            "'self'",
            'data:',
            frontendComponentsHost,
            '*.google-analytics.com',
            '*.googletagmanager.com',
            '*.g.doubleclick.net',
            '*.google.com',
            '*.google.co.uk',
            'https://*.hotjar.com',
          ],
          formAction: ["'self'", authHost, dpsHost],
          frameSrc: ['https://*.hotjar.com'],
          connectSrc: [
            "'self'",
            '*.google-analytics.com',
            '*.googletagmanager.com',
            '*.analytics.google.com',
            '*.g.doubleclick.net',
            '*.google.com',
            '*.google.co.uk',
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
