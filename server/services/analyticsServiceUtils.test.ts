import { compareLocations, compareCharacteristics, removeLevelPrefix } from './analyticsServiceUtils'

describe('comparators and filters', () => {
  describe.each([
    { a: { label: 'All' }, b: { label: '1' }, expected: -1 },
    { a: { label: 'Unknown' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'Unknown' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'A' }, b: { label: 'All' }, expected: 1 },
    { a: { label: '1' }, b: { label: 'A' }, expected: -1 },
    { a: { label: '1' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'A' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'A' }, b: { label: 'B' }, expected: -1 },
    { a: { label: 'SEG' }, b: { label: 'X' }, expected: 1 },
    { a: { label: 'RECP' }, b: { label: 'SEG' }, expected: -1 },
    { a: { label: 'RECP' }, b: { label: 'Unknown' }, expected: -1 },
  ])('compareLocations()', ({ a, b, expected }) => {
    let compares = '='
    if (expected > 0) {
      compares = '>'
    } else if (expected < 0) {
      compares = '<'
    }
    it(`${a.label} ${compares} ${b.label}`, () => {
      expect(compareLocations(a, b)).toEqual(expected)
    })
  })

  describe.each([
    { a: { label: 'All' }, b: { label: 'Asian or Asian British' }, expected: -1 },
    { a: { label: 'Black or Black British' }, b: { label: 'Mixed' }, expected: -1 },
    { a: { label: 'Unknown' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'Other' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'White' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'Asian or Asian British' }, b: { label: 'Other' }, expected: -1 },
    { a: { label: 'Asian or Asian British' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'Yes' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'Other' }, b: { label: 'Yes' }, expected: 1 },
    { a: { label: 'Unknown' }, b: { label: 'Other' }, expected: 1 },
  ])('compareCharacteristics()', ({ a, b, expected }) => {
    let compares = '='
    if (expected > 0) {
      compares = '>'
    } else if (expected < 0) {
      compares = '<'
    }
    it(`${a.label} ${compares} ${b.label}`, () => {
      expect(compareCharacteristics(a, b)).toEqual(expected)
    })
  })

  describe.each([
    ['B. Basic', 'Basic'],
    ['C. Standard', 'Standard'],
    ['D. Enhanced', 'Enhanced'],
    ['E. Enhanced 2', 'Enhanced 2'],
    // Prefixes are expected to always be "[letter]. ", so don't mangle other formats
    ['Enhanced 2', 'Enhanced 2'],
    ['A Entry', 'A Entry'],
  ])('removeLevelPrefix()', (levelWithPrefix, expectedLevelWithoutPrefix) => {
    it(`Level "${levelWithPrefix}" becomes "${expectedLevelWithoutPrefix}" without prefix`, () => {
      expect(removeLevelPrefix(levelWithPrefix)).toEqual(expectedLevelWithoutPrefix)
    })
  })
})
