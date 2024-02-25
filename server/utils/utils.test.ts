import type { ErrorSummaryItem, GovukSelectItem } from '../routes/forms/forms'
import {
  convertToTitleCase,
  daysSince,
  daysSinceMoment,
  findFieldInErrorSummary,
  formatName,
  govukSelectInsertDefault,
  govukSelectSetSelected,
  initialiseName,
  inputStringToPenceAmount,
  parseDateInput,
  penceAmountToInputString,
  possessive,
  properCaseName,
  putLastNameFirst,
} from './utils'

describe('name formatting', () => {
  describe('convert to title case', () => {
    it.each([
      [null, null, ''],
      ['Empty string', '', ''],
      ['Lower case', 'robert', 'Robert'],
      ['Upper case', 'ROBERT', 'Robert'],
      ['Mixed case', 'RoBErT', 'Robert'],
      ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
      ['Leading spaces', '  RobeRT', '  Robert'],
      ['Trailing spaces', 'RobeRT  ', 'Robert  '],
      ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
    ])('%s convertToTitleCase(%p, %p)', (_: string, a: string, expected: string) => {
      expect(convertToTitleCase(a)).toEqual(expected)
    })
  })

  describe('format name', () => {
    it('can format name', () => {
      expect(formatName('david', 'jones')).toEqual('David Jones')
    })
    it('can format first name only', () => {
      expect(formatName('DAVID', '')).toEqual('David')
    })
    it('can format last name only', () => {
      expect(formatName(undefined, 'Jones')).toEqual('Jones')
    })
    it('can format empty name', () => {
      expect(formatName('', '')).toEqual('')
    })
    it('can format no name', () => {
      expect(formatName(undefined, undefined)).toEqual('')
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
    ])('%s initialiseName(%p, %p)', (_: string, a: string, expected: string) => {
      expect(initialiseName(a)).toEqual(expected)
    })
  })

  describe('possessive', () => {
    it.each([undefined, null])('should return empty string for %p', input => {
      expect(possessive(input)).toEqual('')
    })
    it('Converts name with no S correctly', () => {
      expect(possessive('David Smith')).toEqual('David Smith’s')
    })
    it('Converts name with S correctly', () => {
      expect(possessive('David Jones')).toEqual('David Jones’')
    })
  })

  describe('properCaseName', () => {
    it.each([undefined, null])('should return empty string for %p', input => {
      expect(properCaseName(input)).toEqual('')
    })
    it('empty string', () => {
      expect(properCaseName('')).toEqual('')
    })
    it('Lower Case', () => {
      expect(properCaseName('david')).toEqual('David')
    })
    it('Mixed Case', () => {
      expect(properCaseName('DaVId')).toEqual('David')
    })
    it('Multiple words', () => {
      expect(properCaseName('DAVID JONES')).toEqual('David jones')
    })
    it('Hyphenated', () => {
      expect(properCaseName('DAVID-JONES-BART-LISA')).toEqual('David-Jones-Bart-Lisa')
    })
  })

  describe('putLastNameFirst', () => {
    it('should return null if no names specified', () => {
      // @ts-expect-error: Test requires invalid types passed in
      expect(putLastNameFirst()).toEqual(null)
    })

    it('should return correctly formatted last name if no first name specified', () => {
      expect(putLastNameFirst('', 'LASTNAME')).toEqual('Lastname')
    })

    it('should return correctly formatted first name if no last name specified', () => {
      // @ts-expect-error: Test requires invalid types passed in
      expect(putLastNameFirst('FIRSTNAME')).toEqual('Firstname')
    })

    it('should return correctly formatted last name and first name if both specified', () => {
      expect(putLastNameFirst('FIRSTNAME', 'LASTNAME')).toEqual('Lastname, Firstname')
    })
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

describe('days since', () => {
  beforeAll(() => {
    const today = new Date('2022-09-26T12:34:56.000+01:00')
    jest.useFakeTimers({ now: today })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it.each(['2022-09-25', '2022-09-25T17:00:00Z', '2022-09-25T23:59:59+01:00'])(
    'returns 1 when date is yesterday',
    date => expect(daysSinceMoment(date)).toEqual<number>(1),
  )

  it.each([
    ['2022-09-24', 2],
    ['2021-09-26', 365],
  ])('returns days elapsed since date', (date, expected) => expect(daysSinceMoment(date)).toEqual<number>(expected))

  it.each(['2022-09-26', '2022-09-26T00:00:00Z', '2022-09-26T23:59:59+01:00'])('returns 0 when date is today', date =>
    expect(daysSinceMoment(date)).toEqual<number>(0),
  )

  it.each(['2022-09-27', '2023-09-26', '2022-09-27T00:00:00Z'])('returns 0 for dates in future', date =>
    expect(daysSinceMoment(date)).toEqual<number>(0),
  )
})

describe('parseDateInput', () => {
  it.each([
    ['25/02/2024', [25, 2, 2024]],
    ['01/01/2024 ', [1, 1, 2024]],
    ['1/1/2024', [1, 1, 2024]],
  ])('should work on valid date %s', (input, [day, month, year]) => {
    const date = parseDateInput(input)
    expect(date.getDate()).toEqual(day)
    expect(date.getMonth()).toEqual(month - 1)
    expect(date.getFullYear()).toEqual(year)
  })

  it.each([
    undefined,
    null,
    '',
    '1/1/24',
    '32/01/2024',
    '20-01-2024',
    '01/01/2024 12:00',
    '2024-01-01',
    '2024-01-01T12:00:00Z',
    'today',
  ])('should throw an error on invalid date %p', input => {
    expect(() => parseDateInput(input)).toThrow('Invalid date')
  })
})

describe('convert between numeric pence and pound-pence string representations', () => {
  it.each([
    [0, '0.00'],
    [1, '0.01'],
    [100, '1.00'],
    [100_00, '100.00'],
    [1000_00, '1000.00'],
  ])('penceAmountToInputString(%p) → %p', (input: number, expected: string) => {
    expect(penceAmountToInputString(input)).toEqual(expected)
  })

  it.each([NaN, null, undefined, '0.00', ''])('penceAmountToInputString(%p) throws an error', (input: unknown) => {
    expect(() => penceAmountToInputString(input as number)).toThrow()
  })
  it.each([
    ['0', 0],
    ['1', 1_00],
    ['1.00', 1_00],
    ['10', 10_00],
    ['10.00', 10_00],
    ['10.99', 10_99],
    ['1000.01', 1000_01],
  ])('inputStringToPenceAmount(%p) → %p', (input: string, expected: number) => {
    expect(inputStringToPenceAmount(input)).toEqual(expected)
  })

  it.each(['', null, undefined, '£1', '£1.00', '1.', '1,000', '1,000.00'])(
    'inputStringToPenceAmount(%p) throws an error',
    (input: unknown) => {
      expect(() => inputStringToPenceAmount(input as string)).toThrow()
    },
  )
})

describe('findFieldInErrorSummary', () => {
  it.each([undefined, null])('should return null if error list is %p', list => {
    expect(findFieldInErrorSummary(list, 'field')).toBeNull()
  })

  it('should return null if error list is empty', () => {
    expect(findFieldInErrorSummary([], 'field')).toBeNull()
  })

  const errorList: ErrorSummaryItem[] = [
    { text: 'Enter a number', href: '#field1' },
    { text: 'Enter a date', href: '#field3' },
  ]

  it('should return null if field is not found', () => {
    expect(findFieldInErrorSummary(errorList, 'field2')).toBeNull()
  })

  it('should return error message if field is found', () => {
    expect(findFieldInErrorSummary(errorList, 'field3')).toStrictEqual({ text: 'Enter a date' })
  })
})

describe('govukSelectInsertDefault', () => {
  it.each([undefined, null])('should ignore item list %p', list => {
    expect(govukSelectInsertDefault(list, 'Select an option…')).toStrictEqual(list)
  })

  it('should insert a blank item at the beginning', () => {
    const list: GovukSelectItem[] = [{ text: 'Red' }, { text: 'Blue', value: 'blue' }]
    const newList = govukSelectInsertDefault(list, 'Select an option…')
    expect(newList).toHaveLength(3)
    expect(newList[0]).toStrictEqual<GovukSelectItem>({ text: 'Select an option…', value: '', selected: true })
  })

  it('should insert a blank item into an empty list', () => {
    const list: GovukSelectItem[] = []
    const newList = govukSelectInsertDefault(list, 'Choose one')
    expect(newList).toHaveLength(1)
    expect(newList[0]).toStrictEqual<GovukSelectItem>({ text: 'Choose one', value: '', selected: true })
  })
})

describe('govukSelectSetSelected', () => {
  it.each([undefined, null])('should ignore item list %p', list => {
    expect(govukSelectSetSelected(list, 'red')).toStrictEqual(list)
  })

  it('should only leave `selected` as true for item that is found by-value', () => {
    const list: GovukSelectItem[] = [
      { text: 'Red', value: 'red' },
      { text: 'Blue', value: 'blue' },
    ]
    const newList = govukSelectSetSelected(list, 'blue')
    expect(newList).toHaveLength(2)
    expect(newList.map(item => item.selected)).toStrictEqual([false, true])
  })

  it('should set `selected` of all items to false if item is not found by-value', () => {
    const list: GovukSelectItem[] = [
      { text: 'Red', value: 'red' },
      { text: 'Blue', value: 'blue' },
    ]
    const newList = govukSelectSetSelected(list, 'green')
    expect(newList).toHaveLength(2)
    expect(newList.map(item => item.selected)).toStrictEqual([false, false])
  })

  it('should NOT set `selected` on any items if value being selected is undefined', () => {
    const list: GovukSelectItem[] = [
      { text: 'Red', value: 'red' },
      { text: 'Blue', value: 'blue' },
    ]
    const newList = govukSelectSetSelected(list, undefined)
    expect(newList).toHaveLength(2)
    expect(newList.map(item => item.selected)).toStrictEqual([undefined, undefined])
  })

  it('should fall back to matching on `text` property if item `value` is not set', () => {
    const list: GovukSelectItem[] = [{ text: 'Red' }, { text: 'Blue' }]
    const newList = govukSelectSetSelected(list, 'Blue')
    expect(newList).toHaveLength(2)
    expect(newList.map(item => item.selected)).toStrictEqual([false, true])
  })
})
