import Page from './page'

export default class BehaviourEntriesPage extends Page {
  constructor() {
    super(`incentive levels and behaviours`)
  }

  entries(levelId: string) {
    return cy
      .get(`.govuk-tabs__panel#${levelId} > table`)
      .find('.govuk-table__body tr')
      .spread((...rest) =>
        rest.map(element => {
          const tds = Cypress.$(element).find('td.govuk-table__cell')
          return {
            imageSrc: Cypress.$(tds[0]).find('img').attr('src'),
            name: Cypress.$(tds[1]).text(),
            nameLink: Cypress.$(tds[1]).find('a').attr('href'),
            daysOnLevel: Cypress.$(tds[2]).text(),
            daysSinceLastReview: Cypress.$(tds[3]).text(),
            positiveBehaviours: Cypress.$(tds[4]).text(),
            incentiveEncouragements: Cypress.$(tds[5]).text(),
            negativeBehaviours: Cypress.$(tds[6]).text(),
            incentiveWarnings: Cypress.$(tds[7]).text(),
            provenAdjudications: Cypress.$(tds[8]).text(),
          }
        })
      )
  }
}
