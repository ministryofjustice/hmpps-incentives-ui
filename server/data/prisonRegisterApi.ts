import config from '../config'
import RestClient from './restClient'

export type PrisonType = 'HMP' | 'IRC' | 'STC' | 'YOI'

export interface Prison {
  prisonId: string
  prisonName: string
  active: boolean
  female: boolean
  male: boolean
  types: { code: PrisonType; description: string }[]
  addresses: {
    id: number
    addressLine1?: string
    addressLine2?: string
    town: string
    county?: string
    postcode: string
    country: string
  }[]
}

type Search = {
  active?: boolean
  textSearch?: string
  genders?: string[]
  prisonTypeCodes?: PrisonType[]
}

export default class PrisonRegisterApi extends RestClient {
  constructor(token?: string) {
    super('HMPPS Prison Register', config.apis.prisonRegisterApi, token)
  }

  /**
   * Returns all known prisons, including inactive ones
   */
  getPrisonList(): Promise<Prison[]> {
    return this.unauthenticatedGet<Prison[]>({ path: '/prisons' })
  }

  /**
   * Returns a filtered list of prisons, active only by default
   */
  searchPrisons({ active = true, textSearch, genders, prisonTypeCodes }: Search = {}): Promise<Prison[]> {
    return this.unauthenticatedGet<Prison[]>({
      path: '/prisons/search',
      query: { active, textSearch, genders, prisonTypeCodes },
    })
  }
}
