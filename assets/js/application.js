import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'

import './date-picker'

govukFrontend.initAll()
mojFrontend.initAll()

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

  // google analytics 4
  if (typeof gtag === 'function') {
    gtag('event', 'incentives_event', {
      category: gaCategory,
      action: gaAction,
      label: gaLabel,
    })
  }
}

$(function pageLoaded() {
  // track clicks in reviews table
  $('.govuk-tabs__tab[data-ga-category]').on('focus', gaSendEvent)
  $('.govuk-table a[data-ga-category]').on('click', gaSendEvent)
  $('.govuk-table .govuk-table__header[data-ga-category]').on('click', gaSendEvent)

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

  // setup charts where inline styles are needed but disallowed by CSP
  $('.app-chart-table__percentage-cell-bar').each((_, element) => {
    const $el = $(element)
    $el.css('width', $el.data('style-width'))
  })
  $('.app-chart-table--heatmap__cell, .app-chart-legend__swatch').each((_, element) => {
    const $el = $(element)
    $el.css('background', $el.data('style-background'))
  })
  $('.app-chart-table__group span').each((_, element) => {
    const $el = $(element)
    $el.css('height', $el.data('style-height'))
  })

  // track button clicks, currently on record incentive level confirmation page
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
