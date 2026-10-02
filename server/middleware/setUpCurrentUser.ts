import { Router } from 'express'
import { jwtDecode } from 'jwt-decode'

import logger from '../../logger'
import type UserService from '../services/userService'
import type { AuthToken } from './authorisationMiddleware'

export default function setUpCurrentUser(userService: UserService): Router {
  const router = Router()

  router.use(async (req, res, next) => {
    try {
      if (res.locals.user) {
        const user = await userService.getUser(res.locals.user.token)
        if (user) {
          // userUuid is created by HMPPS Auth and identifies the person across all auth sources
          const { user_id: userId, user_uuid: userUuid }: AuthToken = res.locals.user.token
            ? jwtDecode<AuthToken>(res.locals.user.token)
            : {}
          res.locals.user = { ...user, ...res.locals.user, userId: userId ?? user.userId, userUuid }
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
