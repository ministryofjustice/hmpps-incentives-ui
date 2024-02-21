$(() => {
  // record incentive level confirmation page
  $('.govuk-button').on('click', e => {
    const $prompt = $(e.target)
    const gaCategory = $prompt.data('ga-category')
    const gaAction = $prompt.data('ga-action')
    if (gaCategory && gaAction && typeof gtag === 'function') {
      gtag('event', 'incentives_event', {
        category: gaCategory,
        action: gaAction,
      })
    }
  })
})
