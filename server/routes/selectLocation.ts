import type { Router } from 'express'

import logger from '../../logger'
import { LocationsInsidePrisonApi, TopLevelLocation } from '../data/locationsInsidePrisonApi'

export default function routes(router: Router): Router {
  router.get('/', async (_req, res) => {
    const locationsApi = new LocationsInsidePrisonApi(res.locals.user.token)
    const prisonId = res.locals.user.activeCaseload.id
    const locations = await locationsApi.getTopLevelPrisonLocations(prisonId)

    const options = locations.map((location: TopLevelLocation) => ({
      value: `${prisonId}-${location.fullLocationPath}`,
      text: location.localName || location.fullLocationPath,
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

    const locationsApi = new LocationsInsidePrisonApi(res.locals.user.token)
    const prisonId = res.locals.user.activeCaseload.id
    const allLocations = await locationsApi.getTopLevelPrisonLocations(prisonId)
    const selectedLocation = allLocations.find(
      location => `${prisonId}-${location.fullLocationPath}` === locationPrefix,
    )

    if (!selectedLocation) {
      logger.error(req.originalUrl, 'location not part of active case load')
      res.redirect('/select-location')
      return
    }
    const subLocationChar = selectedLocation.locationType === 'WING' ? '-' : ''
    res.redirect(`/incentive-summary/${prisonId}-${selectedLocation.fullLocationPath}${subLocationChar}`)
  })

  return router
}
