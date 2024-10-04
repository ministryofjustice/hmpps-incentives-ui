import type { NextFunction, Request, Response } from 'express'

import logger from '../../logger'
import FrontendComponentsClient from '../data/frontendComponentsClient'

export default function frontendComponents() {
  const frontendComponentsClient = new FrontendComponentsClient()
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { header, footer } = await frontendComponentsClient.getComponents(
        ['header', 'footer'],
        res.locals.user.token,
      )
      // TODO: meta information from frontend components can be used to read active and available caseloads
      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve frontend components')
      next()
    }
  }
}
