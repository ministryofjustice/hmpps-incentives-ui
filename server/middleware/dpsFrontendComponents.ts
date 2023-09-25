import type { RequestHandler } from 'express'

import logger from '../../logger'
import ComponentService from '../services/dpsComponentService'
import DpsFeComponentsClient from '../data/dpsComponentsClient'

const componentApiClientBuilder = new DpsFeComponentsClient()

const componentService = new ComponentService(componentApiClientBuilder)

export default function getFrontendComponents(): RequestHandler {
  return async (req, res, next) => {
    try {
      const [header, footer] = await Promise.all([
        componentService.getComponent('header', res.locals.user.token),
        componentService.getComponent('footer', res.locals.user.token),
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
