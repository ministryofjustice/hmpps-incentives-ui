$(function () {
  // record incentive level confirmation page
  $('.govuk-button').on('click', function (e) {
    const $prompt = $(e.target)
    const gaId = $prompt.data('ga-id')
    const caseload = $prompt.data('case-load')
    if (gaId && typeof gtag === 'function') {
      gtag('event', 'click', {
        event_category: gaId,
        event_label: caseload,
      })
    }
  })
})
