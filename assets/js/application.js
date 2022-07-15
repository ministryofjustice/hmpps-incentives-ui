window.GOVUKFrontend.initAll()
window.MOJFrontend.initAll()

$(() => {
  // track opening of <details> when labelled with GA category
  $('.govuk-details').on('toggle', e => {
    const $details = $(e.target)

    if (!$details.prop('open')) {
      // only send GA events when opened
      return
    }

    const eventCategory = $details.data('ga-category')
    const eventAction = 'opened'
    const eventLabel = $details.data('ga-label') || ''
    if (eventCategory && typeof ga === 'function') {
      ga('send', 'event', eventCategory, eventAction, eventLabel)
    }
    if (eventCategory && typeof gtag === 'function') {
      gtag('event', 'incentives_event', {
        category: eventCategory,
        action: eventAction,
        label: eventLabel,
      })
    }
  })
})
