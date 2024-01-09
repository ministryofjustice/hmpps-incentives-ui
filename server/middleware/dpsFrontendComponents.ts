import type { RequestHandler } from 'express'

import logger from '../../logger'
import DpsComponentsClient from '../data/dpsComponentsClient'

const componentApiClient = new DpsComponentsClient()

export default function getFrontendComponents(): RequestHandler {
  return async (req, res, next) => {
    try {
      const [header, footer] = await Promise.all([
        componentApiClient.getComponent('header', res.locals.user.token),
        componentApiClient.getComponent('footer', res.locals.user.token),
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
