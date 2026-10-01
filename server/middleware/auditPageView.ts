import type { AuditService, PageViewEventDetails, SubjectType } from '@ministryofjustice/hmpps-audit-client'
import type { Request, RequestHandler } from 'express'

import logger from '../../logger'

/**
 * Requests that are not page views: prisoner photos and the test error page.
 * Health checks, static resources and sign-in are handled earlier in app.ts so never reach here.
 */
const notPageViews = [/^\/prisoner-images\/[^/]+\.jpeg(?:\?.*)?$/, /^\/throw-test-error(?:[/?].*)?$/]

/** Prisoner numbers appear in the path of prisoner-specific pages */
const prisonerNumberInPath = /\/prisoner\/([A-Z][0-9]{4}[A-Z]{2})\b/

type Subject = { subjectType: SubjectType; subjectId?: string }

type RenderCallback = (err: Error, html: string) => void
type ResRender = (view: string, options?: object, callback?: RenderCallback) => void

/**
 * Audits page views to HMPPS Audit.
 *
 * Emits PAGE_VIEW_ACCESS_ATTEMPT once the response closes – covering redirects, errors and
 * requests refused downstream by the authorisation middleware – and PAGE_VIEW when a page
 * renders successfully.
 *
 * Mount after authentication but before authorisation, so that refused requests are still
 * recorded as attempts.
 */
export default function auditPageView(auditService: AuditService): RequestHandler {
  return (req, res, next) => {
    const who = res.locals.user?.username
    if (!who || notPageViews.some(pattern => pattern.test(req.originalUrl))) {
      next()
      return
    }

    res.locals.auditEvent = {
      who,
      correlationId: req.id,
      details: { pageUrl: req.originalUrl },
      ...subjectOfRequest(req),
    }

    res.prependOnceListener('close', () => {
      logPageView(auditService, res.locals.auditEvent, 'PAGE_VIEW_ACCESS_ATTEMPT')
    })

    const resRender = res.render as ResRender
    res.render = ((view: string, options?: object | RenderCallback, callback?: RenderCallback) => {
      // callers that handle the rendered html themselves are not sending a page, so are not audited
      if (typeof options === 'function' || callback) {
        resRender.call(res, view, options, callback)
        return
      }
      resRender.call(res, view, options, (err: Error, html: string) => {
        if (err) {
          next(err)
          return
        }
        // send the page first: auditing must never delay or break rendering
        res.send(html)
        // error and forbidden pages are rendered too, but are not successful page views
        if (res.statusCode < 400) {
          logPageView(auditService, res.locals.auditEvent, 'PAGE_VIEW')
        }
      })
    }) as typeof res.render

    next()
  }
}

function subjectOfRequest(req: Request): Subject {
  const prisonerNumber = req.originalUrl.match(prisonerNumberInPath)?.[1]
  if (prisonerNumber) {
    return { subjectType: 'PRISONER_ID', subjectId: prisonerNumber }
  }
  return { subjectType: 'NOT_APPLICABLE' }
}

function logPageView(
  auditService: AuditService,
  auditEvent: PageViewEventDetails | undefined,
  what: 'PAGE_VIEW' | 'PAGE_VIEW_ACCESS_ATTEMPT',
): void {
  if (!auditEvent) return
  // auditing must not be able to break page rendering, so never throw
  auditService.logAuditEvent({ ...auditEvent, what }, { throwOnError: false, logOnError: true }).catch(error => {
    logger.error(error, 'Failed to audit page view')
  })
}
