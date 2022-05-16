import Page from '../pages/page'
import HomePage from '../pages/home'
import { type AnalyticsPage, getTextFromTable } from '../pages/analytics'
import AnalyticsBehaviourEntries from '../pages/analyticsBehaviourEntries'
import AnalyticsIncentiveLevels from '../pages/analyticsIncentiveLevels'
import AnalyticsProtectedCharacteristics from '../pages/analyticsProtectedCharacteristics'
import GoogleAnalyticsSpy from '../plugins/googleAnalyticsSpy'

context('Analytics section', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
  })

  it('has feedback banner', () => {
    Page.verifyOnPage(AnalyticsIncentiveLevels)
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/analytics-feedback')
  })

  context('behaviour entries page', () => {
    beforeEach(() => {
      const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
      somePage.behaviourEntriesNavItem.click()
    })

    it('users see analytics', () => {
      const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      page.entriesByLocation.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('462')
      })

      page.prisonersWithEntriesByLocation.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('1,194')
      })

      getTextFromTable(page.entriesTrends).then(rows => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [positivesRow, negativesRow, _totalRow, populationRow] = rows
        // remove header column
        positivesRow.shift()
        negativesRow.shift()
        populationRow.shift()

        expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
          // monthly positive entries
          ['145', '194', '173', '191', '205', '155', '209', '160', '254', '176', '170', '131']
        )
        expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
          // monthly negative entries
          ['301', '248', '243', '267', '310', '295', '322', '307', '277', '333', '353', '318']
        )
        expect(populationRow).to.deep.equal(
          // monthly average population
          ['929', '917', '932', '937', '928', '921', '926', '930', '935', '920', '915', '922']
        )
      })
    })

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphGuidance('entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entries by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entries by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphGuidance('prisoners-with-entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Prisoners with behaviour entries by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('prisoners-with-entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Prisoners with behaviour entries by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphGuidance('trends-entries')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entry trends',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('trends-entries')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entry trends',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphFeedback('entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entries by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entries by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('prisoners-with-entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Prisoners with behaviour entries by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('prisoners-with-entries-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Prisoners with behaviour entries by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('trends-entries')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entry trends',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('trends-entries')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entry trends',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('users can submit feedback on charts', () => {
      testValidFeedbackSubmission(AnalyticsBehaviourEntries, [
        'entries-by-location',
        'prisoners-with-entries-by-location',
        'trends-entries',
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsBehaviourEntries, [
        'entries-by-location',
        'prisoners-with-entries-by-location',
        'trends-entries',
      ])
    })
  })

  context('incentive levels page', () => {
    it('users see analytics', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      page.incentivesByLocation.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      getTextFromTable(page.incentivesTrends).then(rows => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
        // remove header column
        standardRow.shift()
        populationRow.shift()

        expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
          // monthly average population on standard level
          ['571', '568', '572', '567', '554', '552', '555', '568', '561', '534', '533', '543']
        )
        expect(populationRow).to.deep.equal(
          // monthly average population
          ['929', '917', '932', '937', '928', '921', '926', '930', '935', '920', '915', '922']
        )
      })
    })

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphGuidance('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphGuidance('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level trends',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level trends',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphFeedback('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level trends',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level trends',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('users can submit feedback on chart', () => {
      testValidFeedbackSubmission(AnalyticsIncentiveLevels, ['incentive-levels-by-location', 'trends-incentive-levels'])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsIncentiveLevels, [
        'incentive-levels-by-location',
        'trends-incentive-levels',
      ])
    })
  })

  context('protected characteristics page', () => {
    beforeEach(() => {
      const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
      somePage.protectedCharacteristicsNavItem.click()
    })

    it('users see analytics', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      page.populationByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:nth-child(3)').text()
        expect(location).to.contain('921')
      })

      page.incentivesByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      page.entriesByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })
    })

    it('selector allows user to change protected characteristic', () => {
      cy.get('#characteristic').select('Sexual orientation')
      cy.get('#form-select-characteristic button').click()

      cy.get('h2.govuk-heading-m')
        .first()
        .contains('Percentage and number of prisoners in the establishment by sexual orientation')
    })

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphGuidance('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by age',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphGuidance('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entries by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entries by age',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphFeedback('population-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Population by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('population-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Population by age',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by age',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entries by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entries by age',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('users can submit feedback on charts', () => {
      testValidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        'population-by-age',
        'incentive-levels-by-age',
        'entries-by-age',
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        'population-by-age',
        'incentive-levels-by-age',
        'entries-by-age',
      ])
    })
  })
})

function testValidFeedbackSubmission<PageClass extends AnalyticsPage>(pageClass: new () => PageClass, feedbackBoxes) {
  feedbackBoxes.forEach(graphId => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "yes"
    page.getGraphFeedback(graphId).click()
    page.getGraphFeedbackForm(graphId).find('[name=chartUseful][value=yes]').click()
    page.getGraphFeedbackForm(graphId).submit()

    // should remain on the same page with a success message and no error summary
    page = Page.verifyOnPage(pageClass)
    page.messages.spread((...$divs) => {
      expect($divs).to.have.lengthOf(1)
      expect($divs[0]).to.contain('Your feedback has been submitted')
    })
    page.errorSummary.should('not.exist')
  })
}

function testInvalidFeedbackSubmission<PageClass extends AnalyticsPage>(pageClass: new () => PageClass, feedbackBoxes) {
  feedbackBoxes.forEach(graphId => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "no", typing some comments
    page.getGraphFeedback(graphId).click()
    page.getGraphFeedbackForm(graphId).find('[name=chartUseful][value=no]').click()
    page.getGraphFeedbackForm(graphId).find('[name=noComments]').type('I’m confused')
    page.getGraphFeedbackForm(graphId).submit()

    // should remain on the same page
    page = Page.verifyOnPage(pageClass)

    // error summary should have 1 error message
    page.messages.should('not.exist')
    page.errorSummaryTitle.contains('There is a problem')
    page.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Select a reason for your answer')
    })
    // feedback box should be open already
    page.getGraphFeedback(graphId).parent().should('have.attr', 'open')
    // "no" should already be checked
    page.getGraphFeedbackForm(graphId).find('[name=chartUseful][value=no]').should('have.attr', 'checked')
    // typed comments should still be there
    page.getGraphFeedbackForm(graphId).find('[name=noComments]').should('have.value', 'I’m confused')
    // same error message should show
    page.getGraphFeedbackForm(graphId).find('p.govuk-error-message').contains('Select a reason for your answer')
  })
}
