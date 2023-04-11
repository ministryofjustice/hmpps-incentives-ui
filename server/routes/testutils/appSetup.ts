import path from 'path'

import flash from 'connect-flash'
import express, { type Express, type Router } from 'express'
import { Cookie, type Session, type SessionData } from 'express-session'
import { NotFound } from 'http-errors'

import allRoutes from '../all'
import breadcrumbs from '../../middleware/breadcrumbs'
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

function appSetup(
  production: boolean,
  testSession: Session,
  mockUserService: UserService,
  testRouter?: Router,
): Express {
  const app = express()

  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([testLocation])

  app.set('view engine', 'njk')

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    req.session = testSession

    res.locals = {}
    const authHeader = req.header('authorization')
    const token = /^Bearer\s+(?<token>.*)\s*$/i.exec(authHeader)?.groups?.token
    res.locals.user = { ...user, token }

    next()
  })
  app.use(flash())

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(breadcrumbs())

  // App routes
  app.use('/', allRoutes(mockUserService))

  // Test router is *only* added for unit tests
  if (testRouter) {
    app.use(testRouter)
  }

  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

function appWithAllRoutes({
  production = false,
  testSession = makeTestSession(),
  mockUserService = new MockUserService(),
  testRouter = undefined,
}: {
  production?: boolean
  testSession?: Session
  mockUserService?: UserService
  testRouter?: Router
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(production, testSession, mockUserService, testRouter)
}

export { appWithAllRoutes, makeTestSession }
