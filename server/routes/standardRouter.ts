import { csrfSync } from 'csrf-sync'
import { Router } from 'express'

import setUpCurrentUser from '../middleware/setUpCurrentUser'
import type UserService from '../services/userService'

const testMode = process.env.NODE_ENV === 'test'

export default function standardRouter(userService: UserService): Router {
  const router = Router({ mergeParams: true })

  router.use(setUpCurrentUser(userService))

  // CSRF protection
  if (!testMode) {
    const {
      // This is the default CSRF protection middleware
      csrfSynchronisedProtection,
    } = csrfSync({
      // By default, csrf-sync uses x-csrf-token header, but we use the token in forms and send it in the request body, so change getTokenFromRequest so it grabs from there
      getTokenFromRequest: req => {
        // eslint-disable-next-line no-underscore-dangle
        return req.body._csrf
      },
    })

    router.use(csrfSynchronisedProtection)
  }

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
