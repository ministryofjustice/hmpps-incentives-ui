import type { NextFunction, Request, Response, RequestHandler } from 'express'
import { NotFound } from 'http-errors'

export default function featureGate(flag: string, handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.app.locals.featureFlags[flag]) {
      handler(req, res, next)
    } else {
      next(new NotFound())
    }
  }
}
