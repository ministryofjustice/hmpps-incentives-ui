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

      page.entriesByLocationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.entriesByLocationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.prisonersWithEntriesByLocationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Prisoners with behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.prisonersWithEntriesByLocationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Prisoners with behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.entriesTrendsGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entry trends',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.entriesTrendsGuidance.click().then(() =>
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

      page.entriesByLocationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.entriesByLocationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.prisonersWithEntriesByLocationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Prisoners with behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.prisonersWithEntriesByLocationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Prisoners with behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.entriesTrendsFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entry trends',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.entriesTrendsFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entry trends',
          action: 'closed',
          label: 'MDI',
        })
      )
    })

    it('users can submit feedback on charts', () => {
      testValidFeedbackSubmission(AnalyticsBehaviourEntries, [
        ['entriesByLocationFeedback', 'entriesByLocationFeedbackForm'],
        ['prisonersWithEntriesByLocationFeedback', 'prisonersWithEntriesByLocationFeedbackForm'],
        ['entriesTrendsFeedback', 'entriesTrendsFeedbackForm'],
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsBehaviourEntries, [
        ['entriesByLocationFeedback', 'entriesByLocationFeedbackForm'],
        ['prisonersWithEntriesByLocationFeedback', 'prisonersWithEntriesByLocationFeedbackForm'],
        ['entriesTrendsFeedback', 'entriesTrendsFeedbackForm'],
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

      page.incentivesByLocationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by wing',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByLocationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by wing',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesTrendsGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level trends',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesTrendsGuidance.click().then(() =>
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

      page.incentivesByLocationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by wing',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByLocationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by wing',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesTrendsFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level trends',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesTrendsFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level trends',
          action: 'closed',
          label: 'MDI',
        })
      )
    })

    it('users can submit feedback on chart', () => {
      testValidFeedbackSubmission(AnalyticsIncentiveLevels, [
        ['incentivesByLocationFeedback', 'incentivesByLocationFeedbackForm'],
        ['incentivesTrendsFeedback', 'incentivesTrendsFeedbackForm'],
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsIncentiveLevels, [
        ['incentivesByLocationFeedback', 'incentivesByLocationFeedbackForm'],
        ['incentivesTrendsFeedback', 'incentivesTrendsFeedbackForm'],
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

      page.incentivesByEthnicity.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('920')
      })

      page.incentivesByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      page.incentivesByReligion.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      page.incentivesByDisability.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      page.incentivesBySexualOrientation.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })
    })

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page.incentivesByEthnicityGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by ethnicity',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByEthnicityGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by ethnicity',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesByAgeGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by age',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByAgeGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by age',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesByReligionGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by religion',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByReligionGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by religion',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesByDisabilityGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by disability',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByDisabilityGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by disability',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesBySexualOrientationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by sexual orientation',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesBySexualOrientationGuidance.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by sexual orientation',
          action: 'closed',
          label: 'MDI',
        })
      )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page.incentivesByEthnicityFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by ethnicity',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByEthnicityFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by ethnicity',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesByAgeFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by age',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByAgeFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by age',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesByReligionFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by religion',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByReligionFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by religion',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesByDisabilityFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by disability',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesByDisabilityFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by disability',
          action: 'closed',
          label: 'MDI',
        })
      )

      page.incentivesBySexualOrientationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by sexual orientation',
          action: 'opened',
          label: 'MDI',
        })
      )
      page.incentivesBySexualOrientationFeedback.click().then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by sexual orientation',
          action: 'closed',
          label: 'MDI',
        })
      )
    })

    it('users can submit feedback on charts', () => {
      testValidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        ['incentivesByEthnicityFeedback', 'incentivesByEthnicityFeedbackForm'],
        ['incentivesByAgeFeedback', 'incentivesByAgeFeedbackForm'],
        ['incentivesByReligionFeedback', 'incentivesByReligionFeedbackForm'],
        ['incentivesByDisabilityFeedback', 'incentivesByDisabilityFeedbackForm'],
        ['incentivesBySexualOrientationFeedback', 'incentivesBySexualOrientationFeedbackForm'],
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        ['incentivesByEthnicityFeedback', 'incentivesByEthnicityFeedbackForm'],
        ['incentivesByAgeFeedback', 'incentivesByAgeFeedbackForm'],
        ['incentivesByReligionFeedback', 'incentivesByReligionFeedbackForm'],
        ['incentivesByDisabilityFeedback', 'incentivesByDisabilityFeedbackForm'],
        ['incentivesBySexualOrientationFeedback', 'incentivesBySexualOrientationFeedbackForm'],
      ])
    })
  })
})

function testValidFeedbackSubmission<PageClass extends AnalyticsPage>(pageClass: new () => PageClass, feedbackBoxes) {
  feedbackBoxes.forEach(([feedbackBox, feedbackForm]) => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "yes"
    page[feedbackBox].click()
    page[feedbackForm].find('[name=chartUseful][value=yes]').click()
    page[feedbackForm].submit()

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
  feedbackBoxes.forEach(([feedbackBox, feedbackForm]) => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "no", typing some comments
    page[feedbackBox].click()
    page[feedbackForm].find('[name=chartUseful][value=no]').click()
    page[feedbackForm].find('[name=noComments]').type('I’m confused')
    page[feedbackForm].submit()

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
    page[feedbackBox].parent().should('have.attr', 'open')
    // "no" should already be checked
    page[feedbackForm].find('[name=chartUseful][value=no]').should('have.attr', 'checked')
    // typed comments should still be there
    page[feedbackForm].find('[name=noComments]').should('have.value', 'I’m confused')
    // same error message should show
    page[feedbackForm].find('p.govuk-error-message').contains('Select a reason for your answer')
  })
}
