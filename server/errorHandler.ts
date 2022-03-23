import type { Request, Response, NextFunction } from 'express'
import type { HttpError } from 'http-errors'
import type { HTTPError as SuperagentHttpError } from 'superagent'

import logger from '../logger'

export default function createErrorHandler(production: boolean) {
  return (error: HttpError | SuperagentHttpError, req: Request, res: Response, next: NextFunction): void => {
    const status = error.status || 500

    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (status === 401 || status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    res.status(status)
    const template = status === 404 ? 'pages/pageNotFound' : 'pages/error'
    return res.render(template, { status, error, production })
  }
}
