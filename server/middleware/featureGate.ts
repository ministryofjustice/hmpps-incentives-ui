import type { NextFunction, Request, Response, RequestHandler } from 'express'
import { NotFound } from 'http-errors'

import { Caseload } from '../data/nomisUserRolesApi'

/**
 * Wraps a request handler and returns 404 unless the given feature flag is set
 */
export function featureGate(flag: string, handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.app.locals?.featureFlags[flag]) {
      handler(req, res, next)
    } else {
      next(new NotFound())
    }
  }
}

/**
 * Wraps a request handler and returns 404 unless the user’s *active* case load appears in given prisons
 * If "*" appears in the prisons list, call is always forwarded to request handler
 */
export function activeCaseloadGate(prisons: string[], handler: RequestHandler) {
  const allowAllCaseloads = prisons.includes('*')

  return (req: Request, res: Response, next: NextFunction): void => {
    const activeCaseload: Caseload | undefined = res.locals?.user?.activeCaseload
    if (allowAllCaseloads || (activeCaseload && prisons.includes(activeCaseload.id))) {
      handler(req, res, next)
    } else {
      next(new NotFound())
    }
  }
}
