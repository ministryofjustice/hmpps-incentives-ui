import type { RequestHandler, Router } from 'express'

import logger from '../../logger'
import { Location, PrisonApi } from '../data/prisonApi'
import asyncMiddleware from '../middleware/asyncMiddleware'

declare module 'express-session' {
  export interface SessionData {
    activeLocation: Location | null
  }
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { user } = res.locals
    const { activeLocation } = req.session

    const prisonApi = new PrisonApi(user.token)
    const locations: Array<Location> = await prisonApi.getAgencyLocations(user.activeCaseLoad.caseLoadId)

    const options = locations.map((location: Location) => ({
      value: location.locationPrefix,
      text: location.userDescription || location.description,
      selected: location.locationPrefix === activeLocation?.locationPrefix,
    }))

    return res.render('pages/changeLocation.njk', {
      title: 'View by residential location',
      options,
      backUrl: '/',
    })
  })

  post('/', async (req, res) => {
    const { user } = res.locals
    const { locationPrefix } = req.body

    // Don't call API if data is missing
    if (locationPrefix) {
      const prisonApi = new PrisonApi(user.token)
      const agencyId = user.activeCaseLoad.caseLoadId
      const allLocations: Array<Location> = await prisonApi.getAgencyLocations(agencyId)
      const activeLocation = allLocations.find(location => location.locationPrefix === locationPrefix)

      req.session.activeLocation = activeLocation

      res.redirect('/')
    } else {
      logger.error(req.originalUrl, 'locationPrefix is missing')
      res.redirect('/select-another-location')
    }
  })

  return router
}
