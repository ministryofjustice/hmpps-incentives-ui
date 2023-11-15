import type { UserRole } from '../../server/data/manageUsersApiClient'
import type { PrisonIncentiveLevel } from '../../server/data/incentivesApi'
import { sampleIncentiveLevels, samplePrisonIncentiveLevels } from '../../server/testData/incentivesApi'
import Page from '../pages/page'
import HomePage from '../pages/home'
import PrisonIncentiveLevelPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevel'
import PrisonIncentiveLevelNextAddFormPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevelNextAddForm'
import PrisonIncentiveLevelEditFormPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevelEditForm'
import PrisonIncentiveLevelDeactivateFormPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevelDeactivateForm'
import PrisonIncentiveLevelsPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevels'

context('Prison incentive level management', () => {
  beforeEach(() => {
    const roles: UserRole[] = [{ roleCode: 'ROLE_MAINTAIN_PRISON_IEP_LEVELS' }]
    cy.task('reset')
    cy.task('stubSignIn', { roles })
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentiveLevels')
    cy.task('stubIncentiveLevel')
    cy.task('stubPrisonIncentiveLevels')
    cy.task('stubPrisonIncentiveLevel')

    cy.signIn()
  })

  it('shows list of levels and details of a level', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.managePrisonIncentiveLevelsLink().click()

    const listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.checkLastBreadcrumb('Incentives', '/')

    listPage.contentsOfTable.should('have.all.key', 'Basic', 'Standard', 'Enhanced')
    listPage.contentsOfTable.its('Standard').its('tags').should('contain', 'Default')

    listPage.findTableLink(1, 'View settings').click()

    const detailPage = Page.verifyOnPage(PrisonIncentiveLevelPage, 'Standard')
    detailPage.checkLastBreadcrumb('Incentive level settings', '/prison-incentive-levels')

    detailPage.contentsOfTables
      .should('have.length', 4)
      .should('deep.equal', [
        { 'Default for new prisoners': 'Yes' },
        { 'Remand prisoners': '£60.50 per week', 'Convicted prisoners': '£19.80 per week' },
        { 'Remand prisoners': '£605', 'Convicted prisoners': '£198' },
        { 'Visits (VO)': '1', 'Privileged visits (PVO)': '2' },
      ])

    detailPage.returnLink.click()
    Page.verifyOnPage(PrisonIncentiveLevelsPage)
  })

  it('should allow adding a new level', () => {
    const enhanced2: PrisonIncentiveLevel = {
      ...samplePrisonIncentiveLevels[2],
      levelCode: 'EN2',
      levelName: 'Enhanced 2',
    }
    cy.task('stubPatchPrisonIncentiveLevel', { prisonIncentiveLevel: enhanced2 })
    cy.task('stubPrisonIncentiveLevel', { prisonIncentiveLevel: enhanced2 })
    cy.task('stubIncentiveLevel', { incentiveLevel: sampleIncentiveLevels[3] })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.managePrisonIncentiveLevelsLink().click()

    const listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.addLink.click()

    const addPage = Page.verifyOnPage(PrisonIncentiveLevelNextAddFormPage, 'Enhanced 2')
    addPage.checkLastBreadcrumb('Incentive level settings', '/prison-incentive-levels')

    addPage.form.submit() // empty form
    Page.verifyOnPage(PrisonIncentiveLevelNextAddFormPage, 'Enhanced 2')
    addPage.errorSummaryTitle.should('contain.text', 'There is a problem')

    /* only applies when adding user-selected level
    addPage.levelCodeRadios.then($radios => {
      const levelNames = $radios.map((_index, div) => div.textContent.trim()).toArray()
      expect(levelNames).to.deep.equal(['Enhanced 2', 'Enhanced 3'])
    })
    addPage.levelCodeRadios.eq(0).find('label').click() // select EN2
     */

    addPage.getInputField('remandTransferLimit').type('66.00')
    addPage.getInputField('convictedTransferLimit').type('44')
    addPage.getInputField('remandSpendLimit').type('660.00')
    addPage.getInputField('convictedSpendLimit').type('440')
    addPage.getInputField('visitOrders').type('1')
    addPage.getInputField('privilegedVisitOrders').type('3')
    addPage.form.submit() // form should now be valid

    const detailPage = Page.verifyOnPage(PrisonIncentiveLevelPage, 'Enhanced 2')
    detailPage.messages.should('contain.text', 'Enhanced 2').should('contain.text', 'added')
    detailPage.contentsOfTables.its(0).its('Default for new prisoners').should('eq', 'No')
  })

  it('should allow removing a non-required level', () => {
    const enhanced2: PrisonIncentiveLevel = {
      ...samplePrisonIncentiveLevels[2],
      levelCode: 'EN2',
      levelName: 'Enhanced 2',
    }
    const prisonIncentiveLevels: PrisonIncentiveLevel[] = [
      ...samplePrisonIncentiveLevels.filter(prisonIncentiveLevel => prisonIncentiveLevel.active),
      enhanced2,
    ]
    cy.task('stubPrisonIncentiveLevels', { prisonId: 'MDI', prisonIncentiveLevels })
    cy.task('stubPatchPrisonIncentiveLevel', { prisonIncentiveLevel: { ...enhanced2, active: false } })
    cy.task('stubPrisonIncentiveLevel', { prisonIncentiveLevel: enhanced2 })
    cy.task('stubIncentiveLevel', { incentiveLevel: sampleIncentiveLevels[3] })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.managePrisonIncentiveLevelsLink().click()
    let listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.contentsOfTable.should('have.all.key', 'Basic', 'Standard', 'Enhanced', 'Enhanced 2')

    listPage.findTableLink(3, 'Remove level').click()

    let deactivatePage = Page.verifyOnPage(PrisonIncentiveLevelDeactivateFormPage)
    deactivatePage.checkLastBreadcrumb('Incentive level settings', '/prison-incentive-levels')

    deactivatePage.form.submit() // empty form
    Page.verifyOnPage(PrisonIncentiveLevelDeactivateFormPage)
    deactivatePage.errorSummaryTitle.should('contain.text', 'There is a problem')

    deactivatePage.confirmationRadios.eq(1).find('label').click()
    deactivatePage.form.submit() // form should now be valid

    listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.messages.should('not.exist')

    listPage.findTableLink(3, 'Remove level').click()

    deactivatePage = Page.verifyOnPage(PrisonIncentiveLevelDeactivateFormPage)
    deactivatePage.confirmationRadios.eq(0).find('label').click()
    deactivatePage.form.submit() // form should now be valid

    listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.messages.should('contain.text', 'Enhanced 2').should('contain.text', 'has been removed')
  })

  it('should allow editing an existing level', () => {
    cy.task('stubPatchPrisonIncentiveLevel', { prisonIncentiveLevel: samplePrisonIncentiveLevels[0] })
    cy.task('stubPrisonIncentiveLevel', { prisonIncentiveLevel: samplePrisonIncentiveLevels[0] })
    cy.task('stubIncentiveLevel', { incentiveLevel: sampleIncentiveLevels[0] })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.managePrisonIncentiveLevelsLink().click()
    const listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.findTableLink(0, 'View settings').click()

    let detailPage = Page.verifyOnPage(PrisonIncentiveLevelPage, 'Basic')
    detailPage.changeLink.click()

    const editPage = Page.verifyOnPage(PrisonIncentiveLevelEditFormPage, 'Basic')
    editPage.checkLastBreadcrumb('Incentive level settings', '/prison-incentive-levels')

    editPage.getInputField('convictedTransferLimit').clear()
    editPage.form.submit() // 1 invalid field
    Page.verifyOnPage(PrisonIncentiveLevelEditFormPage, 'Basic')
    editPage.errorSummaryTitle.should('contain.text', 'There is a problem')
    editPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Transfer limit for convicted prisoners must be in pounds and pence')
    })

    editPage.getInputField('convictedTransferLimit').type('5.80')
    editPage.getInputField('privilegedVisitOrders').clear().type('1')
    editPage.form.submit() // form should now be valid

    detailPage = Page.verifyOnPage(PrisonIncentiveLevelPage, 'Basic')
    detailPage.messages.should('contain.text', 'Basic').should('contain.text', 'saved')
  })
})
