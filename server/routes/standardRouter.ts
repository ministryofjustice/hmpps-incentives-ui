import csurf from 'csurf'
import { Router } from 'express'

import setUpCurrentUser from '../middleware/setUpCurrentUser'
import type UserService from '../services/userService'

const testMode = process.env.NODE_ENV === 'test'

export default function standardRouter(userService: UserService): Router {
  const router = Router({ mergeParams: true })

  router.use(setUpCurrentUser(userService))

  // CSRF protection
  if (!testMode) {
    router.use(csurf())
  }

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
