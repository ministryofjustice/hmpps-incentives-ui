import {
  convertToTitleCase,
  daysSince,
  formatName,
  initialiseName,
  inputStringToPenceAmount,
  penceAmountToInputString,
  possessive,
  properCaseName,
  putLastNameFirst,
  nameOfPerson,
  newDaysSince,
} from './utils'

describe('name formatting', () => {
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
    ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
      expect(initialiseName(a)).toEqual(expected)
    })
  })

  describe('possessive', () => {
    it('No string', () => {
      expect(possessive(null)).toEqual('')
    })
    it('Converts name with no S correctly', () => {
      expect(possessive('David Smith')).toEqual('David Smith’s')
    })
    it('Converts name with S correctly', () => {
      expect(possessive('David Jones')).toEqual('David Jones’')
    })
  })

  describe('properCaseName', () => {
    it('null string', () => {
      expect(properCaseName(null)).toEqual('')
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

  describe('putLastNameFirst()', () => {
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

  describe('name of person', () => {
    it('can format name', () => {
      expect(nameOfPerson({ firstName: 'DAVID', lastName: 'JONES' })).toEqual('David Jones')
    })
    it('can format first name only', () => {
      expect(nameOfPerson({ firstName: 'DAVID', lastName: '' })).toEqual('David')
    })
    it('can format last name only', () => {
      expect(nameOfPerson({ firstName: undefined, lastName: 'Jones' })).toEqual('Jones')
    })
    it('can format empty name ', () => {
      expect(nameOfPerson({ firstName: '', lastName: '' })).toEqual('')
    })
    it('can format no name ', () => {
      expect(nameOfPerson({ firstName: undefined, lastName: undefined })).toEqual('')
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
    jest.spyOn(Date, 'now').mockImplementation(() => 1664192096000) // 2022-09-26T12:34:56.000+01:00
  })

  afterAll(() => {
    const spy = jest.spyOn(Date, 'now')
    spy.mockRestore()
  })

  it.each(['2022-09-25', '2022-09-25T17:00:00Z', '2022-09-25T23:59:59+01:00'])(
    'returns 1 when date is yesterday',
    date => expect(newDaysSince(date)).toEqual<number>(1),
  )

  it.each([
    ['2022-09-24', 2],
    ['2021-09-26', 365],
  ])('returns days elapsed since date', (date, expected) => expect(newDaysSince(date)).toEqual<number>(expected))

  it.each(['2022-09-26', '2022-09-26T00:00:00Z', '2022-09-26T23:59:59+01:00'])('returns 0 when date is today', date =>
    expect(newDaysSince(date)).toEqual<number>(0),
  )

  it.each(['2022-09-27', '2023-09-26', '2022-09-27T00:00:00Z'])('returns 0 for dates in future', date =>
    expect(newDaysSince(date)).toEqual<number>(0),
  )
})

describe('convert between numeric pence and pound-pence string representations', () => {
  it.each([
    [0, '0.00'],
    [1, '0.01'],
    [100, '1.00'],
    [100_00, '100.00'],
    [1000_00, '1000.00'],
  ])('penceAmountToInputString(%s) → %s', (input: number, expected: string) => {
    expect(penceAmountToInputString(input)).toEqual(expected)
  })

  it.each([NaN, null, undefined, '0.00', ''])('penceAmountToInputString(%s) throws an error', (input: unknown) => {
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
  ])('inputStringToPenceAmount(%s) → %s', (input: string, expected: number) => {
    expect(inputStringToPenceAmount(input)).toEqual(expected)
  })

  it.each(['', null, undefined, '£1', '£1.00', '1.', '1,000', '1,000.00'])(
    'inputStringToPenceAmount(%s) throws an error',
    (input: unknown) => {
      expect(() => inputStringToPenceAmount(input as string)).toThrow()
    },
  )
})
