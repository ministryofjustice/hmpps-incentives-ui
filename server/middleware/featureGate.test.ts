import type { NextFunction, Request, Response, RequestHandler } from 'express'
import { featureGate, activeCaseloadGate, usernameGate } from './featureGate'

/** Trivial request handler that always returns "OK" */
const simpleRequestHandler: RequestHandler = (req, res) => {
  res.send('OK')
}

/**
 * Creates a mock request with given app locals
 */
function mockRequest(appLocals: Record<string, unknown> = {}): Request {
  return {
    app: { locals: appLocals },
  } as Request
}

/**
 * Creates a mock response with given response locals
 * NB: the send method will track calls
 */
function mockResponse(locals: Record<string, unknown> = {}): Response {
  return {
    locals,
    send: jest.fn(),
  } as unknown as Response
}

/**
 * Asserts that the handler successfully responds
 */
function expectRequestHandlerToBeCalled(handler: RequestHandler, req: Request, res: Response): void {
  const next: jest.Mock<NextFunction> = jest.fn()
  handler(req, res, next)
  expect(res.send).toBeCalledWith('OK')
  expect(next).not.toBeCalled()
}

/**
 * Asserts that the handler is not called and a 404 is passed to the next handler
 */
function expectRequestHandlerTo404(handler: RequestHandler, req: Request, res: Response): void {
  const next: jest.Mock<NextFunction> = jest.fn()
  handler(req, res, next)
  expect(res.send).not.toBeCalled()
  expect(next).toBeCalled()
  expect(next.mock.calls[0][0].status).toEqual(404)
}

describe('featureGate', () => {
  /** Gated request handler that requires flag "testFlag" */
  const gatedHandler = featureGate('testFlag', simpleRequestHandler)

  it('calls handler when feature is turned on', () => {
    const req = mockRequest({ featureFlags: { testFlag: true } })
    const res = mockResponse()
    expectRequestHandlerToBeCalled(gatedHandler, req, res)
  })

  it('returns 404 when feature is turned off', () => {
    const req = mockRequest({ featureFlags: { testFlag: false } })
    const res = mockResponse()
    expectRequestHandlerTo404(gatedHandler, req, res)
  })
})

describe('activeCaseloadGate', () => {
  describe('with predefined list of prisons', () => {
    /** Gated request handler that requires *active* case load to include BWI or MDI */
    const gatedHandler = activeCaseloadGate(['BWI', 'MDI'], simpleRequestHandler)

    it('calls handler when user’s active case load is included in specified prisons', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'MDI' }, caseloads: [{ id: 'LEI' }, { id: 'MDI' }] } })
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })

    it('returns 404 when user’s case loads overlap with specified prisons but not the active one', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'LEI' }, caseloads: [{ id: 'LEI' }, { id: 'BWI' }] } })
      expectRequestHandlerTo404(gatedHandler, req, res)
    })

    it('returns 404 when user’s case loads do not overlap with specified prisons', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'LEI' }, caseloads: [{ id: 'LEI' }, { id: 'BXI' }] } })
      expectRequestHandlerTo404(gatedHandler, req, res)
    })

    it('returns 404 when user case load is unknown', () => {
      const req = mockRequest()
      const res = mockResponse()
      expectRequestHandlerTo404(gatedHandler, req, res)
    })
  })

  describe('with * in list of prisons', () => {
    /** Gated request handler that allows any *active* case load */
    const gatedHandler = activeCaseloadGate(['*'], simpleRequestHandler)

    it('calls handler when user’s active case load is included in specified prisons', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'MDI' }, caseloads: [{ id: 'LEI' }, { id: 'MDI' }] } })
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })

    it('calls handler when user’s case loads overlap with specified prisons but not the active one', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'LEI' }, caseloads: [{ id: 'LEI' }, { id: 'BWI' }] } })
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })

    it('calls handler when user’s case loads do not overlap with specified prisons', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'LEI' }, caseloads: [{ id: 'LEI' }, { id: 'BXI' }] } })
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })

    it('calls handler when user case load is unknown', () => {
      const req = mockRequest()
      const res = mockResponse()
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })
  })

  describe('with empty list of prisons', () => {
    /** Gated request handler that forbids any *active* case load */
    const gatedHandler = activeCaseloadGate([], simpleRequestHandler)

    it('returns 404 when user’s active case load is known', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { activeCaseload: { id: 'MDI' }, caseloads: [{ id: 'LEI' }, { id: 'MDI' }] } })
      expectRequestHandlerTo404(gatedHandler, req, res)
    })

    it('returns 404 when user case load is unknown', () => {
      const req = mockRequest()
      const res = mockResponse()
      expectRequestHandlerTo404(gatedHandler, req, res)
    })
  })
})

describe('usernameGate', () => {
  describe('with predefined list of usernames', () => {
    /** Gated request handler that requires username to be user1 or user2 */
    const gatedHandler = usernameGate(['user1', 'user2'], simpleRequestHandler)

    it('calls handler when user’s username is included in specified list', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { username: 'user1' } })
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })

    it('returns 404 when user’s username is not included in specified list', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { username: 'user5' } })
      expectRequestHandlerTo404(gatedHandler, req, res)
    })

    it('returns 404 when user’s username is unknown', () => {
      const req = mockRequest()
      const res = mockResponse()
      expectRequestHandlerTo404(gatedHandler, req, res)
    })
  })

  describe('with * in list of usernames', () => {
    /** Gated request handler that allows any username */
    const gatedHandler = usernameGate(['*'], simpleRequestHandler)

    it('calls handler when user’s username is included in specified list', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { username: 'user1' } })
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })

    it('calls handler when user’s username is unknown', () => {
      const req = mockRequest()
      const res = mockResponse()
      expectRequestHandlerToBeCalled(gatedHandler, req, res)
    })
  })

  describe('with empty list of usernames', () => {
    /** Gated request handler that forbids any username */
    const gatedHandler = usernameGate([], simpleRequestHandler)

    it('returns 404 when user’s active case load is known', () => {
      const req = mockRequest()
      const res = mockResponse({ user: { username: 'user1' } })
      expectRequestHandlerTo404(gatedHandler, req, res)
    })

    it('returns 404 when user case load is unknown', () => {
      const req = mockRequest()
      const res = mockResponse()
      expectRequestHandlerTo404(gatedHandler, req, res)
    })
  })
})
