const path = require('node:path')

const esbuild = require('esbuild')
const { clean } = require('esbuild-plugin-clean')
const { copy } = require('esbuild-plugin-copy')
const { sassPlugin } = require('esbuild-sass-plugin')
const { glob } = require('glob')

/**
 * @param {BuildConfig} buildConfig
 * @returns {Promise}
 */
const buildAdditionalAssets = buildConfig => {
  return esbuild.build({
    outdir: buildConfig.assets.outDir,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: buildConfig.assets.copy,
      }),
    ],
  })
}

/**
 * @param {BuildConfig} buildConfig
 * @returns {Promise}
 */
const buildAssets = buildConfig => {
  return esbuild.build({
    entryPoints: buildConfig.assets.entryPoints,
    outdir: buildConfig.assets.outDir,
    entryNames: '[ext]/app',
    minify: buildConfig.isProduction,
    sourcemap: !buildConfig.isProduction,
    platform: 'browser',
    target: 'es2018',
    external: ['/assets/*'],
    bundle: true,
    plugins: [
      clean({
        patterns: glob.sync(buildConfig.assets.clear),
      }),
      sassPlugin({
        quietDeps: true,
        loadPaths: [path.join(process.cwd(), 'node_modules'), process.cwd()],
      }),
    ],
  })
}

/**
 * @param {BuildConfig} buildConfig
 */
module.exports = buildConfig => {
  process.stderr.write('\u{1b}[36m→ Building assets…\u{1b}[0m\n')

  Promise.all([buildAssets(buildConfig), buildAdditionalAssets(buildConfig)]).catch(e => {
    process.stderr.write(e)
    process.stderr.write('\n')
    process.exit(1)
  })
}
