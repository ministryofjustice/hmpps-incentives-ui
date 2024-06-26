import type { NextFunction, Request, Response, RequestHandler } from 'express'
import { NotFound } from 'http-errors'

import config from '../config'

/**
 * Wraps a request handler and returns 404 unless the current environment appears in given environments
 */
export function environmentGate(environments: string[], handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (environments && environments.includes(config.environment)) {
      handler(req, res, next)
    } else {
      next(new NotFound())
    }
  }
}

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
 * Returns true if the user (typically res.locals.user) has an *active* case load which appears in given prisons
 * If "*" appears in the prisons list, any user passes
 */
export function userActiveCaseloadMatches(prisons: string[], user?: Express.User): boolean {
  const allowAnyCaseloads = prisons.includes('*')
  if (allowAnyCaseloads) {
    return true
  }
  const activeCaseload: string | undefined = user?.activeCaseload?.id
  return activeCaseload && prisons.includes(activeCaseload)
}

/**
 * Wraps a request handler and returns 404 unless the user’s *active* case load appears in given prisons
 * If "*" appears in the prisons list, call is always forwarded to request handler
 */
export function activeCaseloadGate(prisons: string[], handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (userActiveCaseloadMatches(prisons, res.locals.user)) {
      handler(req, res, next)
    } else {
      next(new NotFound())
    }
  }
}

/**
 * Returns true if the user (typically res.locals.user) username appears in given list
 * If "*" appears in the username list, any user passes
 */
export function usernameMatches(usernames: string[], user?: Express.User): boolean {
  const allowAnyUsername = usernames.includes('*')
  if (allowAnyUsername) {
    return true
  }
  return user?.username && usernames.includes(user.username)
}

/**
 * Wraps a request handler and returns 404 unless the user’s username appears in given list
 * If "*" appears in the username list, call is always forwarded to request handler
 */
export function usernameGate(usernames: string[], handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (usernameMatches(usernames, res.locals.user)) {
      handler(req, res, next)
    } else {
      next(new NotFound())
    }
  }
}
