import type { Request, Response, NextFunction, RequestHandler } from 'express'

export default function asyncMiddleware<Handler extends RequestHandler>(fn: Handler): Handler {
  return ((req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }) as Handler
}
