import AnalyticsView from './analyticsView'
import type { PgdRegionCode } from './pgdRegionService'

const viewTypes: ('behaviour-entries' | 'incentive-levels' | 'protected-characteristic')[] = [
  'behaviour-entries',
  'incentive-levels',
  'protected-characteristic',
]

const national = new AnalyticsView('National', 'behaviour-entries', 'MDI')
const regional = new AnalyticsView('LTHS', 'behaviour-entries', 'MDI')
const prison = new AnalyticsView(null, 'behaviour-entries', 'MDI')

describe('AnalyticsView', () => {
  describe('isValidPgdRegion', () => {
    it('for national level returns true', () => {
      expect(national.isValidPgdRegion).toEqual(true)
    })

    describe('for regional level', () => {
      it('returns true when PGD region code is recognised', () => {
        expect(regional.isValidPgdRegion).toEqual(true)
      })

      it('returns false when PGD region code is not recognised', () => {
        const analyticsView = new AnalyticsView('INVALID_REGION_CODE' as PgdRegionCode, 'behaviour-entries', 'MDI')
        expect(analyticsView.isValidPgdRegion).toEqual(false)
      })
    })

    it('for prison level returns true', () => {
      expect(prison.isValidPgdRegion).toEqual(true)
    })
  })

  describe('pgdRegionName', () => {
    it(`for regional, it returns the PGD region name`, () => {
      expect(regional.pgdRegionName).toEqual('Long-term and high security')
    })

    it(`for national, returns null`, () => {
      expect(national.pgdRegionName).toBeNull()
    })

    it(`for a prison, returns null`, () => {
      expect(prison.pgdRegionName).toBeNull()
    })
  })

  describe('getFiltering()', () => {
    it(`for national, don't filter, group by PGD region`, () => {
      expect(national.getFiltering()).toEqual({
        filterColumn: null,
        filterValue: null,
        groupBy: 'pgd_region',
      })
    })

    it(`for regional, filters by PGD region, group by prison`, () => {
      expect(regional.getFiltering()).toEqual({
        filterColumn: 'pgd_region',
        filterValue: 'Long-term and high security',
        groupBy: 'prison',
      })
    })

    it(`for a prison, filters by prison, group by wing`, () => {
      expect(prison.getFiltering()).toEqual({
        filterColumn: 'prison',
        filterValue: 'MDI',
        groupBy: 'location_desc',
      })
    })
  })

  describe('isNational', () => {
    it(`for national, returns true`, () => {
      expect(national.isNational).toEqual(true)
    })

    it(`for regional, returns false`, () => {
      expect(regional.isNational).toEqual(false)
    })

    it(`for a prison, returns false`, () => {
      expect(prison.isNational).toEqual(false)
    })
  })

  describe('isRegional', () => {
    it(`for national, returns false`, () => {
      expect(national.isRegional).toEqual(false)
    })

    it(`for regional, returns true`, () => {
      expect(regional.isRegional).toEqual(true)
    })

    it(`for a prison, returns false`, () => {
      expect(prison.isRegional).toEqual(false)
    })
  })

  describe('isPrisonLevel', () => {
    it(`for national, returns false`, () => {
      expect(national.isPrisonLevel).toEqual(false)
    })

    it(`for regional, returns false`, () => {
      expect(regional.isPrisonLevel).toEqual(false)
    })

    it(`for a prison, returns true`, () => {
      expect(prison.isPrisonLevel).toEqual(true)
    })
  })

  describe('levelForTitle', () => {
    it(`for National, it return 'National'`, () => {
      const analyticsView = new AnalyticsView('National', 'behaviour-entries', 'MDI')
      expect(analyticsView.levelForTitle).toEqual('National')
    })

    it('for Regional, it returns the PGD region name', () => {
      const analyticsView = new AnalyticsView('LTHS', 'behaviour-entries', 'MDI')
      expect(analyticsView.levelForTitle).toEqual('Long-term and high security')
    })

    it(`for a prison, it returns 'Prison'`, () => {
      const analyticsView = new AnalyticsView(null, 'behaviour-entries', 'MDI')
      expect(analyticsView.levelForTitle).toEqual('Prison')
    })
  })

  describe('linkTo()', () => {
    it('for National', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView('National', 'behaviour-entries', 'MDI')
        expect(analyticsView.linkTo(viewType)).toEqual(`/analytics/National/${viewType}`)
      }
    })

    it('for Regional', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView('LTHS', 'behaviour-entries', 'MDI')
        expect(analyticsView.linkTo(viewType)).toEqual(`/analytics/LTHS/${viewType}`)
      }
    })

    it('for a prison', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView(null, 'behaviour-entries', 'MDI')
        expect(analyticsView.linkTo(viewType)).toEqual(`/analytics/${viewType}`)
      }
    })
  })

  describe('getUrlFunction()', () => {
    it('for National, returns a function that links to regional level', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView('National', viewType, 'MDI')
        const urlFn = analyticsView.getUrlFunction()
        expect(urlFn(null, 'Wales')).toEqual(`/analytics/WLS/${viewType}`)
      }
    })

    it('for Regional, returns a function which always returns null', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView('LTHS', viewType, 'MDI')
        const urlFn = analyticsView.getUrlFunction()
        expect(urlFn('Wales', 'BWI')).toBeNull()
      }
    })

    it('for a prison, returns a function that links to Incentives table', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView(null, viewType, 'BWI')
        const urlFn = analyticsView.getUrlFunction()
        expect(urlFn('BWI', 'A')).toEqual(`/incentive-summary/BWI-A`)
      }
    })

    it('for a prison, does not link to Incentives table if the location is not a real wing', () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const viewType of viewTypes) {
        const analyticsView = new AnalyticsView(null, viewType, 'BWI')
        const urlFn = analyticsView.getUrlFunction()
        expect(urlFn('BWI', 'All')).toBeNull()
        expect(urlFn('BWI', 'Non-wing')).toBeNull()
        expect(urlFn('BWI', 'Unknown')).toBeNull()
      }
    })
  })
})
