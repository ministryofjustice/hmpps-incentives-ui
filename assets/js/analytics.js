$(() => {
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
})
