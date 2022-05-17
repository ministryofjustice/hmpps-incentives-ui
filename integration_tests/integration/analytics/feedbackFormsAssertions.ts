import Page from '../../pages/page'
import { AnalyticsPage } from '../../pages/analytics'

export function testValidFeedbackSubmission<PageClass extends AnalyticsPage>(
  pageClass: new () => PageClass,
  feedbackBoxes
) {
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

export function testInvalidFeedbackSubmission<PageClass extends AnalyticsPage>(
  pageClass: new () => PageClass,
  feedbackBoxes
) {
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
