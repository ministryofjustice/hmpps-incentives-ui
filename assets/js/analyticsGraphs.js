$(function () {
  $('.app-chart-table__percentage-cell-bar').each(function () {
    var $el = $(this)
    $el.css('width', $el.data('style-width'))
  })
  $('.app-chart-table--heatmap__cell, .app-chart-legend__swatch').each(function () {
    var $el = $(this)
    $el.css('background', $el.data('style-background'))
  })
})
