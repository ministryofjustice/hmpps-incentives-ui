import { type Pagination, type LegacyPagination, pagination } from './pagination'

describe('pagination', () => {
  it('should be empty when there are no pages', () => {
    expect(pagination(1, 0, '?a=b&')).toEqual<Pagination>({})

    expect(pagination(1, 0, '?a=b&', 'moj', 0, 20)).toEqual<LegacyPagination>({
      items: [],
      results: {
        count: 0,
        from: 0,
        to: 0,
      },
    })
  })

  it('should be empty when there’s only 1 page', () => {
    expect(pagination(1, 1, '?a=b&')).toEqual<Pagination>({})

    expect(pagination(1, 1, '?a=b&', 'moj', 12, 20)).toEqual<LegacyPagination>({
      items: [],
      results: {
        count: 12,
        from: 1,
        to: 12,
      },
    })
  })

  it('should work on page 1 of 2', () => {
    expect(pagination(1, 2, '?a=b&')).toEqual<Pagination>({
      next: { href: '?a=b&page=2' },
      items: [
        { number: 1, href: '?a=b&page=1', current: true },
        { number: 2, href: '?a=b&page=2' },
      ],
    })

    expect(pagination(1, 2, '?a=b&', 'moj', 22, 20)).toEqual<LegacyPagination>({
      next: { href: '?a=b&page=2', text: 'Next' },
      items: [
        { text: '1', href: '?a=b&page=1', selected: true },
        { text: '2', href: '?a=b&page=2', selected: false },
      ],
      results: {
        count: 22,
        from: 1,
        to: 20,
      },
    })
  })

  it('should work on page 2 of 2', () => {
    expect(pagination(2, 2, '?a=b&')).toEqual<Pagination>({
      previous: { href: '?a=b&page=1' },
      items: [
        { number: 1, href: '?a=b&page=1' },
        { number: 2, href: '?a=b&page=2', current: true },
      ],
    })

    expect(pagination(2, 2, '?a=b&', 'moj', 22, 20)).toEqual<LegacyPagination>({
      previous: { href: '?a=b&page=1', text: 'Previous' },
      items: [
        { text: '1', href: '?a=b&page=1', selected: false },
        { text: '2', href: '?a=b&page=2', selected: true },
      ],
      results: {
        count: 22,
        from: 21,
        to: 22,
      },
    })
  })

  it('should work on page 2 of 3', () => {
    expect(pagination(2, 3, '?a=b&')).toEqual<Pagination>({
      previous: { href: '?a=b&page=1' },
      next: { href: '?a=b&page=3' },
      items: [
        { number: 1, href: '?a=b&page=1' },
        { number: 2, href: '?a=b&page=2', current: true },
        { number: 3, href: '?a=b&page=3' },
      ],
    })

    expect(pagination(2, 3, '?a=b&', 'moj', 52, 20)).toEqual<LegacyPagination>({
      previous: { href: '?a=b&page=1', text: 'Previous' },
      next: { href: '?a=b&page=3', text: 'Next' },
      items: [
        { text: '1', href: '?a=b&page=1', selected: false },
        { text: '2', href: '?a=b&page=2', selected: true },
        { text: '3', href: '?a=b&page=3', selected: false },
      ],
      results: {
        count: 52,
        from: 21,
        to: 40,
      },
    })
  })

  it('should work on page 1 of 7', () => {
    expect(pagination(1, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1', current: true },
      { number: 2, href: '?a=b&page=2' },
      { ellipsis: true },
      { number: 6, href: '?a=b&page=6' },
      { number: 7, href: '?a=b&page=7' },
    ])

    const legacyParams = pagination(1, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: true },
      { text: '2', href: '?a=b&page=2', selected: false },
      { type: 'dots' },
      { text: '6', href: '?a=b&page=6', selected: false },
      { text: '7', href: '?a=b&page=7', selected: false },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 1,
      to: 2,
    })
  })

  it('should work on page 2 of 7', () => {
    expect(pagination(2, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1' },
      { number: 2, href: '?a=b&page=2', current: true },
      { number: 3, href: '?a=b&page=3' },
      { ellipsis: true },
      { number: 6, href: '?a=b&page=6' },
      { number: 7, href: '?a=b&page=7' },
    ])

    const legacyParams = pagination(2, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: false },
      { text: '2', href: '?a=b&page=2', selected: true },
      { text: '3', href: '?a=b&page=3', selected: false },
      { type: 'dots' },
      { text: '6', href: '?a=b&page=6', selected: false },
      { text: '7', href: '?a=b&page=7', selected: false },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 3,
      to: 4,
    })
  })

  it('should work on page 3 of 7', () => {
    expect(pagination(3, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1' },
      { number: 2, href: '?a=b&page=2' },
      { number: 3, href: '?a=b&page=3', current: true },
      { number: 4, href: '?a=b&page=4' },
      { ellipsis: true },
      { number: 6, href: '?a=b&page=6' },
      { number: 7, href: '?a=b&page=7' },
    ])

    const legacyParams = pagination(3, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: false },
      { text: '2', href: '?a=b&page=2', selected: false },
      { text: '3', href: '?a=b&page=3', selected: true },
      { text: '4', href: '?a=b&page=4', selected: false },
      { type: 'dots' },
      { text: '6', href: '?a=b&page=6', selected: false },
      { text: '7', href: '?a=b&page=7', selected: false },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 5,
      to: 6,
    })
  })

  it('should work on page 4 of 7', () => {
    expect(pagination(4, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1' },
      { number: 2, href: '?a=b&page=2' },
      { number: 3, href: '?a=b&page=3' },
      { number: 4, href: '?a=b&page=4', current: true },
      { number: 5, href: '?a=b&page=5' },
      { number: 6, href: '?a=b&page=6' },
      { number: 7, href: '?a=b&page=7' },
    ])

    const legacyParams = pagination(4, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: false },
      { text: '2', href: '?a=b&page=2', selected: false },
      { text: '3', href: '?a=b&page=3', selected: false },
      { text: '4', href: '?a=b&page=4', selected: true },
      { text: '5', href: '?a=b&page=5', selected: false },
      { text: '6', href: '?a=b&page=6', selected: false },
      { text: '7', href: '?a=b&page=7', selected: false },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 7,
      to: 8,
    })
  })

  it('should work on page 5 of 7', () => {
    expect(pagination(5, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1' },
      { number: 2, href: '?a=b&page=2' },
      { ellipsis: true },
      { number: 4, href: '?a=b&page=4' },
      { number: 5, href: '?a=b&page=5', current: true },
      { number: 6, href: '?a=b&page=6' },
      { number: 7, href: '?a=b&page=7' },
    ])

    const legacyParams = pagination(5, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: false },
      { text: '2', href: '?a=b&page=2', selected: false },
      { type: 'dots' },
      { text: '4', href: '?a=b&page=4', selected: false },
      { text: '5', href: '?a=b&page=5', selected: true },
      { text: '6', href: '?a=b&page=6', selected: false },
      { text: '7', href: '?a=b&page=7', selected: false },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 9,
      to: 10,
    })
  })

  it('should work on page 6 of 7', () => {
    expect(pagination(6, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1' },
      { number: 2, href: '?a=b&page=2' },
      { ellipsis: true },
      { number: 5, href: '?a=b&page=5' },
      { number: 6, href: '?a=b&page=6', current: true },
      { number: 7, href: '?a=b&page=7' },
    ])

    const legacyParams = pagination(6, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: false },
      { text: '2', href: '?a=b&page=2', selected: false },
      { type: 'dots' },
      { text: '5', href: '?a=b&page=5', selected: false },
      { text: '6', href: '?a=b&page=6', selected: true },
      { text: '7', href: '?a=b&page=7', selected: false },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 11,
      to: 12,
    })
  })

  it('should work on page 7 of 7', () => {
    expect(pagination(7, 7, '?a=b&')).toHaveProperty<Pagination['items']>('items', [
      { number: 1, href: '?a=b&page=1' },
      { number: 2, href: '?a=b&page=2' },
      { ellipsis: true },
      { number: 6, href: '?a=b&page=6' },
      { number: 7, href: '?a=b&page=7', current: true },
    ])

    const legacyParams = pagination(7, 7, '?a=b&', 'moj', 14, 2)
    expect(legacyParams).toHaveProperty<LegacyPagination['items']>('items', [
      { text: '1', href: '?a=b&page=1', selected: false },
      { text: '2', href: '?a=b&page=2', selected: false },
      { type: 'dots' },
      { text: '6', href: '?a=b&page=6', selected: false },
      { text: '7', href: '?a=b&page=7', selected: true },
    ])
    expect(legacyParams).toHaveProperty<LegacyPagination['results']>('results', {
      count: 14,
      from: 13,
      to: 14,
    })
  })

  it('should not accept 0 resultsPerPage', () => {
    expect(() => {
      pagination(7, 7, '?a=b&', 'moj', 14, 0)
    }).toThrow('Invalid resultsPerPage')
  })
})
