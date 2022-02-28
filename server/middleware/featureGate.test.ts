import type { NextFunction, Request, Response, RequestHandler } from 'express'
import featureGate from './featureGate'

describe('featureGate', () => {
  const gatedHandler: RequestHandler = featureGate('testFlag', (req, res) => {
    res.send('OK')
  })

  it('calls handler when feature is turned on', () => {
    const req = {
      app: {
        locals: {
          featureFlags: {
            testFlag: true,
          },
        },
      },
    } as unknown as Request
    const res = { send: jest.fn() } as unknown as Response
    const next: jest.Mock<NextFunction> = jest.fn()
    gatedHandler(req, res, next)
    expect(res.send).toBeCalledWith('OK')
    expect(next).not.toBeCalled()
  })

  it('returns 404 when feature is turned off', () => {
    const req = {
      app: {
        locals: {
          featureFlags: {
            testFlag: false,
          },
        },
      },
    } as unknown as Request
    const res = { send: jest.fn() } as unknown as Response
    const next: jest.Mock<NextFunction> = jest.fn()
    gatedHandler(req, res, next)
    expect(res.send).not.toBeCalled()
    expect(next).toBeCalled()
    expect(next.mock.calls[0][0].status).toEqual(404)
  })
})
