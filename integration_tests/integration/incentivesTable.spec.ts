import Page from '../pages/page'
import HomePage from '../pages/home'
import LocationSelectionPage from '../pages/locationSelection'
import BehaviourEntriesPage from '../pages/behaviourEntriesPage'
import config from '../../server/config'

context('Wing incentives table page', () => {
  let behaviourEntriesPage: BehaviourEntriesPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiImages')
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentivesApiGetLocationSummary')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewIncentivesLevelsLink().click()

    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelect().select('MDI-42')
    locationSelectionPage.continueButton().click()
  })

  it('has correct numbers of people at each level', () => {
    Page.verifyOnPage(BehaviourEntriesPage)
    cy.get('h1').contains('Houseblock 42')

    cy.get('[data-qa=number-at-level-BAS] p').contains('Basic')
    cy.get('[data-qa=number-at-level-BAS] span').contains('1')
    cy.get('[data-qa=number-at-level-STD] p').contains('Standard')
    cy.get('[data-qa=number-at-level-STD] span').contains('2')
  })

  it('has tabs for each level', () => {
    Page.verifyOnPage(BehaviourEntriesPage)

    cy.get('a#tab_BAS').contains('Basic')
    cy.get('a#tab_STD').contains('Standard')
  })

  context(`the 'Basic' level table`, () => {
    beforeEach(() => {
      behaviourEntriesPage = Page.verifyOnPage(BehaviourEntriesPage)
      cy.get('a#tab_BAS').click()
    })

    it('contains the correct prisoner information', () => {
      behaviourEntriesPage.entries('BAS').then(entries => {
        expect(entries.length).equal(1)

        expect(entries[0]).to.deep.equal({
          imageSrc: '/prisoner-images/222222.jpeg',
          name: 'Doe, Jane<br>A1234AB',
          nameLink: caseNotesLink('A1234AB'),
          daysOnLevel: '50',
          daysSinceLastReview: '10',
          positiveBehaviours: '100',
          positiveBehavioursLink: caseNotesLink('A1234AB', { type: 'POS' }),
          incentiveEncouragements: '99',
          incentiveEncouragementsLink: caseNotesLink('A1234AB', { type: 'POS', subType: 'IEP_ENC' }),
          negativeBehaviours: '10',
          negativeBehavioursLink: caseNotesLink('A1234AB', { type: 'NEG' }),
          incentiveWarnings: '9',
          incentiveWarningsLink: caseNotesLink('A1234AB', { type: 'NEG', subType: 'IEP_WARN' }),
          provenAdjudications: '1',
          provenAdjudicationsLink: provenAdjudicationsLink('A1234AB'),
        })
      })
    })
  })

  context(`the 'Standard' level table`, () => {
    beforeEach(() => {
      Page.verifyOnPage(BehaviourEntriesPage)
      cy.get('a#tab_STD').click()
    })

    it('contains the correct prisoner information', () => {
      behaviourEntriesPage.entries('STD').then(entries => {
        expect(entries.length).equal(2)

        expect(entries[0]).to.deep.equal({
          imageSrc: '/prisoner-images/333333.jpeg',
          name: 'Dean, James<br>B1234CD',
          nameLink: caseNotesLink('B1234CD'),
          daysOnLevel: '100',
          daysSinceLastReview: '10',
          positiveBehaviours: '123',
          positiveBehavioursLink: caseNotesLink('B1234CD', { type: 'POS' }),
          incentiveEncouragements: '100',
          incentiveEncouragementsLink: caseNotesLink('B1234CD', { type: 'POS', subType: 'IEP_ENC' }),
          negativeBehaviours: '1',
          negativeBehavioursLink: caseNotesLink('B1234CD', { type: 'NEG' }),
          incentiveWarnings: '0',
          incentiveWarningsLink: caseNotesLink('B1234CD', { type: 'NEG', subType: 'IEP_WARN' }),
          provenAdjudications: '0',
          provenAdjudicationsLink: provenAdjudicationsLink('B1234CD'),
        })
        expect(entries[1]).to.deep.equal({
          imageSrc: '/prisoner-images/444444.jpeg',
          name: 'Doe, John<br>C1234EF',
          nameLink: caseNotesLink('C1234EF'),
          daysOnLevel: '10',
          daysSinceLastReview: '10',
          positiveBehaviours: '80',
          positiveBehavioursLink: caseNotesLink('C1234EF', { type: 'POS' }),
          incentiveEncouragements: '79',
          incentiveEncouragementsLink: caseNotesLink('C1234EF', { type: 'POS', subType: 'IEP_ENC' }),
          negativeBehaviours: '0',
          negativeBehavioursLink: caseNotesLink('C1234EF', { type: 'NEG' }),
          incentiveWarnings: '0',
          incentiveWarningsLink: caseNotesLink('C1234EF', { type: 'NEG', subType: 'IEP_WARN' }),
          provenAdjudications: '0',
          provenAdjudicationsLink: provenAdjudicationsLink('C1234EF'),
        })
      })
    })
  })
})

function caseNotesLink(prisonerNumber: string, params: Record<string, string> = {}) {
  let link = `${config.dpsUrl}/prisoner/${prisonerNumber}/case-notes?`

  const parts = []
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(params)) {
    parts.push(`${key}=${value}`)
  }

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90)

  const fromDate = `${threeMonthsAgo.getDate()}/${threeMonthsAgo.getMonth() + 1}/${threeMonthsAgo.getFullYear()}`

  parts.push(`fromDate=${fromDate}`)

  link += parts.join('&')

  return link
}

function provenAdjudicationsLink(prisonerNumber: string) {
  return `${config.dpsUrl}/prisoner/${prisonerNumber}/adjudications?finding=PROVED`
}
