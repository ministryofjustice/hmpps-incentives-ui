import express, { Express } from 'express'
import cookieSession from 'cookie-session'
import createError from 'http-errors'
import path from 'path'

import indexRoutes from '../index'
import changeLocationRoutes from '../changeLocation'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import standardRouter from '../standardRouter'
import UserService from '../../services/userService'
import * as auth from '../../authentication/auth'
import { Location } from '../../data/prisonApi'

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
}

const activeCaseLoad = {
  caseLoadId: 'MDI',
  description: 'Moorland (HMP & YOI)',
  currentlyActive: true,
  type: 'INST',
}

const activeLocation: Location = {
  locationId: 42,
  locationType: 'WING',
  description: '2',
  agencyId: 'MDI',
  currentOccupancy: 199,
  locationPrefix: 'MDI-2',
  operationalCapacity: 200,
  userDescription: 'Houseblock 2',
}

class MockUserService extends UserService {
  constructor() {
    super(undefined)
  }

  async getUser(token: string) {
    return {
      token,
      ...user,
      activeCaseLoad,
      activeCaseLoads: [activeCaseLoad],
    }
  }
}

function appSetup(production: boolean): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, path)

  app.use(cookieSession({ keys: [''] }))

  app.use((req, res, next) => {
    res.locals = {}
    res.locals.user = user

    req.session.activeLocation = activeLocation

    next()
  })

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // App routes
  const mockUserService = new MockUserService()
  app.use('/', indexRoutes(standardRouter(mockUserService)))
  app.use('/select-another-location', changeLocationRoutes(standardRouter(mockUserService)))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

export default function appWithAllRoutes({ production = false }: { production?: boolean }): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(production)
}
