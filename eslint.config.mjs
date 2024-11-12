import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraFrontendGlobals: {
    // jquery
    $: 'readable',
    // GA4
    gtag: 'readable',
  },
})
