import express, { Express } from 'express'
import { Cookie, Session, SessionData } from 'express-session'
import createError from 'http-errors'
import path from 'path'

import allRoutes from '../all'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import UserService from '../../services/userService'
import * as auth from '../../authentication/auth'
import { Location, PrisonApi } from '../../data/prisonApi'
import { getTestLocation } from '../../testData/prisonApi'

jest.mock('../../data/prisonApi')

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
}

const activeCaseload = {
  id: 'MDI',
  name: 'Moorland (HMP & YOI)',
}

const testLocation: Location = getTestLocation({
  agencyId: 'MDI',
  locationPrefix: 'MDI-2',
  userDescription: 'Houseblock 2',
})
class MockUserService extends UserService {
  constructor() {
    super(undefined)
  }

  async getUser(token: string) {
    return {
      token,
      ...user,
      activeCaseload,
      caseloads: [activeCaseload],
    }
  }
}

function makeTestSession(sessionData: Partial<SessionData> = {}): Session & Partial<SessionData> {
  return {
    ...sessionData,
    cookie: new Cookie(),
    regenerate: jest.fn(),
    destroy: jest.fn(),
    reload: jest.fn(),
    id: 'sessionId',
    resetMaxAge: jest.fn(),
    save: jest.fn(),
    touch: jest.fn(),
  }
}

function appSetup(production: boolean, testSession: Session, mockUserService: UserService): Express {
  const app = express()

  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([testLocation])

  app.set('view engine', 'njk')

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    req.session = testSession

    res.locals = {}
    res.locals.user = user

    next()
  })

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // App routes
  app.use('/', allRoutes(mockUserService))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

function appWithAllRoutes({
  production = false,
  testSession = makeTestSession(),
  mockUserService = new MockUserService(),
}: {
  production?: boolean
  testSession?: Session
  mockUserService?: UserService
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(production, testSession, mockUserService)
}

export { appWithAllRoutes, makeTestSession }
