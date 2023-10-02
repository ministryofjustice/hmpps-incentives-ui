interface PaginationPreviousOrNext {
  href: string
  text?: string
  attributes?: Record<string, string>
}

interface PaginationLink {
  number: number
  href: string
  current?: boolean
  ellipsis?: false
}

interface PaginationEllipsis {
  ellipsis: true
}

type PaginationItem = (PaginationLink | PaginationEllipsis) & {
  attributes?: Record<string, string>
}

export interface Pagination {
  previous?: PaginationPreviousOrNext
  items?: PaginationItem[]
  next?: PaginationPreviousOrNext
  landmarkLabel?: string
  classes?: string
  attributes?: Record<string, string>
}

interface LegacyPaginationPreviousOrNext {
  text: string
  href: string
}

interface LegacyPaginationLink {
  text: string
  href: string
  selected?: boolean
}

interface LegacyPaginationEllipsis {
  type: 'dots'
}

type LegacyPaginationItem = LegacyPaginationLink | LegacyPaginationEllipsis

interface LegacyPaginationResults {
  count: number
  from: number
  to: number
  text?: string
}

export interface LegacyPagination {
  previous?: LegacyPaginationPreviousOrNext
  items: LegacyPaginationItem[]
  next?: LegacyPaginationPreviousOrNext
  results?: LegacyPaginationResults
  classes?: string
}

/**
 * Produces parameters for GOV.UK Pagination component macro
 * or the legacy MoJ Pagination component
 *
 * NB: `page` starts at 1 not 0!
 *
 * Accessibility notes if using with GOV.UK Pagination component:
 * - set `landmarkLabel` on the returned object otherwise the navigation box is announced as "results"
 * - set `previous.attributes.aria-label` and `next.attributes.aria-label` on the returned object if "Previous" and "Next" are not clear enough
 */
export function pagination(page: number, pageCount: number, hrefPrefix: string, component?: 'govuk'): Pagination
export function pagination(
  page: number,
  pageCount: number,
  hrefPrefix: string,
  component: 'moj',
  resultCount: number,
  resultsPerPage: number,
): LegacyPagination
export function pagination(
  page: number,
  pageCount: number,
  hrefPrefix: string,
  component: 'govuk' | 'moj' = 'govuk',
  resultCount: number = undefined,
  resultsPerPage: number = undefined,
): Pagination | LegacyPagination {
  const params: Pagination = {}

  if (!pageCount || pageCount <= 1) {
    return component === 'moj' ? { items: [], results: legacyResults(page, resultCount, resultsPerPage) } : {}
  }

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

  params.items = pages.map((somePage: number | null): PaginationItem => {
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

  if (component === 'moj') {
    const legacyPagination: LegacyPagination = {
      items: params.items.map(item => {
        if (item.ellipsis) {
          return { type: 'dots' }
        }
        const link = item as PaginationLink
        return {
          text: String(link.number),
          href: link.href,
          selected: link.current === true,
        }
      }),
      results: legacyResults(page, resultCount, resultsPerPage),
    }
    if ('previous' in params) {
      legacyPagination.previous = { ...params.previous, text: 'Previous' }
    }
    if ('next' in params) {
      legacyPagination.next = { ...params.next, text: 'Next' }
    }
    return legacyPagination
  }

  return params
}

function legacyResults(page: number, resultCount: number, resultsPerPage: number): LegacyPaginationResults {
  if (resultsPerPage < 1) {
    throw new Error('Invalid resultsPerPage')
  }
  return {
    count: resultCount,
    from: resultCount === 0 ? 0 : resultsPerPage * (page - 1) + 1,
    to: Math.min(resultsPerPage * page, resultCount),
  }
}
