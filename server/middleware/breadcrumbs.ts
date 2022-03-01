import type { Request, Response, NextFunction, RequestHandler } from 'express'

type Breadcrumb = ({ text: string } | { html: string }) & { href?: string }

class Breadcrumbs {
  breadcrumbs: Breadcrumb[]

  constructor(res: Response) {
    this.breadcrumbs = [
      {
        text: 'Digital Prison Services',
        href: res.app.locals.dpsHome,
      },
      {
        text: 'Manage incentives',
        href: '/',
      },
    ]
  }

  get lastItem(): Breadcrumb {
    return this.breadcrumbs[this.breadcrumbs.length - 1]
  }

  addItems(...items: Breadcrumb[]) {
    items.forEach(item => this.breadcrumbs.push(item))
  }

  getItems(): Breadcrumb[] {
    return [...this.breadcrumbs]
  }
}

export default function breadcrumbs(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.breadcrumbs = new Breadcrumbs(res)
    return next()
  }
}
