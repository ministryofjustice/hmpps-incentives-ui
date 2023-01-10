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

  // for clickable cards, forward a click anywhere inside it to single contained link, if it exists
  $('.card--clickable').each((index, card) => {
    const $links = $('.card__link', card)
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

  // Dismissable notification banners
  function hideBanner(event) {
    const dismissLink = $(this)
    const id = dismissLink.data('notification-id')

    const notificationBanner = dismissLink.parents('.govuk-notification-banner')
    const csrf = $('#_csrf').val()

    $.ajax({
      type: 'POST',
      url: '/notification/dismiss',
      headers: {
        'X-CSRF-Token': csrf,
      },
      data: { id },
    }).done(() => notificationBanner.hide())

    event.preventDefault()
  }

  $('.notification_dismiss_link').on('click', hideBanner)
})
