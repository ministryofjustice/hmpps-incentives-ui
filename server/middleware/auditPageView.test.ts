import express from 'express'
import request from 'supertest'

import { AuditService } from '@ministryofjustice/hmpps-audit-client'

import auditPageView from './auditPageView'

jest.mock('@ministryofjustice/hmpps-audit-client')

let auditService: jest.Mocked<AuditService>

const renderedHtml = '<html lang="en">page</html>'

/**
 * Minimal app mirroring app.ts’ ordering: user first, then the audit middleware, then routes.
 *
 * `res.render` is stubbed *before* the audit middleware so that the middleware wraps the stub,
 * exactly as it wraps the real nunjucks renderer in the running app.
 */
function appWithAuditing({
  user = { username: 'user1' } as Express.User,
  renderFails = false,
}: { user?: Express.User | null; renderFails?: boolean } = {}): express.Express {
  const app = express()

  app.use((req, res, next) => {
    req.id = 'request123'
    res.locals.user = user ?? undefined
    res.render = ((_view: string, _options?: object, callback?: (err: Error, html: string) => void) => {
      const error = renderFails ? new Error('render failed') : null
      if (callback) {
        callback(error, renderedHtml)
      } else if (error) {
        next(error)
      } else {
        res.send(renderedHtml)
      }
    }) as typeof res.render
    next()
  })

  app.get('*any', auditPageView(auditService))

  app.get('/', (req, res) => res.render('pages/home.njk'))
  app.get('/prisoner-images/:imageId.jpeg', (req, res) => res.send('image'))
  app.get('/throw-test-error', () => {
    throw new Error('test error')
  })
  app.get('/incentive-reviews/prisoner/:prisonerNumber', (req, res) => res.render('pages/prisoner.njk'))
  app.get('/incentive-summary/:locationPrefix', (req, res) => res.render('pages/summary.njk'))
  app.get('/forbidden', (req, res) => res.status(403).render('pages/forbidden.njk'))
  app.get('/rendered-for-someone-else', (req, res) => {
    res.render('pages/fragment.njk', {}, (err: Error, html: string) => res.send(`wrapped ${html}`))
  })

  app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).render('pages/error.njk')
  })

  return app
}

/** audit events logged, in the order the audit service saw them */
function loggedEvents() {
  return auditService.logAuditEvent.mock.calls.map(([event]) => ({
    subject: { subjectType: event.subjectType, subjectId: event.subjectId },
    what: event.what,
  }))
}

const forPrisoner = { subjectType: 'PRISONER_ID', subjectId: 'A1234BC' }
const notApplicable = { subjectType: 'NOT_APPLICABLE', subjectId: undefined as string | undefined }

beforeEach(() => {
  auditService = new AuditService(null) as jest.Mocked<AuditService>
  auditService.logAuditEvent.mockResolvedValue(undefined)
})

describe('auditPageView', () => {
  it('logs a page view and an access attempt when a page renders', async () => {
    await request(appWithAuditing()).get('/incentive-reviews/prisoner/A1234BC').expect(200).expect(renderedHtml)

    expect(loggedEvents()).toEqual([
      { subject: forPrisoner, what: 'PAGE_VIEW' },
      { subject: forPrisoner, what: 'PAGE_VIEW_ACCESS_ATTEMPT' },
    ])
  })

  it('passes the username, correlation id and page url to the audit service', async () => {
    await request(appWithAuditing()).get('/incentive-reviews/prisoner/A1234BC').expect(200)

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        who: 'user1',
        correlationId: 'request123',
        details: { pageUrl: '/incentive-reviews/prisoner/A1234BC' },
      }),
      { throwOnError: false, logOnError: true },
    )
  })

  it.each([
    ['the home page', '/'],
    ['a page about a location', '/incentive-summary/MDI-1'],
  ])('audits %s with no subject', async (_name, url) => {
    await request(appWithAuditing()).get(url).expect(200)

    expect(loggedEvents()).toEqual([
      { subject: notApplicable, what: 'PAGE_VIEW' },
      { subject: notApplicable, what: 'PAGE_VIEW_ACCESS_ATTEMPT' },
    ])
  })

  it('logs only an attempt when a request does not render a page', async () => {
    await request(appWithAuditing()).get('/incentive-reviews/prisoner/A1234BC/missing').expect(404)

    expect(loggedEvents()).toEqual([{ subject: forPrisoner, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it('logs only an attempt when a forbidden page is rendered', async () => {
    await request(appWithAuditing()).get('/forbidden').expect(403)

    expect(loggedEvents()).toEqual([{ subject: notApplicable, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it.each([
    ['a prisoner photo', '/prisoner-images/A1234BC.jpeg'],
    ['the test error page', '/throw-test-error'],
  ])('does not audit %s', async (_name, url) => {
    await request(appWithAuditing()).get(url)

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('does not audit when there is no signed-in user', async () => {
    await request(appWithAuditing({ user: null }))
      .get('/incentive-reviews/prisoner/A1234BC')
      .expect(200)

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('leaves renders with their own callback alone, auditing only the attempt', async () => {
    await request(appWithAuditing()).get('/rendered-for-someone-else').expect(200).expect(`wrapped ${renderedHtml}`)

    expect(loggedEvents()).toEqual([{ subject: notApplicable, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it('still serves the page when auditing fails', async () => {
    auditService.logAuditEvent.mockRejectedValue(new Error('SQS is down'))

    await request(appWithAuditing()).get('/incentive-reviews/prisoner/A1234BC').expect(200).expect(renderedHtml)
  })

  it('passes render errors to the error handler and does not log a page view', async () => {
    await request(appWithAuditing({ renderFails: true }))
      .get('/incentive-reviews/prisoner/A1234BC')
      .expect(500)

    expect(loggedEvents()).toEqual([{ subject: forPrisoner, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })
})
