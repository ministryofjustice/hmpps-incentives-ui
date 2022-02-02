import express, { Express } from 'express'
import { Cookie, Session, SessionData } from 'express-session'
import createError from 'http-errors'
import path from 'path'

import homeRoutes from '../home'
import incentivesTableRoutes from '../incentivesTable'
import selectLocationRoutes from '../selectLocation'
import prisonerImagesRoutes from '../prisonerImages'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import standardRouter from '../standardRouter'
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

const activeCaseLoad = {
  caseLoadId: 'MDI',
  description: 'Moorland (HMP & YOI)',
  currentlyActive: true,
  type: 'INST',
}

const activeLocation: Location = getTestLocation({
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
      activeCaseLoad,
      activeCaseLoads: [activeCaseLoad],
    }
  }
}

function makeTestSession(sessionData: Partial<SessionData> = { activeLocation }): Session & Partial<SessionData> {
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

function appSetup(production: boolean, testSession: Session): Express {
  const app = express()

  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([activeLocation])

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
  const mockUserService = new MockUserService()
  app.use('/', homeRoutes(standardRouter(mockUserService)))
  app.use('/select-location', selectLocationRoutes(standardRouter(mockUserService)))
  app.use('/incentive-summary/:locationPrefix', incentivesTableRoutes(standardRouter(mockUserService)))
  app.use('/prisoner-images/:imageId.jpeg', prisonerImagesRoutes(standardRouter(mockUserService)))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

function appWithAllRoutes({
  production = false,
  testSession = makeTestSession(),
}: {
  production?: boolean
  testSession?: Session
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(production, testSession)
}

export { appWithAllRoutes, makeTestSession }
