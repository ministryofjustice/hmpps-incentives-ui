import type { Request, Response } from 'express'

import { mockUser } from '../routes/testutils/mockUsers'
import userTelemetry from './userTelemetry'

// the telemetry library sets attributes on the active OpenTelemetry span; it brings @opentelemetry/api as a peer dependency
const { trace } = jest.requireActual<typeof import('@opentelemetry/api')>('@opentelemetry/api')

describe('userTelemetry', () => {
  const setAttribute = jest.fn()
  const next = jest.fn()

  beforeEach(() => {
    jest
      .spyOn(trace, 'getActiveSpan')
      .mockReturnValue({ setAttribute } as unknown as ReturnType<typeof trace.getActiveSpan>)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  function recordedAttributes(user: Express.User | undefined): Record<string, unknown> {
    const res = { locals: { user } } as unknown as Response
    userTelemetry()({} as Request, res, next)
    expect(next).toHaveBeenCalled()
    return Object.fromEntries(setAttribute.mock.calls)
  }

  it('records the username, user ids and active caseload of the signed-in user', () => {
    expect(recordedAttributes(mockUser)).toEqual({
      username: 'user1',
      userId: 'id1',
      userUuid: '11111111-1111-1111-1111-111111111111',
      activeCaseLoadId: 'MDI',
    })
  })

  it('leaves out details the user does not have', () => {
    expect(
      recordedAttributes({ ...mockUser, userId: undefined, userUuid: undefined, activeCaseload: undefined }),
    ).toEqual({ username: 'user1' })
  })

  it('records nothing when there is no user', () => {
    expect(recordedAttributes(undefined)).toEqual({})
  })
})
