import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import NotificationService from '../services/notificationService'

export default function routes(router: Router): Router {
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { xhr, body: { id } = {} } = req

    if (!xhr) return res.redirect('/')
    if (!id) {
      res.status(400)
      return res.end()
    }

    const cookieName = NotificationService.cookieName(id)
    const oneYear = 52 * 24 * 3600000
    res.cookie(cookieName, 'dismissed', { maxAge: oneYear, httpOnly: true })

    res.status(200)
    return res.end()
  })

  return router
}
