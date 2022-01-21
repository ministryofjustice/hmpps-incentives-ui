import { RequestHandler } from 'express'
import { PrisonApi, Location } from '../data/prisonApi'

/**
 * Checks if active location is part of active case load
 *
 * This is particularly useful when user change the active case load
 * and the previously active location is no longer valid.
 */
export default function checkActiveLocation(): RequestHandler {
  return async (req, res, next) => {
    const { activeLocation } = req.session

    if (activeLocation) {
      const prisonApi = new PrisonApi(res.locals.user.token)

      const allLocations: Array<Location> = await prisonApi.getUserLocations()

      const foundAtActivePrison = allLocations.some(
        location => location.locationPrefix === activeLocation.locationPrefix
      )
      if (!foundAtActivePrison) {
        delete req.session.activeLocation
        return res.redirect('/select-another-location')
      }
    }

    return next()
  }
}
