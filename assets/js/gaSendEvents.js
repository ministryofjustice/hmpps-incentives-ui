function gaSendEvent() {
  const elem = $(this)

  const gaCategory = elem.data('ga-category')
  let gaAction = elem.data('ga-action')
  const gaLabel = $('#ga-label').data('ga-label')

  // for sorting events, add sort order to GA action
  const previousSortOrder = elem.attr('aria-sort')
  if (previousSortOrder) {
    if (previousSortOrder === 'ascending') {
      gaAction += ' (descending)'
    } else {
      gaAction += ' (ascending)'
    }
  }

  // universal analytics
  if (typeof ga === typeof Function) {
    ga('send', 'event', gaCategory, gaAction, gaLabel)
  }

  // google analytics 4
  if (typeof gtag === typeof Function) {
    gtag('event', 'incentives_event', {
      category: gaCategory,
      action: gaAction,
      label: gaLabel,
    })
  }
}

$(() => {
  $('.govuk-tabs__tab[data-ga-category]').on('focus', gaSendEvent)
  $('.govuk-table a[data-ga-category]').on('click', gaSendEvent)
  $('.govuk-table .govuk-table__header[data-ga-category]').on('click', gaSendEvent)
})
