import type { Router } from 'express'

import logger from '../../logger'
import { Location, PrisonApi } from '../data/prisonApi'

export default function routes(router: Router): Router {
  router.get('/', async (_req, res) => {
    const prisonApi = new PrisonApi(res.locals.user.token)
    const locations = await prisonApi.getUserLocations()

    const options = locations.map((location: Location) => ({
      value: location.locationPrefix,
      text: location.userDescription || location.description,
    }))

    res.render('pages/changeLocation.njk', {
      title: 'View by residential location',
      options,
      backUrl: '/',
    })
  })

  router.post('/', async (req, res) => {
    const { locationPrefix } = req.body ?? {}

    if (!locationPrefix) {
      logger.error(req.originalUrl, 'locationPrefix is missing')
      res.redirect('/select-location')
      return
    }

    const prisonApi = new PrisonApi(res.locals.user.token)
    const allLocations: Array<Location> = await prisonApi.getUserLocations()
    const selectedLocation = allLocations.find(location => location.locationPrefix === locationPrefix)

    if (!selectedLocation) {
      logger.error(req.originalUrl, 'location not part of active case load')
      res.redirect('/select-location')
      return
    }
    const subLocationChar = selectedLocation.subLocations ? '-' : ''
    res.redirect(`/incentive-summary/${selectedLocation.locationPrefix}${subLocationChar}`)
  })

  return router
}
