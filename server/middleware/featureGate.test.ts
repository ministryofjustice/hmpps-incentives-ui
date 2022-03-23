import type { NextFunction, Request, Response, RequestHandler } from 'express'
import featureGate from './featureGate'

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
