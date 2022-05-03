import crypto from 'crypto'
import express, { Router, Request, Response } from 'express'
import helmet from 'helmet'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })
  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com',
            (req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
          ],
          styleSrc: ["'self'", (req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
          fontSrc: ["'self'"],
          connectSrc: ['https://www.google-analytics.com'],
          imgSrc: ["'self'", 'https://www.google-analytics.com'],
        },
      },
    })
  )

  // cf. https://security-guidance.service.justice.gov.uk/implement-security-txt/
  router.get('/.well-known/security.txt', (req, res) =>
    res.redirect(
      'https://raw.githubusercontent.com/ministryofjustice/security-guidance/main/contact/vulnerability-disclosure-security.txt'
    )
  )

  return router
}
