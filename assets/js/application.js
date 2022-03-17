window.GOVUKFrontend.initAll()
window.MOJFrontend.initAll()

$(() => {
  // track opening/closing of <details> when labelled with GA category
  $('.govuk-details').on('toggle', e => {
    const $details = $(e.target)
    const eventCategory = $details.data('ga-category')
    const eventAction = $details.prop('open') ? 'opened' : 'closed'
    const eventLabel = $details.data('ga-label') || ''
    if (eventCategory && typeof ga === 'function') {
      ga('send', 'event', eventCategory, eventAction, eventLabel)
    }
  })
})
