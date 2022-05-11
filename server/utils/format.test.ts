import format from './format'

describe.each([
  // same UTC offset, not DST
  ['2022-02-22T12:00:00Z', '22 February 2022, 12:00'],
  // differing UTC offset, not DST
  ['2022-02-22T12:00:00+01:00', '22 February 2022, 11:00'],

  // same UTC offset, DST
  ['2022-06-22T12:00:00Z', '22 June 2022, 13:00'],
  // differing UTC offset, DST
  ['2022-06-22T12:00:00+01:00', '22 June 2022, 12:00'],

  // near DST switch
  ['2021-10-30T23:59:59Z', '31 October 2021, 00:59'],
  ['2021-10-31T00:00:00Z', '31 October 2021, 01:00'],
  ['2021-10-31T00:00:01Z', '31 October 2021, 01:00'],
  ['2021-10-31T00:59:59Z', '31 October 2021, 01:59'],
  ['2021-10-31T01:00:00Z', '31 October 2021, 01:00'],
  ['2021-10-31T01:00:01Z', '31 October 2021, 01:00'],

  // 24-hr clock
  ['2022-02-23T16:37:53Z', '23 February 2022, 16:37'],
])('Format dates as Europe/London', (date: string | number, expected: string) => {
  it(`new Date(${date}) formats as ${expected}`, () => {
    expect(format.date(new Date(date))).toEqual(expected)
  })
})

describe.each([
  // same UTC offset, not DST
  ['2022-02-22T12:00:00Z', '22 February 2022'],
  // differing UTC offset, not DST
  ['2022-02-22T12:00:00+01:00', '22 February 2022'],

  // same UTC offset, DST
  ['2022-06-22T12:00:00Z', '22 June 2022'],
  // differing UTC offset, DST
  ['2022-06-22T12:00:00+01:00', '22 June 2022'],

  // near DST switch
  ['2021-10-30T23:59:59Z', '31 October 2021'],
  ['2021-10-31T00:00:00Z', '31 October 2021'],
  ['2021-10-31T00:00:01Z', '31 October 2021'],
  ['2021-10-31T00:59:59Z', '31 October 2021'],
  ['2021-10-31T01:00:00Z', '31 October 2021'],
  ['2021-10-31T01:00:01Z', '31 October 2021'],

  // 24-hr clock
  ['2022-02-23T16:37:53Z', '23 February 2022'],
])('Format dates as Europe/London ignoring time-of-day', (date: string | number, expected: string) => {
  it(`new Date(${date}) formats as ${expected} ignoring time-of-day`, () => {
    expect(format.shortDate(new Date(date))).toEqual(expected)
  })
})

describe.each([
  ['2022-05', 2022, 'May'],
  ['2021-01', 2021, 'Jan'],
  ['2022-12', 2022, 'Dec'],
  // non-standard, but works still
  ['2022-5', 2022, 'May'],
  ['2021-1', 2021, 'Jan'],
  // invalid
  ['2021-', 2021, undefined],
  ['2021-13', 2021, undefined],
  ['', undefined, undefined],
  [null, undefined, undefined],
])('Split year-and-month strings', (yearAndMonth: string, expectedYear: number, expectedMonth: string) => {
  it(`${yearAndMonth} splits into ${expectedYear} and ${expectedMonth}`, () => {
    const { year, month } = format.splitYearAndMonth(yearAndMonth)
    expect(year).toEqual(expectedYear)
    expect(month).toEqual(expectedMonth)
  })
})

describe.each([
  [0, '0'],
  [1, '1'],
  [123, '123'],
  [1234, '1,234'],
  [12345, '12,345'],
  [12345678, '12,345,678'],
  [-1, '-1'],
  [-1234, '-1,234'],
  [Math.PI, '3'],
  [12345.62, '12,346'],
  [NaN, '?'],
  [undefined, '?'],
  [null, '?'],
])('Format integers with thousands separator', (n: number, expected: string) => {
  it(`${n} fornats as ${expected}`, () => {
    expect(format.thousands(n)).toEqual(expected)
  })
})

describe.each([
  [0, 100, '0%', '0%'],
  [10, 100, '10%', '10%'],
  [100, 100, '100%', '100%'],
  [37.7, 100, '38%', '37.7%'],
  [-37.7, 100, '-38%', '-37.7%'],
  [37, 68, '54%', '54.412%'],
  [0, 0, '0%', '0%'],
  [10, 0, '?', '?'],
  [10, NaN, '?', '?'],
  [NaN, 100, '?', '?'],
  [10, undefined, '?', '?'],
  [undefined, 100, '?', '?'],
  [null, 100, '?', '?'],
])('Format percentages', (value: number, total: number, expected: string, expectedUnrounded: string) => {
  it(`${value}/${total} as a percentage formats as ${expected}`, () => {
    expect(format.percentage(value, total)).toEqual(expected)
  })

  it(`${value}/${total} as a percentage formats as ${expectedUnrounded} without rounding`, () => {
    expect(format.percentage(value, total, false)).toEqual(expectedUnrounded)
  })
})
