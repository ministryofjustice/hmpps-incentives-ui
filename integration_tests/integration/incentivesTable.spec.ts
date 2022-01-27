import Page from '../pages/page'
import LocationSelectionPage from '../pages/locationSelection'
import BehaviourEntriesPage from '../pages/behaviourEntriesPage'
import config from '../../server/config'

context('Wing incentives table page', () => {
  let locationSelectionPage: LocationSelectionPage
  let behaviourEntriesPage: BehaviourEntriesPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentivesApiGetLocationSummary')

    cy.signIn()
    locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)

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
          imageSrc: '/assets/images/prisoner.jpeg',
          name: 'Doe, Jane (A1234AB)',
          nameLink: `${config.dpsUrl}/prisoner/A1234AB`,
          daysOnLevel: '50',
          daysSinceLastReview: '10',
          positiveBehaviours: '100',
          incentiveEncouragements: '99',
          negativeBehaviours: '10',
          incentiveWarnings: '9',
          provenAdjudications: '1',
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
          imageSrc: '/assets/images/prisoner.jpeg',
          name: 'Dean, James (B1234CD)',
          nameLink: 'http://localhost:3000/prisoner/B1234CD',
          daysOnLevel: '100',
          daysSinceLastReview: '10',
          positiveBehaviours: '123',
          incentiveEncouragements: '100',
          negativeBehaviours: '1',
          incentiveWarnings: '0',
          provenAdjudications: '0',
        })
        expect(entries[1]).to.deep.equal({
          imageSrc: '/assets/images/prisoner.jpeg',
          name: 'Doe, John (C1234EF)',
          nameLink: 'http://localhost:3000/prisoner/C1234EF',
          daysOnLevel: '10',
          daysSinceLastReview: '10',
          positiveBehaviours: '80',
          incentiveEncouragements: '79',
          negativeBehaviours: '0',
          incentiveWarnings: '0',
          provenAdjudications: '0',
        })
      })
    })
  })
})
