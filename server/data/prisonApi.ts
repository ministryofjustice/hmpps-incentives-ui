import config from '../config'
import { daysFrom } from '../utils/utils'
import RestClient from './restClient'

const IEP_LEVELS = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']

interface CaseLoad {
  caseLoadId: string
  description: string
  currentlyActive: boolean
  type: string
}

type AgencyIepReviewResponse = {
  firstName: string
  lastName: string
  currentLevel: string
  lastReviewTime: string
  previousLevelReviewDate: string
}

type AgencyIepReviewAdditions = {
  fullName: string
  daysSinceLastReview: number
  daysOnCurrentLevel: number
}

type AgencyIepReview = AgencyIepReviewResponse & AgencyIepReviewAdditions

class PrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Prison API', config.apis.hmppsPrisonApi, token)
  }

  async getAgencyIepReviews(
    agencyId: string,
    query: { location: string; iepLevel: string }
  ): Promise<Array<AgencyIepReview>> {
    const request = {
      path: `/agencies/${agencyId}/iepReview`,
      query,
      headers: {
        'Page-Limit': '200',
      },
    }

    const response = (await this.get(request)) as Array<AgencyIepReview>

    response.sort(sortByLastReviewTime)

    response.map(prisoner => {
      // eslint-disable-next-line no-param-reassign
      prisoner.fullName = `${prisoner.firstName} ${prisoner.lastName}`
      addDaysSinceLastReview(prisoner)
      addDaysOnCurrentLevel(prisoner)
      return prisoner
    })

    return response
  }

  async getUserCaseLoads(): Promise<Array<CaseLoad>> {
    return this.get({ path: '/users/me/caseLoads' }) as Promise<Array<CaseLoad>>
  }

  async setActiveCaseLoad(caseLoadId: string): Promise<unknown> {
    return this.put({ path: '/users/me/activeCaseLoad', data: { caseLoadId } })
  }
}

function sortByLastReviewTime(a: AgencyIepReview, b: AgencyIepReview) {
  return new Date(a.lastReviewTime).getTime() - new Date(b.lastReviewTime).getTime()
}

function addDaysSinceLastReview(prisoner: AgencyIepReview) {
  if (prisoner.lastReviewTime) {
    // eslint-disable-next-line no-param-reassign
    prisoner.daysSinceLastReview = daysFrom(prisoner.lastReviewTime)
  }
}

function addDaysOnCurrentLevel(prisoner: AgencyIepReview) {
  if (prisoner.previousLevelReviewDate) {
    // eslint-disable-next-line no-param-reassign
    prisoner.daysOnCurrentLevel = daysFrom(prisoner.previousLevelReviewDate)
  }
}

export { PrisonApi, IEP_LEVELS, CaseLoad }
