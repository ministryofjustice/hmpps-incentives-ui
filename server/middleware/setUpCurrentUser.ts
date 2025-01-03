import { Router } from 'express'

import logger from '../../logger'
import type UserService from '../services/userService'

export default function setUpCurrentUser(userService: UserService): Router {
  const router = Router()

  router.use(async (req, res, next) => {
    try {
      if (res.locals.user) {
        const user = await userService.getUser(res.locals.user.token)
        if (user) {
          res.locals.user = { ...user, ...res.locals.user }
        } else {
          logger.info('No user available')
        }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  })

  return router
}
