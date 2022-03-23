import Page from './page'

export default class BehaviourEntriesPage extends Page {
  constructor() {
    super(`Incentive information`)
  }

  entries(levelId: string) {
    return cy
      .get(`.govuk-tabs__panel#${levelId} > table`)
      .find('.govuk-table__body tr')
      .spread((...rest) =>
        rest.map(element => {
          const tds = Cypress.$(element).find('td.govuk-table__cell:visible')
          return {
            imageSrc: Cypress.$(tds[0]).find('img').attr('src'),
            name: Cypress.$(tds[1]).find('a').html(),
            nameLink: Cypress.$(tds[1]).find('a').attr('href'),
            positiveBehaviours: Cypress.$(tds[2]).text(),
            positiveBehavioursLink: Cypress.$(tds[2]).find('a').attr('href'),
            incentiveEncouragements: Cypress.$(tds[3]).text(),
            incentiveEncouragementsLink: Cypress.$(tds[3]).find('a').attr('href'),
            negativeBehaviours: Cypress.$(tds[4]).text(),
            negativeBehavioursLink: Cypress.$(tds[4]).find('a').attr('href'),
            incentiveWarnings: Cypress.$(tds[5]).text(),
            incentiveWarningsLink: Cypress.$(tds[5]).find('a').attr('href'),
            provenAdjudications: Cypress.$(tds[6]).text(),
            provenAdjudicationsLink: Cypress.$(tds[6]).find('a').attr('href'),
          }
        })
      )
  }
}
