export type PaginationPreviousOrNext = {
  href: string
  text?: string
  attributes?: Record<string, string>
}

export type PaginationItem =
  | {
      number: number
      href: string
      current?: boolean
    }
  | {
      ellipsis: true
    }

export type Pagination = {
  previous?: PaginationPreviousOrNext
  items?: PaginationItem[]
  next?: PaginationPreviousOrNext
  landmarkLabel?: string
}

/**
 * Produces parameters for GOV.UK Pagination component macro
 * NB: `page` starts at 1
 */
export function pagination(page: number, pageCount: number, hrefPrefix: string): Pagination {
  if (pageCount <= 1) {
    return {}
  }

  const params: Pagination = {}
  if (page !== 1) {
    params.previous = {
      href: `${hrefPrefix}page=${page - 1}`,
    }
  }
  if (page < pageCount) {
    params.next = {
      href: `${hrefPrefix}page=${page + 1}`,
    }
  }

  let pages: (number | null)[]
  if (page >= 5) {
    pages = [1, 2, null, page - 1, page]
  } else {
    pages = [1, 2, 3, 4].slice(0, page)
  }
  const maxPage = Math.max(page, pages.at(-1))
  if (maxPage === pageCount - 1) {
    pages.push(pageCount)
  } else if (maxPage === pageCount - 2) {
    pages.push(pageCount - 1, pageCount)
  } else if (maxPage === pageCount - 3) {
    pages.push(maxPage + 1, pageCount - 1, pageCount)
  } else if (maxPage <= pageCount - 4) {
    pages.push(maxPage + 1, null, pageCount - 1, pageCount)
  }

  params.items = pages.map((somePage: number | null) => {
    if (somePage) {
      const item: PaginationItem = {
        number: somePage,
        href: `${hrefPrefix}page=${somePage}`,
      }
      if (somePage === page) {
        item.current = true
      }
      return item
    }
    return { ellipsis: true }
  })

  return params
}
