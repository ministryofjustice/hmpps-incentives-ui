import type { Request } from 'express'
import NotificationService from './notificationService'

describe('NotificationService', () => {
  const notificationId = 'test-notification'

  it('cookieName() returns the correct cookie name', () => {
    const expectedCookieName = `notification-banner-${notificationId}`

    expect(NotificationService.cookieName(notificationId)).toEqual(expectedCookieName)
  })

  describe('isDismissed()', () => {
    const req = { cookies: {} } as Request

    it('when the notification was already dismissed returns true', () => {
      const cookieName = NotificationService.cookieName(notificationId)
      req.cookies[cookieName] = 'dismissed'

      expect(NotificationService.isDismissed(req, notificationId)).toBeTruthy()
    })

    it(`when the notification hasn't been dismissed returns false`, () => {
      req.cookies = {}

      expect(NotificationService.isDismissed(req, notificationId)).toBeFalsy()
    })
  })
})
