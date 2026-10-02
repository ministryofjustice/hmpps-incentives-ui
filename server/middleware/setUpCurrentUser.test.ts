import express, { type Express } from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import type UserService from '../services/userService'
import { makeCaseload } from '../routes/testutils/mockUsers'
import setUpCurrentUser from './setUpCurrentUser'

describe('setUpCurrentUser', () => {
  const activeCaseload = makeCaseload('MDI')
  const userService = {
    getUser: jest.fn().mockResolvedValue({
      username: 'user1',
      name: 'john smith',
      userId: 'manage-users-id',
      displayName: 'John Smith',
      activeCaseload,
      caseloads: [activeCaseload],
    }),
  } as unknown as jest.Mocked<UserService>

  function appWithToken(claims: Record<string, unknown> | null): { app: Express; currentUser: () => Express.User } {
    let currentUser: Express.User
    const app = express()
    app.use((_req, res, next) => {
      const token = claims ? jwt.sign({ user_name: 'user1', ...claims }, 'secret') : undefined
      res.locals.user = { token, username: 'user1' }
      next()
    })
    app.use(setUpCurrentUser(userService))
    app.get('/', (_req, res) => {
      currentUser = res.locals.user
      res.send('OK')
    })
    return { app, currentUser: () => currentUser }
  }

  it('takes the user id and UUID from the sign-in token', async () => {
    const { app, currentUser } = appWithToken({
      user_id: '231232',
      user_uuid: '11111111-1111-1111-1111-111111111111',
    })

    await request(app).get('/').expect(200)

    expect(currentUser()).toEqual(
      expect.objectContaining({
        username: 'user1',
        userId: '231232',
        userUuid: '11111111-1111-1111-1111-111111111111',
        activeCaseload,
      }),
    )
  })

  it('keeps the user id from manage users and leaves the UUID unset when the token does not have them', async () => {
    const { app, currentUser } = appWithToken({})

    await request(app).get('/').expect(200)

    expect(currentUser().userId).toEqual('manage-users-id')
    expect(currentUser().userUuid).toBeUndefined()
  })

  it('does not fail when there is no token', async () => {
    const { app, currentUser } = appWithToken(null)

    await request(app).get('/').expect(200)

    expect(currentUser().userId).toEqual('manage-users-id')
    expect(currentUser().userUuid).toBeUndefined()
  })
})
