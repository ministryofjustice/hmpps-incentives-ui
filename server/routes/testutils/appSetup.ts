import { randomUUID } from 'node:crypto'

import flash from 'connect-flash'
import express, { type Express, type Router } from 'express'
import { Cookie, type Session, type SessionData } from 'express-session'
import { NotFound } from 'http-errors'

import allRoutes from '../all'
import breadcrumbs from '../../middleware/breadcrumbs'
import setUpProductInfo from '../../middleware/setUpProductInfo'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import UserService from '../../services/userService'
import { type Location, PrisonApi } from '../../data/prisonApi'
import { getTestLocation } from '../../testData/prisonApi'
import { mockUser } from './mockUsers'

jest.mock('../../data/prisonApi')

const testLocation: Location = getTestLocation({
  agencyId: 'MDI',
  locationPrefix: 'MDI-2',
  userDescription: 'Houseblock 2',
  subLocations: true,
})

export class MockUserService extends UserService {
  constructor(readonly user: Express.User = mockUser) {
    super(undefined)
    this.getUser = jest.fn()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.getUser.mockResolvedValue(this.user)
  }

  getFullUserObject(token: string): Express.User {
    return {
      ...this.user,
      token,
    }
  }
}

export function makeTestSession(sessionData: Partial<SessionData> = {}): Session & Partial<SessionData> {
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
  mockUserService: MockUserService,
  testRouter?: Router,
): Express {
  const app = express()

  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([testLocation])

  nunjucksSetup(app)

  app.use((req, res, next) => {
    req.session = testSession

    req.id = randomUUID()

    const authHeader = req.header('authorization')
    const token = /^Bearer\s+(?<token>.*)\s*$/i.exec(authHeader)?.groups?.token
    res.locals.user = mockUserService.getFullUserObject(token)

    next()
  })
  app.use(flash())

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(setUpProductInfo())
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

export function appWithAllRoutes({
  production = false,
  testSession = makeTestSession(),
  mockUserService = new MockUserService(),
  testRouter = undefined,
}: {
  production?: boolean
  testSession?: Session
  mockUserService?: MockUserService
  testRouter?: Router
}): Express {
  return appSetup(production, testSession, mockUserService, testRouter)
}
