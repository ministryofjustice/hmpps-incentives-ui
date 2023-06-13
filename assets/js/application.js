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
    if (eventCategory && typeof gtag === 'function') {
      gtag('event', 'incentives_event', {
        category: eventCategory,
        action: eventAction,
        label: eventLabel,
      })
    }
  })

  // for clickable cards, forward a click anywhere inside it to single contained link, if it exists
  $('.dps-card--clickable').each((index, card) => {
    const $links = $('.dps-card__link', card)
    if ($links.length === 1) {
      const $card = $(card)
      $card.on('click', e => {
        if (e.target.nodeName !== 'A') {
          e.stopPropagation()
          $links[0].click()
        }
      })
    }
  })
})
