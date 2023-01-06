import type { Request } from 'express'

export default class NotificationService {
  static cookieName(notificationId: string): string {
    return `notification-banner-${notificationId}`
  }

  static isDismissed(req: Request, notificationId: string): boolean {
    const cookieName = this.cookieName(notificationId)
    return (req.cookies && req.cookies[cookieName] === 'dismissed') || false
  }
}
