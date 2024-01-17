$(function () {

  // record incentive level confirmation page
  $('.govuk-button').on('click', function (e) {
    const $prompt = $(e.target)
    const gaCategory = $prompt.data('ga-category')
    const gaAction = $prompt.data('ga-action')

    if (gaCategory && typeof gtag === 'function') {
      gtag('event', 'incentives_event', {
        category: gaCategory,
        action: gaAction,
      })
    }
  })
})
