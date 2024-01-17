import type { RequestHandler } from 'express'

import logger from '../../logger'
import FrontendComponentsClient from '../data/frontendComponentsClient'

export default function frontendComponents(): RequestHandler {
  const frontendComponentsClient = new FrontendComponentsClient()
  return async (req, res, next) => {
    try {
      const [header, footer] = await Promise.all([
        frontendComponentsClient.getComponent('header', res.locals.user.token),
        frontendComponentsClient.getComponent('footer', res.locals.user.token),
      ])
      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      next()
    }
  }
}
