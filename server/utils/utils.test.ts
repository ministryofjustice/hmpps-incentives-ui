import { convertToTitleCase, daysSince, initialiseName } from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('counting days since a date', () => {
  beforeAll(() => {
    const today = new Date('2022-10-09T13:20:35.000+01:00')
    jest.useFakeTimers({ now: today })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it.each([new Date(2022, 9, 8), new Date(2022, 9, 8, 12), new Date('2022-10-08T13:20:35Z')])(
    'returns 1 when date is yesterday',
    date => {
      expect(daysSince(date)).toEqual<number>(1)
    },
  )

  it.each([
    [new Date(2022, 9, 7), 2],
    [new Date(2022, 9, 6, 12, 30, 45, 1), 3],
    [new Date('2021-10-09T13:20:35.000+01:00'), 365],
  ])('returns days elapsed since date', (date, expectedDays) => {
    expect(daysSince(date)).toEqual<number>(expectedDays)
  })

  it.each([
    new Date('2022-10-09T10:00:00.000+01:00'),
    new Date('2022-10-09T20:00:00.000Z'),
    new Date(2022, 9, 9),
    new Date(2022, 9, 9, 12, 10, 30, 5),
  ])('returns 0 when date is today', date => {
    expect(daysSince(date)).toEqual<number>(0)
  })

  it.each([
    new Date('2022-10-10T12:00:00.000+01:00'),
    new Date(2022, 10, 9),
    new Date('2023-10-09T13:20:35.000+01:00'),
  ])('returns 0 for dates in future', date => {
    expect(daysSince(date)).toEqual<number>(0)
  })

  describe('returns a whole number of days when dates cross daylight saving switches', () => {
    it('when clocks go back', () => {
      const today = new Date('2022-11-09T13:20:35.000+00:00')
      jest.useFakeTimers({ now: today })

      const date = new Date('2022-07-12T12:10:35.000+01:00')
      expect(daysSince(date)).toEqual<number>(120)
    })

    it('when clocks go forward', () => {
      const today = new Date('2023-05-02T13:20:35.000+01:00')
      jest.useFakeTimers({ now: today })

      const date = new Date('2023-02-10T12:10:35.000+00:00')
      expect(daysSince(date)).toEqual<number>(81)
    })
  })
})
